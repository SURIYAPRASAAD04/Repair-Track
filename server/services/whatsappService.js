const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const path = require('path');
const Shop = require('../models/Shop');
const MessageLog = require('../models/MessageLog');
const Job = require('../models/Job');

const clients = {};  // { userId: { client, qr, ready, authenticating } }

async function createSession(userId) {
  const existing = clients[userId];

  if (existing && existing.ready) {
    return { alreadyConnected: true };
  }

  // Already initializing (has client but not ready yet)
  if (existing && existing.client && !existing.initError) {
    return { success: true, message: 'Already initializing' };
  }

  // Clean up any previous broken session
  if (existing) {
    try { await existing.client?.destroy(); } catch(e) {}
    delete clients[userId];
  }

  // Resolve Chrome — use puppeteer's own bundled Chrome for version compatibility
  let executablePath = undefined;
  try {
    const puppeteer = require('puppeteer');
    executablePath = puppeteer.executablePath();
    console.log(`[WhatsApp] Chrome path: ${executablePath}`);
  } catch(e) {
    console.error('[WhatsApp] puppeteer.executablePath() failed:', e.message);
  }

  const puppeteerArgs = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--no-first-run',
    '--disable-extensions',
    '--disable-background-networking',
    '--disable-default-apps',
    '--disable-sync',
    '--disable-translate',
    '--metrics-recording-only',
    '--safebrowsing-disable-auto-update',
    '--mute-audio',
  ];

  const client = new Client({
    authStrategy: new LocalAuth({
      clientId: userId,
      dataPath: path.join(__dirname, '../.wwebjs_auth')
    }),
    puppeteer: {
      headless: true,
      executablePath,
      args: puppeteerArgs,
    }
  });

  // Store immediately so getQR can poll
  clients[userId] = { client, qr: null, ready: false, authenticating: false, initError: null };

  // ── Event Handlers ──────────────────────────────────────────────────────────

  client.on('qr', async (qr) => {
    console.log(`[WhatsApp] QR generated for user ${userId}`);
    try {
      clients[userId].qr = await qrcode.toDataURL(qr);
    } catch(e) {
      console.error('[WhatsApp] QR encode failed:', e.message);
    }
  });

  client.on('authenticated', () => {
    console.log(`[WhatsApp] Authenticated for user ${userId}`);
    if (clients[userId]) {
      clients[userId].authenticating = true;
      clients[userId].qr = null;
    }
  });

  client.on('auth_failure', (msg) => {
    console.error(`[WhatsApp] Auth failure for user ${userId}:`, msg);
    if (clients[userId]) {
      clients[userId].authenticating = false;
      clients[userId].initError = 'auth_failure';
    }
  });

  client.on('ready', async () => {
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
  });

  client.on('disconnected', async (reason) => {
    console.log(`[WhatsApp] Disconnected for user ${userId}:`, reason);
    if (clients[userId]) {
      clients[userId].ready = false;
    }
    await Shop.findByIdAndUpdate(userId, { whatsappConnected: false }).catch(e =>
      console.error('[WhatsApp] DB update failed:', e.message)
    );
    try { await client.destroy(); } catch(e) {}
    delete clients[userId];
  });

  client.on('error', (err) => {
    console.error(`[WhatsApp] Client error for user ${userId}:`, err?.message || err);
  });

  // ── Start initialization (non-blocking — never await this) ───────────────────
  // client.initialize() resolves after Chrome launches, NOT after WhatsApp is ready.
  // We handle readiness purely via the 'ready' event above.
  client.initialize().catch((err) => {
    console.error(`[WhatsApp] initialize() error for user ${userId}:`, err.message);
    if (clients[userId]) {
      clients[userId].initError = err.message;
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

// ── sendMessage with timeout + retry ────────────────────────────────────────

async function sendMessage(userId, phone, message, jobId = null, customerName = null, triggerEvent = 'manual_message') {
  const session = clients[userId];

  if (!session || !session.ready) {
    await Shop.findByIdAndUpdate(userId, { whatsappConnected: false }).catch(() => {});
    throw new Error('WhatsApp not connected');
  }

  let cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`;
  const chatId = `${cleanPhone}@c.us`;

  const MAX_RETRIES = 3;
  const SEND_TIMEOUT = 60000; // 60s per attempt
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Brief wait for WhatsApp Web to stabilize on slow containers
      await new Promise(r => setTimeout(r, 2000));

      if (!clients[userId] || !clients[userId].ready) {
        throw new Error('WhatsApp disconnected during send');
      }

      console.log(`[WhatsApp] Sending to ${chatId} (attempt ${attempt}/${MAX_RETRIES})`);

      await Promise.race([
        clients[userId].client.sendMessage(chatId, message),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Timed out after ${SEND_TIMEOUT / 1000}s`)), SEND_TIMEOUT)
        )
      ]);

      console.log(`[WhatsApp] ✅ Sent to ${chatId} on attempt ${attempt}`);

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
        await new Promise(r => setTimeout(r, 5000));
      }
    }
  }

  // All attempts failed
  console.error(`[WhatsApp] ❌ All ${MAX_RETRIES} sends failed for ${chatId}`);

  MessageLog.create({
    shopId: userId, jobId, customerPhone: cleanPhone, customerName,
    messageContent: message, triggerEvent, status: 'failed',
    errorReason: lastError?.message || 'Unknown'
  }).catch(e => console.error('[WhatsApp] MessageLog error:', e.message));

  // Mark disconnected if Puppeteer errors
  const msg = lastError?.message || '';
  if (msg.includes('evaluate') || msg.includes('timed out') || msg.includes('destroyed') || msg.includes('Timed out')) {
    if (clients[userId]) clients[userId].ready = false;
    Shop.findByIdAndUpdate(userId, { whatsappConnected: false }).catch(() => {});
  }

  throw new Error(`WhatsApp failed to send: ${lastError?.message}`);
}

async function disconnectSession(userId) {
  if (clients[userId]) {
    try {
      await clients[userId].client.logout();
    } catch(e) {}
    try {
      await clients[userId].client.destroy();
    } catch(e) {}
    delete clients[userId];
  }
  await Shop.findByIdAndUpdate(userId, { whatsappConnected: false }).catch(() => {});
  return { success: true };
}

// Graceful shutdown
async function cleanup() {
  for (const userId in clients) {
    try { await clients[userId].client?.destroy(); } catch(e) {}
  }
}
process.on('SIGINT', async () => { await cleanup(); process.exit(0); });
process.once('SIGUSR2', async () => { await cleanup(); process.kill(process.pid, 'SIGUSR2'); });

module.exports = { createSession, getQR, getStatus, sendMessage, disconnectSession };
