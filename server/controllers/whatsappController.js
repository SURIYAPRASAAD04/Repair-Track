const whatsappService = require('../services/whatsappService');

const connect = async (req, res) => {
  try {
    const result = await whatsappService.createSession(req.user.id);
    res.status(200).json(result);
  } catch (error) {
    console.error('WhatsApp connect endpoint error:', error);
    res.status(500).json({ error: 'Failed to initialize WhatsApp session', details: error.message });
  }
};

const getQR = async (req, res) => {
  try {
    const userId = req.params.userId;
    if (userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to view this QR code' });
    }

    const { qr, ready, authenticating } = await whatsappService.getQR(req.user.id);
    res.status(200).json({ qr, ready, authenticating });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch QR status' });
  }
};

const getStatus = async (req, res) => {
  try {
    const userId = req.params.userId;
    if (userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { connected } = await whatsappService.getStatus(req.user.id);
    res.status(200).json({ connected });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch connection status' });
  }
};

const disconnect = async (req, res) => {
  try {
    await whatsappService.disconnectSession(req.user.id);
    res.status(200).json({ success: true, message: 'Disconnected successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to disconnect WhatsApp session' });
  }
};

const requestPairingCode = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }
    const result = await whatsappService.requestPairingCode(req.user.id, phoneNumber);
    res.status(200).json(result);
  } catch (error) {
    console.error('Pairing code endpoint error:', error);
    res.status(500).json({ error: 'Failed to generate pairing code', details: error.message });
  }
};

module.exports = { connect, getQR, getStatus, disconnect, requestPairingCode };
