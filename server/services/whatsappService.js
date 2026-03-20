const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const path = require('path');
const Shop = require('../models/Shop');
const MessageLog = require('../models/MessageLog');
const Job = require('../models/Job');

const clients = {};  // { userId: { client, qr, ready, authenticating } }

// ── Per-user message queue to prevent concurrent page.evaluate() deadlocks ──
const sendQueues = {};
function enqueue(userId, fn) {
  if (!sendQueues[userId]) sendQueues[userId] = Promise.resolve();
  const p = sendQueues[userId].then(fn).catch(fn);
  sendQueues[userId] = p;
  return p;
}

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

  // Resolve Chrome — use puppeteer's own bundled Chrome
  let executablePath = undefined;
  try {
    const puppeteer = require('puppeteer');
    executablePath = puppeteer.executablePath();
    console.log(`[WhatsApp] Chrome path: ${executablePath}`);
  } catch(e) {
    console.error('[WhatsApp] puppeteer.executablePath() failed:', e.message);
  }

  // Aggressive memory-saving args for low-resource containers (Railway, Render)
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
    '--single-process',           // critical for low-memory containers
    '--no-zygote',                // reduces memory footprint
    '--disable-software-rasterizer',
  ];

  const client = new Client({
    authStrategy: new LocalAuth({
      clientId: userId,
      dataPath: path.join(__dirname, '../.wwebjs_auth')
    }),
    // REQUIRED: Pin WA Web version to prevent "Execution context destroyed"
    // Without this, whatsapp-web.js navigates the page to fetch the WA bundle,
    // which destroys the Puppeteer execution context.
    webVersionCache: {
      type: 'remote',
      remotePath: `https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1033805553-alpha.html`,
    },
    puppeteer: {
      headless: true,
      executablePath,
      args: puppeteerArgs,
      protocolTimeout: 300000, // 5 min CDP protocol timeout (critical for slow containers)
      timeout: 120000,         // 2 min browser launch timeout
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

  // ── Start initialization (non-blocking — never await this) ───────────────
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

// ── sendMessage with queue + number validation + timeout + retry ─────────────

async function sendMessage(userId, phone, message, jobId = null, customerName = null, triggerEvent = 'manual_message') {
  return enqueue(userId, async () => {
    const session = clients[userId];

    if (!session || !session.ready) {
      await Shop.findByIdAndUpdate(userId, { whatsappConnected: false }).catch(() => {});
      throw new Error('WhatsApp not connected');
    }

    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`;
    const chatId = `${cleanPhone}@c.us`;

    // ── Step 1: Validate number is on WhatsApp ──────────────────────
    try {
      console.log(`[WhatsApp] Checking if ${chatId} is registered...`);
      const isRegistered = await Promise.race([
        clients[userId].client.isRegisteredUser(chatId),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Number check timed out')), 30000)
        )
      ]);
      console.log(`[WhatsApp] ${chatId} registered: ${isRegistered}`);
      if (!isRegistered) {
        console.error(`[WhatsApp] ❌ ${chatId} is NOT on WhatsApp, skipping send`);
        MessageLog.create({
          shopId: userId, jobId, customerPhone: cleanPhone, customerName,
          messageContent: message, triggerEvent, status: 'failed',
          errorReason: 'Number not on WhatsApp'
        }).catch(() => {});
        throw new Error(`${cleanPhone} is not a WhatsApp number`);
      }
    } catch (checkErr) {
      if (checkErr.message.includes('not a WhatsApp')) throw checkErr;
      // If the check itself fails, log but still try to send
      console.warn(`[WhatsApp] Number check failed (will try sending anyway):`, checkErr.message);
    }

    // ── Step 2: Send with retries ───────────────────────────────────
    const MAX_RETRIES = 3;
    const SEND_TIMEOUT = 120000; // 2 minutes per attempt
    let lastError = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (!clients[userId] || !clients[userId].ready) {
          throw new Error('WhatsApp disconnected during send');
        }

        console.log(`[WhatsApp] Sending to ${chatId} (attempt ${attempt}/${MAX_RETRIES})`);

        const result = await Promise.race([
          clients[userId].client.sendMessage(chatId, message),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Timed out after ${SEND_TIMEOUT / 1000}s`)), SEND_TIMEOUT)
          )
        ]);

        console.log(`[WhatsApp] ✅ Message sent to ${chatId} on attempt ${attempt}`, result?.id?._serialized || '');

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

    const msg = lastError?.message || '';
    if (msg.includes('evaluate') || msg.includes('timed out') || msg.includes('destroyed') || msg.includes('Timed out')) {
      if (clients[userId]) clients[userId].ready = false;
      Shop.findByIdAndUpdate(userId, { whatsappConnected: false }).catch(() => {});
    }

    throw new Error(`WhatsApp failed to send: ${lastError?.message}`);
  });
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
