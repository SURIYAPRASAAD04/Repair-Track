const Shop = require('../models/Shop');
const Subscription = require('../models/Subscription');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    const user = await Shop.findOne({ email }).select('_id ownerName email shopName password whatsappConnected');
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({
      token,
      user: {
        _id: user._id,
        name: user.ownerName,
        email: user.email,
        shopName: user.shopName,
        whatsappConnected: user.whatsappConnected
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error during login' });
  }
};

const me = async (req, res) => {
  try {
    const user = await Shop.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'Shop not found' });
    }
    // Return with generic name property for frontend compatibility for now
    res.status(200).json({
      ...user._doc,
      name: user.ownerName
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching profile' });
  }
};

module.exports = { login, me };
