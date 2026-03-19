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

  // Resolve Chrome executable path
  let executablePath = '';

  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    // Docker or explicit env config
    executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  } else {
    // Full puppeteer auto-downloads Chrome — use its path
    try {
      const puppeteer = require('puppeteer');
      executablePath = puppeteer.executablePath();
    } catch(e) {}
  }

  console.log(`[WhatsApp] Using Chrome: ${executablePath || 'default'}`);

  const puppeteerOptions = {
    headless: true,
    protocolTimeout: 300000, // 5 minutes — Railway containers have slow CPUs
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      // NOTE: --no-zygote and --single-process removed — they break WebSocket connections to WhatsApp
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
      '--js-flags=--max-old-space-size=128'  // limit Chrome JS heap to 128MB
    ]
  };

  if (executablePath) {
    puppeteerOptions.executablePath = executablePath;
  }

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
      console.error('Error generating QR code:', err);
    }
  });

  client.on('ready', async () => {
    console.log(`WhatsApp client ready for user: ${userId}`);
    if (clients[userId]) {
      clients[userId].ready = true;
      clients[userId].authenticating = false;
      clients[userId].qr = null;
      await Shop.findByIdAndUpdate(userId, { whatsappConnected: true });
    }
  });

  client.on('authenticated', () => {
    console.log(`WhatsApp client authenticated for user: ${userId}`);
    if (clients[userId]) {
      clients[userId].authenticating = true;
      clients[userId].qr = null;
    }
  });

  client.on('auth_failure', msg => {
    console.error(`WhatsApp client auth_failure for user: ${userId}`, msg);
    if (clients[userId]) {
      clients[userId].authenticating = false;
    }
  });

  client.on('disconnected', async (reason) => {
    console.log(`WhatsApp client disconnected for user: ${userId}`, reason);
    if (clients[userId]) {
      clients[userId].ready = false;
      await Shop.findByIdAndUpdate(userId, { whatsappConnected: false });
      delete clients[userId];
    }
  });

  // NON-BLOCKING: Do NOT await. Return 200 immediately.
  // Frontend polls /api/whatsapp/qr/:userId to detect QR or ready state.
  client.initialize().catch((err) => {
    console.error(`[WhatsApp] Failed to initialize client for user ${userId}:`, err.message);
    delete clients[userId]; // Clean up so user can retry
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

  await new Promise(r => setTimeout(r, 1500));

  try {
    await clients[userId].client.sendMessage(chatId, message);

    // Log successful message
    await MessageLog.create({
      shopId: userId,
      jobId: jobId,
      customerPhone: cleanPhone,
      customerName: customerName,
      messageContent: message,
      triggerEvent: triggerEvent,
      status: 'sent'
    });

    // Update Job metrics if applicable
    if (jobId) {
      await Job.findByIdAndUpdate(jobId, {
        lastMessageSent: new Date(),
        $inc: { messagesSentCount: 1 }
      });
    }

    return { success: true };
  } catch (error) {
    console.error(`WhatsApp sendMessage error for user ${userId}:`, error);

    // Log failed message
    await MessageLog.create({
      shopId: userId,
      jobId: jobId,
      customerPhone: cleanPhone,
      customerName: customerName,
      messageContent: message,
      triggerEvent: triggerEvent,
      status: 'failed',
      errorReason: error.message || 'Unknown error'
    });

    if (error.message && error.message.includes('evaluate')) {
      clients[userId].ready = false;
      await Shop.findByIdAndUpdate(userId, { whatsappConnected: false }).catch(err => console.error(err));
    }
    throw new Error('WhatsApp failed to send message');
  }
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
