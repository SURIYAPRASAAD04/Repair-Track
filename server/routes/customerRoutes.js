const express = require('express');
const { getCustomers, searchCustomers } = require('../controllers/customerController');
const authMiddleware = require('../middleware/authMiddleware');
const subscriptionMiddleware = require('../middleware/subscriptionMiddleware');

const router = express.Router();

router.use(authMiddleware, subscriptionMiddleware);

router.get('/', getCustomers);
router.get('/search', searchCustomers);

module.exports = router;
