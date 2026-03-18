const express = require('express');
const adminMiddleware = require('../middleware/adminMiddleware');
const {
  loginAdmin,
  createShop,
  getAllShops,
  getShopById,
  toggleShopStatus,
  extendSubscription,
  getAdminMetrics
} = require('../controllers/adminController');

const router = express.Router();

// Public route for admin login
router.post('/login', loginAdmin);

// Protected routes (Require ADMIN_SECRET_KEY token)
router.use(adminMiddleware);

router.post('/shops', createShop);
router.get('/shops', getAllShops);
router.get('/shops/:id', getShopById);
router.patch('/shops/:id/suspend', toggleShopStatus);
router.patch('/shops/:id/extend', extendSubscription);
router.get('/revenue', getAdminMetrics);

module.exports = router;
