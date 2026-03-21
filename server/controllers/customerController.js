const Customer = require('../models/Customer');

const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({ shopOwnerId: req.user.id }).select('name phone createdAt').sort({ createdAt: -1 });
    res.status(200).json(customers);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching customers' });
  }
};

const searchCustomers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(200).json([]);
    
    // Search by name or phone
    const customers = await Customer.find({ 
      shopOwnerId: req.user.id,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } }
      ]
    }).select('name phone').limit(10);
    
    res.status(200).json(customers);
  } catch (error) {
    res.status(500).json({ error: 'Server error searching customers' });
  }
};

module.exports = { getCustomers, searchCustomers };
