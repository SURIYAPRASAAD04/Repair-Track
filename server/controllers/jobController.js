const mongoose = require('mongoose');
const Job = require('../models/Job');
const Shop = require('../models/Shop');
const Customer = require('../models/Customer');
const ActivityLog = require('../models/ActivityLog');
const { getMessageForStatus } = require('../services/messageTemplates');
const { sendMessage } = require('../services/whatsappService');

// Generate unique Job ID (e.g., JOB-2025-0047)
const generateJobId = async () => {
  const date = new Date();
  const year = date.getFullYear();
  
  // Find latest job to increment counter
  const latestJob = await Job.findOne().sort({ createdAt: -1 });
  let counter = 1;
  
  if (latestJob && latestJob.jobId && latestJob.jobId.includes(year)) {
    const parts = latestJob.jobId.split('-');
    if (parts.length === 3) {
      counter = parseInt(parts[2], 10) + 1;
    }
  }
  
  return `JOB-${year}-${counter.toString().padStart(4, '0')}`;
};

const createJob = async (req, res) => {
  try {
    const shopOwnerId = req.user.id;
    const { 
      customerInfo, // { name, phone } 
      deviceType, brand, model, color, identifier, 
      reportedIssue, deviceCondition, estimatedCost, estimatedDelivery 
    } = req.body;

    if (!customerInfo.name || !customerInfo.phone || !deviceType || !brand || !model) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 1. Handle Customer (Find existing or Create new)
    let customer = await Customer.findOne({ phone: customerInfo.phone, shopOwnerId });
    if (!customer) {
      customer = await Customer.create({
        name: customerInfo.name,
        phone: customerInfo.phone,
        shopOwnerId
      });
    }

    // 2. Generate Job ID
    const jobId = await generateJobId();

    // 3. Create Job
    const job = new Job({
      jobId,
      customer: customer._id,
      shopOwnerId,
      deviceType,
      brand,
      model,
      color,
      identifier,
      reportedIssue,
      deviceCondition,
      estimatedCost,
      estimatedDelivery,
      status: 'Received',
      statusHistory: [{ status: 'Received' }]
    });

    await job.save();

    // Log creation to ActivityLog
    await ActivityLog.create({
      jobId: job._id,
      shopId: shopOwnerId,
      toStatus: 'Received',
      changedBy: 'shop_owner',
      note: 'Job created'
    });

    // 4. Fetch the shop owner to pass the shopName to the notification service
    const shopOwner = await Shop.findById(shopOwnerId);
    
    // 5. Populate customer data for the notification service and trigger the WhatsApp message
    await job.populate('customer');
    
    // Respond IMMEDIATELY — send WhatsApp in background (fire-and-forget)
    res.status(201).json({ job, notificationSent: false });

    // Background: send WhatsApp notification (non-blocking)
    if (shopOwner.whatsappConnected) {
      try {
        const messageText = getMessageForStatus('Received', {
          customerName: job.customer.name,
          deviceBrand: job.brand,
          deviceModel: job.model,
          jobId: job.jobId,
          shopName: shopOwner.shopName,
          date: new Date().toLocaleDateString()
        });
        
        if (messageText) {
          sendMessage(
            shopOwner._id, 
            job.customer.phone, 
            messageText,
            job._id,
            job.customer.name,
            'status_change:Received'
          ).then(() => {
            ActivityLog.findOneAndUpdate(
              { jobId: job._id, toStatus: 'Received' },
              { whatsappSent: true }
            ).catch(e => console.error('ActivityLog update failed:', e));
            console.log(`[WhatsApp] Received notification sent for ${job.jobId}`);
          }).catch(err => {
            console.error('Initial WhatsApp notification failed:', err.message);
          });
        }
      } catch (err) {
        console.error('Initial WhatsApp notification failed:', err.message);
      }
    }
  } catch (error) {
    console.error('Create Job Error:', error);
    res.status(500).json({ error: 'Failed to create repair job' });
  }
};

const getJobs = async (req, res) => {
  try {
    const { status, search } = req.query;
    
    let query = { shopOwnerId: req.user.id };
    
    if (status) {
      query.status = status;
    }

    // Add search logic if provided
    let jobsQuery = Job.find(query)
      .populate('customer', 'name phone')
      .sort({ updatedAt: -1 });
      
    const jobs = await jobsQuery;
    
    // Client-side filtering for populated customer fields if search is provided
    let filteredJobs = jobs;
    if (search) {
      const s = search.toLowerCase();
      filteredJobs = jobs.filter(j => 
        j.jobId.toLowerCase().includes(s) || 
        j.deviceType.toLowerCase().includes(s) ||
        j.brand.toLowerCase().includes(s) ||
        j.model.toLowerCase().includes(s) ||
        (j.customer && j.customer.name.toLowerCase().includes(s)) ||
        (j.customer && j.customer.phone.includes(s))
      );
    }

    res.status(200).json(filteredJobs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
};

const getJobById = async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, shopOwnerId: req.user.id })
      .populate('customer');
      
    if (!job) return res.status(404).json({ error: 'Job not found' });
    
    res.status(200).json(job);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch job details' });
  }
};

const updateJobStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const job = await Job.findOne({ _id: id, shopOwnerId: req.user.id }).populate('customer');
    if (!job) return res.status(404).json({ error: 'Job not found' });

    if (job.status === status) {
      return res.status(400).json({ error: 'Job is already in this status' });
    }

    const previousStatus = job.status;
    const shopOwner = await Shop.findById(req.user.id);

    // Update status and history in DB FIRST (fast)
    job.status = status;
    job.statusHistory.push({ status });
    await job.save();

    // Log to ActivityLog
    await ActivityLog.create({
      jobId: job._id,
      shopId: shopOwner._id,
      fromStatus: previousStatus,
      toStatus: status,
      changedBy: 'shop_owner',
      whatsappSent: false  // Will be updated in background
    });

    // Respond IMMEDIATELY — don't make the user wait for WhatsApp
    res.status(200).json(job);

    // Background: send WhatsApp notification (fire-and-forget, non-blocking)
    if (shopOwner.whatsappConnected) {
      try {
        const messageText = getMessageForStatus(status, {
          customerName: job.customer.name,
          deviceBrand: job.brand,
          deviceModel: job.model,
          jobId: job.jobId,
          shopName: shopOwner.shopName,
          amount: job.finalCost || job.estimatedCost || 0
        });
        
        if (messageText) {
          sendMessage(
            shopOwner._id, 
            job.customer.phone, 
            messageText,
            job._id,
            job.customer.name,
            `status_change:${status}`
          ).then(() => {
            ActivityLog.findOneAndUpdate(
              { jobId: job._id, toStatus: status },
              { whatsappSent: true }
            ).catch(e => console.error('ActivityLog update failed:', e));
            console.log(`[WhatsApp] ${status} notification sent for ${job.jobId}`);
          }).catch(err => {
            console.error(`[WhatsApp] ${status} notification FAILED for ${job.jobId}:`, err.message);
          });
        }
      } catch (err) {
        console.error('Status update WhatsApp notification failed:', err.message);
      }
    }
  } catch (error) {
    console.error('Update Job Status Error:', error);
    res.status(500).json({ error: 'Failed to update job status' });
  }
};

const updateJobDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body; // technicianNotes, finalCost, paymentStatus, etc.

    // Prevent bypassing status update logic here
    if (updates.status) delete updates.status;

    const job = await Job.findOneAndUpdate(
      { _id: id, shopOwnerId: req.user.id },
      { $set: updates },
      { new: true }
    ).populate('customer');

    if (!job) return res.status(404).json({ error: 'Job not found' });

    res.status(200).json(job);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update job details' });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const shopOwnerId = req.user.id;
    
    const activeJobsCount = await Job.countDocuments({ 
      shopOwnerId, 
      status: { $nin: ['Delivered / Closed', 'Cannot be Repaired'] } 
    });
    
    // Jobs by status breakdown for active jobs
    const statusBreakdown = await Job.aggregate([
      { $match: { shopOwnerId: new mongoose.Types.ObjectId(shopOwnerId), status: { $nin: ['Delivered / Closed', 'Cannot be Repaired'] } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    // Format breakdown safely
    const breakdownObj = {};
    statusBreakdown.forEach(item => breakdownObj[item._id] = item.count);

    const today = new Date();
    today.setHours(0,0,0,0);
    
    const completedTodayCount = await Job.countDocuments({
      shopOwnerId,
      status: 'Delivered / Closed',
      updatedAt: { $gte: today }
    });
    
    // Revenue calculated by summing finalCost of delivered jobs
    const revenueCalc = await Job.aggregate([
      { $match: { shopOwnerId: new mongoose.Types.ObjectId(shopOwnerId), status: 'Delivered / Closed', paymentStatus: 'Paid' } },
      { $group: { _id: null, total: { $sum: '$finalCost' } } }
    ]);
    const totalRevenue = revenueCalc.length > 0 ? revenueCalc[0].total : 0;

    res.status(200).json({
      activeJobs: activeJobsCount,
      completedToday: completedTodayCount,
      totalRevenue,
      statusBreakdown: breakdownObj
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

module.exports = { 
  createJob, getJobs, getJobById, 
  updateJobStatus, updateJobDetails, getDashboardStats 
};
