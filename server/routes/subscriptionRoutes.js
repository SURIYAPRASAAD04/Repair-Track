const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const Subscription = require('../models/Subscription');

const router = express.Router();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const shopId = req.user.id;
    const subscription = await Subscription.findOne({ shopId });
    
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    res.status(200).json(subscription);
  } catch (error) {
    console.error('Fetch Subscription Error:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

module.exports = router;
