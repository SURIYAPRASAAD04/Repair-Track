const whatsappService = require('./whatsappService');

const statusTemplates = {
  'Received': (job, shopName) => 
    `Hello ${job.customer.name},\n\nWe've safely received your ${job.deviceType} (${job.brand} ${job.model}) for repair. \n\nYour Job ID is *${job.jobId}*. \n\nWe'll keep you updated on the progress.\n\n— *${shopName}*`,

  'Under Diagnosis': (job, shopName) => 
    `Hi ${job.customer.name}, good news! \n\nOur technician has started diagnosing your ${job.brand} ${job.deviceType} (*${job.jobId}*). \n\nWe'll update you once we know exactly what needs to be fixed.`,

  'Waiting for Parts': (job, shopName) => 
    `Hello ${job.customer.name}, \n\nWe've identified the issue with your ${job.deviceType} (*${job.jobId}*). We are currently waiting for a spare part to arrive. \n\nWe'll notify you as soon as it's in stock and the repair begins!`,

  'Repair in Progress': (job, shopName) => 
    `Great news, ${job.customer.name}! \n\nWe've started the actual repair work on your ${job.deviceType} (*${job.jobId}*). \n\nWe'll let you know as soon as it's ready.`,

  'Quality Check': (job, shopName) => 
    `Almost done, ${job.customer.name}! \n\nYour ${job.deviceType} repair is complete and we're currently running a final quality check to ensure everything works perfectly.`,

  'Ready for Pickup': (job, shopName) => 
    `Hello ${job.customer.name}! \n\nYour ${job.deviceType} (*${job.jobId}*) is fully repaired and ready for pickup! \n\nPlease visit us at your convenience. Your total charge is *₹${job.finalCost || job.estimatedCost}*. \n\nThank you for trusting *${shopName}*!`,

  'Delivered / Closed': (job, shopName) => 
    `Thank you for choosing *${shopName}*, ${job.customer.name}! \n\nWe hope your ${job.deviceType} is as good as new. Feel free to reach out if you need anything else. \n\nWe'd love to see you again!`,

  'Cannot be Repaired': (job, shopName) => 
    `Hello ${job.customer.name}, \n\nWe regret to inform you that unfortunately your ${job.deviceType} (*${job.jobId}*) cannot be repaired at this time. \n\nPlease visit us to collect your device at your earliest convenience. \n\n— *${shopName}*`,

  'On Hold': (job, shopName) => 
    `Hello ${job.customer.name}, \n\nYour repair job (*${job.jobId}*) is currently on hold as requested. \n\nPlease let us know when you'd like us to proceed.`
};

const paymentReminderTemplate = (job, shopName) => 
  `Hello ${job.customer.name},\n\nThis is a gentle reminder that your repaired ${job.deviceType} (*${job.jobId}*) is ready. \n\nA payment of *₹${job.finalCost || job.estimatedCost}* is due on pickup. \n\nWe look forward to seeing you!\n\n— *${shopName}*`;

/**
 * Triggers an automated WhatsApp message based on the job status update.
 */
async function sendStatusUpdateNotification(job, shopName) {
  try {
    const templateFn = statusTemplates[job.status];
    
    if (!templateFn) {
      console.log(`No automated message configured for status: ${job.status}`);
      return false;
    }

    const message = templateFn(job, shopName);
    await whatsappService.sendMessage(job.shopOwnerId, job.customer.phone, message);
    return true;
  } catch (error) {
    console.error(`Failed to send status notification for job ${job.jobId}:`, error);
    // We don't throw here to avoid failing the DB update if WhatsApp fails
    return false;
  }
}

/**
 * Triggers a payment pending reminder.
 */
async function sendPaymentReminder(job, shopName) {
  try {
    const message = paymentReminderTemplate(job, shopName);
    await whatsappService.sendMessage(job.shopOwnerId, job.customer.phone, message);
    return true;
  } catch (error) {
    console.error(`Failed to send payment reminder for job ${job.jobId}:`, error);
    return false;
  }
}

module.exports = { 
  sendStatusUpdateNotification, 
  sendPaymentReminder,
  statusTemplates 
};
