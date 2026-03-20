/**
 * WhatsApp Service — Baileys (WebSocket-based, no Chrome/Puppeteer)
 * 
 * Uses @whiskeysockets/baileys which connects directly via WebSocket.
 * No headless browser needed = works on any hosting tier.
 */
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore } = require('baileys');
const qrcode = require('qrcode');
const path = require('path');
const pino = require('pino');
const Shop = require('../models/Shop');
const MessageLog = require('../models/MessageLog');
const Job = require('../models/Job');

const clients = {};  // { userId: { sock, qr, ready, authenticating, initError } }

// Silent logger for Baileys (it's very verbose by default)
const logger = pino({ level: 'silent' });

// ── Per-user message queue ──────────────────────────────────────────────────
const sendQueues = {};
function enqueue(userId, fn) {
  if (!sendQueues[userId]) sendQueues[userId] = Promise.resolve();
  sendQueues[userId] = sendQueues[userId].then(fn, fn);
  return sendQueues[userId];
}

async function createSession(userId) {
  const existing = clients[userId];

  if (existing && existing.ready) {
    return { alreadyConnected: true };
  }

  // Already initializing
  if (existing && existing.sock && !existing.initError) {
    return { success: true, message: 'Already initializing' };
  }

  // Clean up any previous broken session
  if (existing) {
    try { existing.sock?.end(); } catch (e) {}
    delete clients[userId];
  }

  // Auth state — stores session in filesystem
  const authDir = path.join(__dirname, '../.wwebjs_auth', `session-${userId}`);
  const { state, saveCreds } = await useMultiFileAuthState(authDir);

  // Create the WebSocket connection
  const sock = makeWASocket({
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    printQRInTerminal: false,
    logger,
    browser: ['RepairTrack', 'Chrome', '131.0'],
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 30000,
    retryRequestDelayMs: 2000,
    markOnlineOnConnect: false,
  });

  // Store immediately so getQR can poll
  clients[userId] = { sock, qr: null, ready: false, authenticating: false, initError: null };

  // ── Save credentials whenever they update ─────────────────────────────────
  sock.ev.on('creds.update', saveCreds);

  // ── Connection events ─────────────────────────────────────────────────────
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    // QR code received
    if (qr) {
      console.log(`[WhatsApp] QR generated for user ${userId}`);
      try {
        clients[userId].qr = await qrcode.toDataURL(qr);
        clients[userId].authenticating = false;
        clients[userId].initError = null;
      } catch (e) {
        console.error('[WhatsApp] QR encode failed:', e.message);
      }
    }

    // Connection opened
    if (connection === 'open') {
      console.log(`[WhatsApp] ✅ READY for user ${userId}`);
      if (clients[userId]) {
        clients[userId].ready = true;
        clients[userId].authenticating = false;
        clients[userId].qr = null;
        clients[userId].initError = null;
      }
      await Shop.findByIdAndUpdate(userId, { whatsappConnected: true }).catch(e =>
        console.error('[WhatsApp] DB update failed:', e.message)
      );
    }

    // Connection closed
    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      
      console.log(`[WhatsApp] Connection closed for user ${userId}, status: ${statusCode}, reconnect: ${shouldReconnect}`);

      if (shouldReconnect) {
        // Baileys auto-reconnects are handled by recreating the socket
        console.log(`[WhatsApp] Reconnecting for user ${userId}...`);
        delete clients[userId];
        // Small delay before reconnecting
        setTimeout(() => {
          createSession(userId).catch(e => 
            console.error(`[WhatsApp] Reconnect failed for ${userId}:`, e.message)
          );
        }, 3000);
      } else {
        // User logged out — clear session
        console.log(`[WhatsApp] User ${userId} logged out, clearing session`);
        if (clients[userId]) {
          clients[userId].ready = false;
          clients[userId].initError = 'logged_out';
        }
        await Shop.findByIdAndUpdate(userId, { whatsappConnected: false }).catch(() => {});
        delete clients[userId];
      }
    }

    // Connecting state
    if (connection === 'connecting') {
      console.log(`[WhatsApp] Connecting for user ${userId}...`);
      if (clients[userId]) {
        clients[userId].authenticating = true;
      }
    }
  });

  return { success: true, message: 'Session starting. Poll /qr endpoint.' };
}

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

async function getStatus(userId) {
  const session = clients[userId];
  return { connected: !!(session && session.ready) };
}

// ── sendMessage with queue + retry ──────────────────────────────────────────

async function sendMessage(userId, phone, message, jobId = null, customerName = null, triggerEvent = 'manual_message') {
  return enqueue(userId, async () => {
    const session = clients[userId];

    if (!session || !session.ready) {
      await Shop.findByIdAndUpdate(userId, { whatsappConnected: false }).catch(() => {});
      throw new Error('WhatsApp not connected');
    }

    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`;
    const jid = `${cleanPhone}@s.whatsapp.net`;

    // ── Check if number is on WhatsApp ──────────────────────────────
    try {
      const [result] = await session.sock.onWhatsApp(cleanPhone);
      if (!result?.exists) {
        console.error(`[WhatsApp] ❌ ${cleanPhone} is NOT on WhatsApp`);
        MessageLog.create({
          shopId: userId, jobId, customerPhone: cleanPhone, customerName,
          messageContent: message, triggerEvent, status: 'failed',
          errorReason: 'Number not on WhatsApp'
        }).catch(() => {});
        throw new Error(`${cleanPhone} is not a WhatsApp number`);
      }
      console.log(`[WhatsApp] ✅ ${cleanPhone} is on WhatsApp`);
    } catch (checkErr) {
      if (checkErr.message.includes('not a WhatsApp')) throw checkErr;
      console.warn(`[WhatsApp] Number check failed, will try sending:`, checkErr.message);
    }

    // ── Send with retries ───────────────────────────────────────────
    const MAX_RETRIES = 3;
    let lastError = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (!clients[userId] || !clients[userId].ready) {
          throw new Error('WhatsApp disconnected during send');
        }

        console.log(`[WhatsApp] Sending to ${jid} (attempt ${attempt}/${MAX_RETRIES})`);

        const result = await session.sock.sendMessage(jid, { text: message });

        console.log(`[WhatsApp] ✅ Message sent to ${cleanPhone} on attempt ${attempt}`);

        // Log success
        MessageLog.create({
          shopId: userId, jobId, customerPhone: cleanPhone, customerName,
          messageContent: message, triggerEvent, status: 'sent'
        }).catch(e => console.error('[WhatsApp] MessageLog error:', e.message));

        if (jobId) {
          Job.findByIdAndUpdate(jobId, {
            lastMessageSent: new Date(), $inc: { messagesSentCount: 1 }
          }).catch(e => console.error('[WhatsApp] Job metric error:', e.message));
        }

        return { success: true };

      } catch (err) {
        lastError = err;
        console.error(`[WhatsApp] Send attempt ${attempt} failed:`, err.message);
        if (attempt < MAX_RETRIES) {
          await new Promise(r => setTimeout(r, 3000));
        }
      }
    }

    // All attempts failed
    console.error(`[WhatsApp] ❌ All ${MAX_RETRIES} sends failed for ${cleanPhone}`);

    MessageLog.create({
      shopId: userId, jobId, customerPhone: cleanPhone, customerName,
      messageContent: message, triggerEvent, status: 'failed',
      errorReason: lastError?.message || 'Unknown'
    }).catch(e => console.error('[WhatsApp] MessageLog error:', e.message));

    throw new Error(`WhatsApp failed to send: ${lastError?.message}`);
  });
}

async function disconnectSession(userId) {
  if (clients[userId]) {
    try {
      await clients[userId].sock.logout();
    } catch (e) {}
    try {
      clients[userId].sock.end();
    } catch (e) {}
    delete clients[userId];
  }
  await Shop.findByIdAndUpdate(userId, { whatsappConnected: false }).catch(() => {});
  return { success: true };
}

// Graceful shutdown
async function cleanup() {
  for (const userId in clients) {
    try { clients[userId].sock?.end(); } catch (e) {}
  }
}
process.on('SIGINT', async () => { await cleanup(); process.exit(0); });
process.once('SIGUSR2', async () => { await cleanup(); process.kill(process.pid, 'SIGUSR2'); });

module.exports = { createSession, getQR, getStatus, sendMessage, disconnectSession };
