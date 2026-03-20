const express = require('express');
const {
  connect,
  getQR,
  getStatus,
  disconnect,
  requestPairingCode
} = require('../controllers/whatsappController');
const authMiddleware = require('../middleware/authMiddleware');
const subscriptionMiddleware = require('../middleware/subscriptionMiddleware');

const router = express.Router();

router.use(authMiddleware, subscriptionMiddleware);

router.post('/connect', connect);
router.get('/qr/:userId', getQR);
router.get('/status/:userId', getStatus);
router.post('/disconnect', disconnect);
router.post('/pairing-code', requestPairingCode);

module.exports = router;
