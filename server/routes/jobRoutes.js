const express = require('express');
const { 
  createJob, getJobs, getJobById, 
  updateJobStatus, updateJobDetails, getDashboardStats 
} = require('../controllers/jobController');
const authMiddleware = require('../middleware/authMiddleware');
const subscriptionMiddleware = require('../middleware/subscriptionMiddleware');

const router = express.Router();

router.use(authMiddleware, subscriptionMiddleware);

router.post('/', createJob);
router.get('/', getJobs);
router.get('/dashboard-stats', getDashboardStats);
router.get('/:id', getJobById);
router.put('/:id/status', updateJobStatus);
router.put('/:id', updateJobDetails);

module.exports = router;
