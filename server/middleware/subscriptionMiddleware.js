const Subscription = require('../models/Subscription');

const verifySubscription = async (req, res, next) => {
  try {
    const shopId = req.user.id; // user ID is the shopId
    
    const subscription = await Subscription.findOne({ shopId }).select('status startDate endDate plan');
    if (!subscription) {
      return res.status(403).json({ error: 'SUBSCRIPTION_EXPIRED', message: 'No subscription found' });
    }

    const now = new Date();
    
    // Auto-recover if end date was extended manually in DB
    if (subscription.status === 'expired' && subscription.endDate > now) {
      subscription.status = 'active'; // or keep 'trial', but 'active' is safer
      await subscription.save();
    }

    if ((subscription.status === 'active' || subscription.status === 'trial') && subscription.endDate > now) {
      req.subscription = subscription;
      return next();
    }
    
    // Default fallback: subscription expired or suspended
    if ((subscription.status === 'trial' || subscription.status === 'active') && subscription.endDate <= now) {
        subscription.status = 'expired';
        await subscription.save();
    }

    return res.status(403).json({ error: 'SUBSCRIPTION_EXPIRED', message: 'Your subscription has expired' });
  } catch (error) {
    console.error('Subscription Middleware Error:', error);
    return res.status(500).json({ error: 'Failed to verify subscription status' });
  }
};

module.exports = verifySubscription;
