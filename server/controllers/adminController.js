const Shop = require('../models/Shop');
const Subscription = require('../models/Subscription');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Helper to check for ADMIN_SECRET_KEY
const getAdminSecret = () => process.env.ADMIN_SECRET_KEY || 'default_super_secret_for_dev_only';

// @desc    Admin Login
// @route   POST /api/admin/login
const loginAdmin = async (req, res) => {
  try {
    const { secretKey } = req.body;

    if (!secretKey) {
      return res.status(400).json({ error: 'Secret key required' });
    }

    if (secretKey !== getAdminSecret()) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const token = jwt.sign(
      {
        isAdmin: true,
        role: 'superadmin'
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      token,
      message: 'Admin authenticated successfully'
    });
  } catch (error) {
    console.error('Admin Login Error:', error);
    res.status(500).json({ error: 'Server error during admin login' });
  }
};

// @desc    Create a new Shop Tenant (Only by Admin)
// @route   POST /api/admin/shops
// @access  Private (Admin)
const createShop = async (req, res) => {
  try {
    const { name, email, password, shopName, trialDays = 7 } = req.body;

    if (!name || !email || !password || !shopName) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    const existingUser = await Shop.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'A shop with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newShop = new Shop({
      ownerName: name,
      email,
      shopName,
      password: hashedPassword,
      isActive: true
    });

    await newShop.save();

    // Create subscription based on trialDays provided
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + parseInt(trialDays));

    const subscription = await Subscription.create({
      shopId: newShop._id,
      plan: 'trial',
      status: 'active',
      startDate: new Date(),
      endDate
    });

    newShop.subscription = subscription._id;
    await newShop.save();

    res.status(201).json({
      message: 'Shop created successfully',
      shop: {
        _id: newShop._id,
        name: newShop.ownerName,
        email: newShop.email,
        shopName: newShop.shopName
      },
      subscription
    });
  } catch (error) {
    console.error('Admin Create Shop Error:', error);
    res.status(500).json({ error: 'Server error creating shop' });
  }
};

// @desc    Get all shops
// @route   GET /api/admin/shops
// @access  Private (Admin)
const getAllShops = async (req, res) => {
  try {
    const shops = await Shop.find()
      .select('-password')
      .populate('subscription');

    res.status(200).json(shops);
  } catch (error) {
    console.error('Admin Get Shops Error:', error);
    res.status(500).json({ error: 'Server error fetching shops' });
  }
};

// @desc    Get single shop details
// @route   GET /api/admin/shops/:id
// @access  Private (Admin)
const getShopById = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id)
      .select('-password')
      .populate('subscription');

    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    // TODO: Add aggregated stats here later (total jobs, revenue)
    res.status(200).json(shop);
  } catch (error) {
    console.error('Admin Get Shop Error:', error);
    res.status(500).json({ error: 'Server error fetching shop details' });
  }
};

// @desc    Block or suspend a shop
// @route   PATCH /api/admin/shops/:id/suspend
// @access  Private (Admin)
const toggleShopStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    const shop = await Shop.findByIdAndUpdate(
      req.params.id,
      { isActive: typeof isActive === 'boolean' ? isActive : false },
      { new: true }
    ).select('-password');

    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    res.status(200).json({
      message: `Shop successfully ${shop.isActive ? 'activated' : 'suspended'}`,
      shop
    });
  } catch (error) {
    console.error('Admin Toggle Status Error:', error);
    res.status(500).json({ error: 'Server error updating shop status' });
  }
};

// @desc    Extend a subscription
// @route   PATCH /api/admin/shops/:id/extend
// @access  Private (Admin)
const extendSubscription = async (req, res) => {
  try {
    const { daysToAdd, newPlan } = req.body;

    if (!daysToAdd) {
      return res.status(400).json({ error: 'Please specify days to add' });
    }

    const shop = await Shop.findById(req.params.id);
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    let subscription = await Subscription.findOne({ shopId: shop._id });

    if (!subscription) {
      // Create one if it didn't exist for some reason
      subscription = await Subscription.create({
        shopId: shop._id,
        plan: newPlan || 'trial',
        status: 'active',
        startDate: new Date(),
        endDate: new Date()
      });
      shop.subscription = subscription._id;
      await shop.save();
    }

    const currentEndDate = new Date(subscription.endDate) > new Date()
      ? new Date(subscription.endDate)
      : new Date();

    currentEndDate.setDate(currentEndDate.getDate() + parseInt(daysToAdd));

    subscription.endDate = currentEndDate;
    subscription.status = 'active';
    if (newPlan) subscription.plan = newPlan;

    await subscription.save();

    res.status(200).json({
      message: `Subscription extended by ${daysToAdd} days`,
      subscription
    });
  } catch (error) {
    console.error('Admin Extend Sub Error:', error);
    res.status(500).json({ error: 'Server error extending subscription' });
  }
};

// @desc    Get SaaS wide revenue and metrics
// @route   GET /api/admin/revenue
// @access  Private (Admin)
const getAdminMetrics = async (req, res) => {
  try {
    const totalShops = await Shop.countDocuments();
    const activeShops = await Shop.countDocuments({ isActive: true });

    // Aggregate subscriptions by plan
    const planDistribution = await Subscription.aggregate([
      { $group: { _id: '$plan', count: { $sum: 1 } } }
    ]);

    // Format plan distribution
    const plans = planDistribution.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    res.status(200).json({
      totalShops,
      activeShops,
      suspendedShops: totalShops - activeShops,
      plans
    });
  } catch (error) {
    console.error('Admin Metrics Error:', error);
    res.status(500).json({ error: 'Server error generating metrics' });
  }
};

module.exports = {
  loginAdmin,
  createShop,
  getAllShops,
  getShopById,
  toggleShopStatus,
  extendSubscription,
  getAdminMetrics
};
