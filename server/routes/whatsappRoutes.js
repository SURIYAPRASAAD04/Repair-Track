const express = require('express');
const {
  connect,
  getQR,
  getStatus,
  disconnect
} = require('../controllers/whatsappController');
const authMiddleware = require('../middleware/authMiddleware');
const subscriptionMiddleware = require('../middleware/subscriptionMiddleware');

const router = express.Router();

router.use(authMiddleware, subscriptionMiddleware);

router.post('/connect', connect);
router.get('/qr/:userId', getQR);
router.get('/status/:userId', getStatus);
router.post('/disconnect', disconnect);

module.exports = router;
