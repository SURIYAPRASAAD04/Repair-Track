const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const path = require('path');
const fs = require('fs');
const Shop = require('../models/Shop');
const MessageLog = require('../models/MessageLog');
const Job = require('../models/Job');

const clients = {};  // { userId: { client, qr, ready, status } }

async function createSession(userId) {
  if (clients[userId] && clients[userId].ready) {
    return { alreadyConnected: true };
  }

  // If already initializing, don't spawn another client
  if (clients[userId] && !clients[userId].ready && !clients[userId].initError) {
    return { success: true, message: 'Already initializing' };
  }

  // Clean up any previous failed session
  if (clients[userId]) {
    try { await clients[userId].client?.destroy(); } catch(e) {}
    delete clients[userId];
  }

  // Resolve Chrome executable path
  let executablePath = '';

  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  } else {
    try {
      const puppeteer = require('puppeteer');
      executablePath = puppeteer.executablePath();
    } catch(e) {}
  }

  console.log(`[WhatsApp] Using Chrome: ${executablePath || 'default'}`);

  const puppeteerOptions = {
    headless: true,
    protocolTimeout: 300000, // 5 minutes
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--disable-gpu',
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-default-apps',
      '--mute-audio',
      '--no-default-browser-check',
      '--disable-hang-monitor',
      '--disable-popup-blocking',
      '--disable-prompt-on-repost',
      '--disable-sync',
      '--disable-translate',
      '--disable-domain-reliability',
      '--disable-renderer-backgrounding',
      '--disable-infobars',
      '--disable-features=TranslateUI',
      '--disable-ipc-flooding-protection',
      '--metrics-recording-only',
      '--safebrowsing-disable-auto-update',
      // NOTE: No --js-flags heap limit — WhatsApp Web needs 256MB+ JS heap to function
    ]
  };

  if (executablePath) {
    puppeteerOptions.executablePath = executablePath;
  }

  // ─── Initialize with retry logic ───
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 5000; // 5 seconds between retries

  const attemptInit = async (attempt = 1) => {
    console.log(`[WhatsApp] Initialization attempt ${attempt}/${MAX_RETRIES} for user ${userId}`);

    const client = new Client({
      authStrategy: new LocalAuth({ 
        clientId: userId,
        dataPath: path.join(__dirname, '../.wwebjs_auth')
      }),
      puppeteer: puppeteerOptions
    });

    clients[userId] = { client, qr: null, ready: false, authenticating: false, initError: null };

    client.on('qr', async (qr) => {
      try {
        const qrBase64 = await qrcode.toDataURL(qr);
        if (clients[userId]) {
          clients[userId].qr = qrBase64;
        }
      } catch (err) {
        console.error('Error generating QR code:', err.message);
      }
    });

    client.on('ready', async () => {
      console.log(`[WhatsApp] Client READY for user: ${userId}`);
      if (clients[userId]) {
        clients[userId].ready = true;
        clients[userId].authenticating = false;
        clients[userId].qr = null;
        await Shop.findByIdAndUpdate(userId, { whatsappConnected: true }).catch(e => console.error(e));
      }
    });

    client.on('authenticated', () => {
      console.log(`[WhatsApp] Client authenticated for user: ${userId}`);
      if (clients[userId]) {
        clients[userId].authenticating = true;
        clients[userId].qr = null;
      }
    });

    client.on('auth_failure', msg => {
      console.error(`[WhatsApp] Auth failure for user: ${userId}`, msg);
      if (clients[userId]) clients[userId].authenticating = false;
    });

    client.on('disconnected', async (reason) => {
      console.log(`[WhatsApp] Disconnected for user: ${userId}`, reason);
      if (clients[userId]) {
        clients[userId].ready = false;
        await Shop.findByIdAndUpdate(userId, { whatsappConnected: false }).catch(e => console.error(e));
        try { await client.destroy(); } catch(e) {}
        delete clients[userId];
      }
    });

    // Catch any internal errors from the client so they don't crash Node.js
    client.on('error', (err) => {
      console.error(`[WhatsApp] Client error for user ${userId}:`, err.message);
    });

    try {
      await client.initialize();
      // If we get here without throwing, initialization succeeded
    } catch (err) {
      console.error(`[WhatsApp] Init attempt ${attempt} failed for user ${userId}:`, err.message);
      
      // Clean up the failed client
      try { await client.destroy(); } catch(e) {}
      delete clients[userId];

      // Retry if we have attempts left
      if (attempt < MAX_RETRIES) {
        console.log(`[WhatsApp] Retrying in ${RETRY_DELAY / 1000}s...`);
        await new Promise(r => setTimeout(r, RETRY_DELAY));
        return attemptInit(attempt + 1);
      } else {
        console.error(`[WhatsApp] All ${MAX_RETRIES} attempts failed for user ${userId}`);
        if (clients[userId]) {
          clients[userId].initError = err.message;
        }
      }
    }
  };

  // NON-BLOCKING: Run initialization in the background
  attemptInit().catch(err => {
    console.error(`[WhatsApp] Fatal init error for user ${userId}:`, err.message);
    delete clients[userId];
  });

  return { success: true, message: 'Session initialization started' };
}

async function getQR(userId) {
  if (!clients[userId]) {
    return { qr: null, ready: false, authenticating: false };
  }
  return {
    qr: clients[userId].qr,
    ready: clients[userId].ready,
    authenticating: clients[userId].authenticating
  };
}

async function getStatus(userId) {
  if (!clients[userId]) {
    return { connected: false };
  }
  return { connected: clients[userId].ready };
}

async function sendMessage(userId, phone, message, jobId = null, customerName = null, triggerEvent = 'manual_message') {
  if (!clients[userId] || !clients[userId].ready) {
    await Shop.findByIdAndUpdate(userId, { whatsappConnected: false }).catch(err => console.error(err));
    throw new Error('WhatsApp not connected');
  }

  let cleanPhone = phone.replace(/\D/g, '');

  if (cleanPhone.length === 10) {
    cleanPhone = `91${cleanPhone}`;
  }

  const chatId = `${cleanPhone}@c.us`;

  // ─── Retry logic: 3 attempts, 3s delay between each ───
  const MAX_SEND_RETRIES = 3;
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_SEND_RETRIES; attempt++) {
    try {
      // Wait before sending (longer on slow containers to let WhatsApp Web stabilize)
      await new Promise(r => setTimeout(r, 3000));

      // Check client is still alive before each attempt
      if (!clients[userId] || !clients[userId].ready) {
        throw new Error('WhatsApp client disconnected during send');
      }

      console.log(`[WhatsApp] sendMessage attempt ${attempt}/${MAX_SEND_RETRIES} to ${chatId}`);
      await clients[userId].client.sendMessage(chatId, message);

      // ─── SUCCESS ───
      console.log(`[WhatsApp] Message SENT successfully to ${chatId} on attempt ${attempt}`);

      // Log successful message
      await MessageLog.create({
        shopId: userId,
        jobId: jobId,
        customerPhone: cleanPhone,
        customerName: customerName,
        messageContent: message,
        triggerEvent: triggerEvent,
        status: 'sent'
      }).catch(e => console.error('MessageLog create failed:', e));

      // Update Job metrics if applicable
      if (jobId) {
        await Job.findByIdAndUpdate(jobId, {
          lastMessageSent: new Date(),
          $inc: { messagesSentCount: 1 }
        }).catch(e => console.error('Job metric update failed:', e));
      }

      return { success: true };

    } catch (error) {
      lastError = error;
      console.error(`[WhatsApp] sendMessage attempt ${attempt} FAILED:`, error.message);

      // If it's a timeout/evaluate error, wait longer before retrying
      if (attempt < MAX_SEND_RETRIES) {
        console.log(`[WhatsApp] Retrying send in 5s...`);
        await new Promise(r => setTimeout(r, 5000));
      }
    }
  }

  // ─── ALL RETRIES FAILED ───
  console.error(`[WhatsApp] All ${MAX_SEND_RETRIES} send attempts failed for ${chatId}`);

  // Log failed message
  await MessageLog.create({
    shopId: userId,
    jobId: jobId,
    customerPhone: cleanPhone,
    customerName: customerName,
    messageContent: message,
    triggerEvent: triggerEvent,
    status: 'failed',
    errorReason: lastError?.message || 'All retry attempts failed'
  }).catch(e => console.error('MessageLog create failed:', e));

  // Mark as disconnected if it's a persistent Puppeteer error
  if (lastError?.message && (lastError.message.includes('evaluate') || lastError.message.includes('timed out') || lastError.message.includes('destroyed'))) {
    if (clients[userId]) clients[userId].ready = false;
    await Shop.findByIdAndUpdate(userId, { whatsappConnected: false }).catch(err => console.error(err));
  }

  throw new Error('WhatsApp failed to send message after multiple retries');
}

async function disconnectSession(userId) {
  if (clients[userId] && clients[userId].client) {
    try {
      await clients[userId].client.logout();
      await clients[userId].client.destroy();
    } catch (err) {
      console.error('Error destroying client:', err);
    }
    delete clients[userId];
    await Shop.findByIdAndUpdate(userId, { whatsappConnected: false });
  }
  return { success: true };
}

// Graceful shutdown to prevent zombie browser processes
const cleanup = async () => {
  for (const userId in clients) {
    if (clients[userId] && clients[userId].client) {
      try {
        console.log(`Destroying WhatsApp client for user ${userId}...`);
        await clients[userId].client.destroy();
      } catch (err) {
        console.error(`Error destroying client for user ${userId}:`, err);
      }
    }
  }
};

process.once('SIGUSR2', async () => {
  await cleanup();
  process.kill(process.pid, 'SIGUSR2');
});

process.on('SIGINT', async () => {
  await cleanup();
  process.exit(0);
});

module.exports = { createSession, getQR, getStatus, sendMessage, disconnectSession };
