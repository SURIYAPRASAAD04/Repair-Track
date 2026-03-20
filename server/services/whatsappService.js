/**
 * WhatsApp Service — @whiskeysockets/baileys (production-grade)
 * 
 * Uses Baileys WebSocket protocol — NO Chrome/Puppeteer needed.
 * Fetches latest WhatsApp Web version to prevent 405 errors.
 */
const qrcode = require('qrcode');
const path = require('path');
const fs = require('fs');
const pino = require('pino');
const Shop = require('../models/Shop');
const MessageLog = require('../models/MessageLog');
const Job = require('../models/Job');

const clients = {};   // { userId: { sock, qr, ready, authenticating, initError, reconnects } }
const logger = pino({ level: 'warn' });

// Dynamic import — @whiskeysockets/baileys is ESM
let _baileys = null;
async function loadBaileys() {
  if (!_baileys) {
    _baileys = await import('@whiskeysockets/baileys');
  }
  return _baileys;
}

// Per-user message queue
const sendQueues = {};
function enqueue(userId, fn) {
  if (!sendQueues[userId]) sendQueues[userId] = Promise.resolve();
  sendQueues[userId] = sendQueues[userId].then(fn, fn);
  return sendQueues[userId];
}

// ── Create Session ──────────────────────────────────────────────────────────

async function createSession(userId) {
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

    // Fetch current WhatsApp Web version (prevents 405 "Method Not Allowed")
    let version;
    try {
      const versionInfo = await fetchLatestBaileysVersion();
      version = versionInfo.version;
      console.log(`[WhatsApp] Using WA Web version: ${version.join('.')}`);
    } catch (e) {
      console.warn('[WhatsApp] Could not fetch WA version, using default:', e.message);
    }

    // Auth state — unique per user
    const authDir = path.join(__dirname, '../.baileys_auth', `session-${userId}`);
    fs.mkdirSync(authDir, { recursive: true });
    const { state, saveCreds } = await useMultiFileAuthState(authDir);

    console.log(`[WhatsApp] Creating socket for user ${userId}`);

    const sock = makeWASocket({
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      version,
      printQRInTerminal: false,
      logger,
      browser: ['RepairTrack', 'Chrome', '131.0.6778.204'],
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 30000,
      markOnlineOnConnect: false,
      generateHighQualityLinkPreview: false,
    });

    // Store session
    clients[userId] = {
      sock, qr: null, ready: false, authenticating: false,
      initError: null, reconnects: 0
    };

    // Save creds on update
    sock.ev.on('creds.update', saveCreds);

    // ── Connection events ─────────────────────────────────────────────────
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      // QR code received — send to frontend
      if (qr) {
        console.log(`[WhatsApp] QR generated for user ${userId}`);
        try {
          if (clients[userId]) {
            clients[userId].qr = await qrcode.toDataURL(qr);
            clients[userId].authenticating = false;
            clients[userId].initError = null;
          }
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

      // Connection closed
      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const reason = lastDisconnect?.error?.output?.payload?.message || 'unknown';
        console.log(`[WhatsApp] Disconnected user ${userId}: status=${statusCode}, reason=${reason}`);

        // Session permanently invalid — require fresh QR
        if ([401, 403, 405, 440].includes(statusCode)) {
          console.log(`[WhatsApp] Session invalid (${statusCode}), clearing auth for ${userId}`);
          const authDir = path.join(__dirname, '../.baileys_auth', `session-${userId}`);
          try { fs.rmSync(authDir, { recursive: true, force: true }); } catch (e) {}
          
          if (clients[userId]) {
            clients[userId].ready = false;
            clients[userId].initError = 'Session expired. Click Connect to scan QR again.';
          }
          await Shop.findByIdAndUpdate(userId, { whatsappConnected: false }).catch(() => {});
          try { sock.end(); } catch (e) {}
          return;
        }

        // Auto-reconnect on transient errors (515 = restartRequired after QR scan)
        const count = (clients[userId]?.reconnects || 0) + 1;
        if (count <= 5) {
          console.log(`[WhatsApp] Auto-reconnecting ${userId} (${count}/5, status=${statusCode})...`);
          try { sock.end(); } catch (e) {}
          delete clients[userId];
          setTimeout(() => {
            createSession(userId).then(() => {
              if (clients[userId]) clients[userId].reconnects = count;
            }).catch(e => console.error(`[WhatsApp] Reconnect error:`, e.message));
          }, 2000);
        } else {
          console.log(`[WhatsApp] Max reconnects reached for ${userId}`);
          if (clients[userId]) {
            clients[userId].ready = false;
            clients[userId].initError = 'Connection failed. Click Connect to retry.';
          }
          await Shop.findByIdAndUpdate(userId, { whatsappConnected: false }).catch(() => {});
          try { sock.end(); } catch (e) {}
        }
      }
    });

    return { success: true, message: 'Session starting. Poll /qr endpoint.' };

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
    error: session.initError
  };
}

// ── Get Status ──────────────────────────────────────────────────────────────

async function getStatus(userId) {
  const session = clients[userId];
  return { connected: !!(session && session.ready) };
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

        // Log success
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

module.exports = { createSession, getQR, getStatus, sendMessage, disconnectSession };
