/**
 * WhatsApp Service — @whiskeysockets/baileys (production)
 * 
 * Uses Baileys WebSocket protocol. No Chrome/Puppeteer needed.
 * Supports QR code (desktop) and Pairing Code (mobile).
 * Based on official Baileys example: https://github.com/WhiskeySockets/Baileys
 */
const qrcode = require('qrcode');
const path = require('path');
const fs = require('fs');
const pino = require('pino');
const Shop = require('../models/Shop');
const MessageLog = require('../models/MessageLog');
const Job = require('../models/Job');

const clients = {};
const logger = pino({ level: 'warn' });

// Dynamic import — @whiskeysockets/baileys is ESM
let _baileys = null;
async function loadBaileys() {
  if (!_baileys) {
    _baileys = await import('@whiskeysockets/baileys');
  }
  return _baileys;
}

// Per-user message queue (serialise sends per user)
const sendQueues = {};
function enqueue(userId, fn) {
  if (!sendQueues[userId]) sendQueues[userId] = Promise.resolve();
  sendQueues[userId] = sendQueues[userId].then(fn, fn);
  return sendQueues[userId];
}

// ── Create Session ──────────────────────────────────────────────────────────
// pairingPhone: if set, uses pairing code auth instead of QR code
async function createSession(userId, pairingPhone = null) {
  const existing = clients[userId];
  if (existing && existing.ready) return { alreadyConnected: true };
  if (existing && existing.sock && !existing.initError) return { success: true, message: 'Already initializing' };

  // Cleanup broken session
  if (existing) {
    try { existing.sock?.end(); } catch (e) {}
    delete clients[userId];
  }

  try {
    const {
      default: makeWASocket,
      useMultiFileAuthState,
      makeCacheableSignalKeyStore,
      fetchLatestBaileysVersion,
      DisconnectReason,
    } = await loadBaileys();

    // Fetch current WhatsApp Web version (prevents 405)
    let version;
    try {
      const versionInfo = await fetchLatestBaileysVersion();
      version = versionInfo.version;
      console.log(`[WhatsApp] Using WA Web version: ${version.join('.')}`);
    } catch (e) {
      console.warn('[WhatsApp] Could not fetch WA version, using default');
    }

    // Auth state per user
    const authDir = path.join(__dirname, '../.baileys_auth', `session-${userId}`);
    fs.mkdirSync(authDir, { recursive: true });
    const { state, saveCreds } = await useMultiFileAuthState(authDir);

    console.log(`[WhatsApp] Creating socket for user ${userId} (pairing=${!!pairingPhone})`);

    const sock = makeWASocket({
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      version,
      printQRInTerminal: false,
      logger,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      markOnlineOnConnect: false,
      generateHighQualityLinkPreview: false,
    });

    // Store session
    clients[userId] = {
      sock, qr: null, ready: false, authenticating: false,
      initError: null, reconnects: 0,
      pairingPhone: pairingPhone,  // null = QR mode, string = pairing mode
      pairingCode: null,
    };

    // Save creds on update
    sock.ev.on('creds.update', saveCreds);

    // ── Connection events (follows official Baileys example.ts pattern) ────
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      // QR code received
      if (qr) {
        const session = clients[userId];
        if (!session) return;

        // PAIRING MODE: call requestPairingCode ONLY ONCE on first QR event
        // Each call invalidates the previous code, so we must NOT re-request
        if (session.pairingPhone && !sock.authState.creds.registered) {
          if (!session.pairingCodeSent) {
            try {
              console.log(`[WhatsApp] Requesting pairing code for ${session.pairingPhone}...`);
              const code = await sock.requestPairingCode(session.pairingPhone);
              console.log(`[WhatsApp] ✅ Pairing code generated: ${code}`);
              session.pairingCode = code;
              session.pairingCodeSent = true; // Don't request again
              session.authenticating = false;
              session.initError = null;
            } catch (e) {
              console.error('[WhatsApp] Pairing code request failed:', e.message);
              session.initError = 'Failed to generate pairing code. Try again.';
            }
          } else {
            console.log(`[WhatsApp] Ignoring QR event (pairing code already sent)`);
          }
          return; // Don't store QR when in pairing mode
        }

        // QR MODE: generate QR image for frontend
        console.log(`[WhatsApp] QR generated for user ${userId}`);
        try {
          session.qr = await qrcode.toDataURL(qr);
          session.authenticating = false;
          session.initError = null;
        } catch (e) {
          console.error('[WhatsApp] QR encode error:', e.message);
        }
      }

      // Connected successfully
      if (connection === 'open') {
        console.log(`[WhatsApp] ✅ CONNECTED for user ${userId}`);
        if (clients[userId]) {
          clients[userId].ready = true;
          clients[userId].authenticating = false;
          clients[userId].qr = null;
          clients[userId].pairingCode = null;
          clients[userId].initError = null;
          clients[userId].reconnects = 0;
        }
        await Shop.findByIdAndUpdate(userId, { whatsappConnected: true }).catch(e =>
          console.error('[WhatsApp] DB error:', e.message)
        );
      }

      // Connecting
      if (connection === 'connecting') {
        console.log(`[WhatsApp] Connecting for user ${userId}...`);
        if (clients[userId]) {
          clients[userId].authenticating = true;
        }
      }

      // Connection closed — follow official example: reconnect unless loggedOut
      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const reason = lastDisconnect?.error?.output?.payload?.message || 'unknown';
        const savedPairingPhone = clients[userId]?.pairingPhone;
        console.log(`[WhatsApp] Disconnected user ${userId}: status=${statusCode}, reason=${reason}`);

        try { sock.end(); } catch (e) {}

        // loggedOut = 401 with reason "Stream Errored" or explicit logout
        // Per official example: reconnect on everything EXCEPT loggedOut
        if (statusCode === DisconnectReason.loggedOut) {
          console.log(`[WhatsApp] User ${userId} logged out, clearing auth`);
          const authDir = path.join(__dirname, '../.baileys_auth', `session-${userId}`);
          try { fs.rmSync(authDir, { recursive: true, force: true }); } catch (e) {}
          if (clients[userId]) {
            clients[userId].ready = false;
            clients[userId].initError = 'Logged out. Click Connect to scan again.';
          }
          await Shop.findByIdAndUpdate(userId, { whatsappConnected: false }).catch(() => {});
          return;
        }

        // 405 = stale session (old whatsapp-web.js auth etc.)
        if (statusCode === 405) {
          console.log(`[WhatsApp] Stale session for ${userId}, clearing auth`);
          const authDir = path.join(__dirname, '../.baileys_auth', `session-${userId}`);
          try { fs.rmSync(authDir, { recursive: true, force: true }); } catch (e) {}
        }

        // Auto-reconnect (max 5 times)
        const count = (clients[userId]?.reconnects || 0) + 1;
        delete clients[userId];

        if (count <= 5) {
          console.log(`[WhatsApp] Reconnecting ${userId} (${count}/5)...`);
          setTimeout(() => {
            createSession(userId, savedPairingPhone).then(() => {
              if (clients[userId]) clients[userId].reconnects = count;
            }).catch(e => console.error('[WhatsApp] Reconnect error:', e.message));
          }, 2000 * count); // Back off: 2s, 4s, 6s, 8s, 10s
        } else {
          console.log(`[WhatsApp] Max reconnects reached for ${userId}`);
          clients[userId] = {
            sock: null, qr: null, ready: false, authenticating: false,
            initError: 'Connection failed. Click Connect to retry.',
            reconnects: 0, pairingPhone: null, pairingCode: null,
          };
          await Shop.findByIdAndUpdate(userId, { whatsappConnected: false }).catch(() => {});
        }
      }
    });

    return { success: true, message: pairingPhone ? 'Pairing session started' : 'QR session started' };

  } catch (err) {
    console.error(`[WhatsApp] createSession error for ${userId}:`, err);
    if (clients[userId]) {
      clients[userId].initError = err.message;
    }
    return { success: false, message: err.message };
  }
}

// ── Get QR ──────────────────────────────────────────────────────────────────

async function getQR(userId) {
  const session = clients[userId];
  if (!session) return { qr: null, ready: false, authenticating: false, error: 'No session' };
  return {
    qr: session.qr,
    ready: session.ready,
    authenticating: session.authenticating,
    error: session.initError,
    pairingCode: session.pairingCode, // non-null when pairing code is ready
  };
}

// ── Get Status ──────────────────────────────────────────────────────────────

async function getStatus(userId) {
  const session = clients[userId];
  return { connected: !!(session && session.ready) };
}

// ── Request Pairing Code ────────────────────────────────────────────────────
// Creates a session in pairing mode instead of QR mode

async function requestPairingCode(userId, phoneNumber) {
  let cleanPhone = phoneNumber.replace(/\D/g, '');
  if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`;

  // If already connected, no need
  const existing = clients[userId];
  if (existing && existing.ready) return { alreadyConnected: true };

  // Clean up any existing session
  if (existing) {
    try { existing.sock?.end(); } catch (e) {}
    delete clients[userId];
  }

  // Create session with pairingPhone — the QR handler will call requestPairingCode
  await createSession(userId, cleanPhone);

  // Wait for the pairing code to be generated (max 20s)
  let waited = 0;
  while (waited < 20000) {
    const session = clients[userId];
    if (session?.pairingCode) {
      return { success: true, code: session.pairingCode };
    }
    if (session?.initError) {
      throw new Error(session.initError);
    }
    if (session?.ready) {
      return { alreadyConnected: true };
    }
    await new Promise(r => setTimeout(r, 500));
    waited += 500;
  }

  throw new Error('Timed out waiting for pairing code');
}

// ── Send Message ────────────────────────────────────────────────────────────

async function sendMessage(userId, phone, message, jobId = null, customerName = null, triggerEvent = 'manual_message') {
  return enqueue(userId, async () => {
    const session = clients[userId];
    if (!session || !session.ready || !session.sock) {
      await Shop.findByIdAndUpdate(userId, { whatsappConnected: false }).catch(() => {});
      throw new Error('WhatsApp not connected');
    }

    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`;
    const jid = `${cleanPhone}@s.whatsapp.net`;

    // Check if number is on WhatsApp
    try {
      const [result] = await session.sock.onWhatsApp(cleanPhone);
      if (!result?.exists) {
        console.error(`[WhatsApp] ❌ ${cleanPhone} is NOT on WhatsApp`);
        MessageLog.create({
          shopId: userId, jobId, customerPhone: cleanPhone, customerName,
          messageContent: message, triggerEvent, status: 'failed',
          errorReason: 'Number not on WhatsApp'
        }).catch(() => {});
        throw new Error(`${cleanPhone} is not registered on WhatsApp`);
      }
      console.log(`[WhatsApp] ✅ ${cleanPhone} is on WhatsApp`);
    } catch (err) {
      if (err.message.includes('not registered')) throw err;
      console.warn(`[WhatsApp] Number check failed:`, err.message);
    }

    // Send with retries
    const MAX_RETRIES = 3;
    let lastError = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (!clients[userId]?.ready) throw new Error('WhatsApp disconnected');

        console.log(`[WhatsApp] Sending to ${cleanPhone} (attempt ${attempt}/${MAX_RETRIES})`);
        await clients[userId].sock.sendMessage(jid, { text: message });
        console.log(`[WhatsApp] ✅ Sent to ${cleanPhone} on attempt ${attempt}`);

        MessageLog.create({
          shopId: userId, jobId, customerPhone: cleanPhone, customerName,
          messageContent: message, triggerEvent, status: 'sent'
        }).catch(e => console.error('[WhatsApp] Log error:', e.message));

        if (jobId) {
          Job.findByIdAndUpdate(jobId, {
            lastMessageSent: new Date(), $inc: { messagesSentCount: 1 }
          }).catch(e => console.error('[WhatsApp] Job update error:', e.message));
        }

        return { success: true };
      } catch (err) {
        lastError = err;
        console.error(`[WhatsApp] Send attempt ${attempt} failed:`, err.message);
        if (attempt < MAX_RETRIES) await new Promise(r => setTimeout(r, 3000));
      }
    }

    console.error(`[WhatsApp] ❌ All sends failed for ${cleanPhone}`);
    MessageLog.create({
      shopId: userId, jobId, customerPhone: cleanPhone, customerName,
      messageContent: message, triggerEvent, status: 'failed',
      errorReason: lastError?.message || 'Unknown'
    }).catch(() => {});

    throw new Error(`Failed to send: ${lastError?.message}`);
  });
}

// ── Disconnect ──────────────────────────────────────────────────────────────

async function disconnectSession(userId) {
  if (clients[userId]) {
    try { await clients[userId].sock?.logout(); } catch (e) {}
    try { clients[userId].sock?.end(); } catch (e) {}
    const authDir = path.join(__dirname, '../.baileys_auth', `session-${userId}`);
    try { fs.rmSync(authDir, { recursive: true, force: true }); } catch (e) {}
    delete clients[userId];
  }
  await Shop.findByIdAndUpdate(userId, { whatsappConnected: false }).catch(() => {});
  return { success: true };
}

// Graceful shutdown
process.on('SIGINT', async () => {
  for (const id in clients) { try { clients[id].sock?.end(); } catch (e) {} }
  process.exit(0);
});

module.exports = { createSession, getQR, getStatus, sendMessage, disconnectSession, requestPairingCode };
