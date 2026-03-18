const getMessageForStatus = (status, data) => {
  // data = { customerName, deviceType, deviceBrand, deviceModel, jobId, shopName, amount, reason }
  
  const templates = {
    Received: `Hello ${data.customerName}! 👋\n\nWe have received your *${data.deviceBrand} ${data.deviceModel}* for repair.\n\n🔖 Job ID: *${data.jobId}*\n📅 Date: ${data.date}\n\nWe will keep you updated at every step. Thank you for choosing *${data.shopName}*! 🙏`,
    
    'Under Diagnosis': `Hi ${data.customerName}! 🔍\n\nOur technician has started diagnosing your *${data.deviceBrand} ${data.deviceModel}*.\n\n🔖 Job ID: *${data.jobId}*\n\nWe'll let you know once we identify the issue. — *${data.shopName}*`,
    
    'Waiting for Parts': `Hi ${data.customerName}! ⏳\n\nWe've identified the issue with your *${data.deviceBrand} ${data.deviceModel}*.\n\nWe've ordered the required part and will begin repairs as soon as it arrives.\n\n🔖 Job ID: *${data.jobId}*\n\nThank you for your patience! — *${data.shopName}*`,
    
    'Repair in Progress': `Hi ${data.customerName}! 🔧\n\nGreat news! Our technician has started repairing your *${data.deviceBrand} ${data.deviceModel}*.\n\n🔖 Job ID: *${data.jobId}*\n\nWe'll notify you as soon as it's done! — *${data.shopName}*`,
    
    'Quality Check': `Hi ${data.customerName}! ✅\n\nThe repair on your *${data.deviceBrand} ${data.deviceModel}* is complete! We're running a final quality check to make sure everything is perfect.\n\n🔖 Job ID: *${data.jobId}*\n\nAlmost ready! — *${data.shopName}*`,
    
    'Ready for Pickup': `Hi ${data.customerName}! 🎉\n\nYour *${data.deviceBrand} ${data.deviceModel}* is READY FOR PICKUP!\n\n🔖 Job ID: *${data.jobId}*\n💰 Total Amount: ₹${data.amount}\n\nPlease visit us at your earliest convenience.\n\nThank you for trusting *${data.shopName}*! 🙏`,
    
    'Delivered / Closed': `Hi ${data.customerName}! 😊\n\nThank you for collecting your *${data.deviceBrand} ${data.deviceModel}*.\n\nWe hope it's working perfectly! If you face any issues, feel free to contact us.\n\nSee you next time! — *${data.shopName}* ⭐`,
    
    'Cannot be Repaired': `Hi ${data.customerName}.\n\nWe regret to inform you that your *${data.deviceBrand} ${data.deviceModel}* unfortunately cannot be repaired${data.reason ? ` (${data.reason})` : ''}.\n\n🔖 Job ID: *${data.jobId}*\n\nPlease visit us to collect your device. We're sorry for the inconvenience. — *${data.shopName}*`,
    
    'On Hold': `Hi ${data.customerName}.\n\nYour repair job for *${data.deviceBrand} ${data.deviceModel}* is currently on hold.\n\n🔖 Job ID: *${data.jobId}*\n\nPlease contact us when you'd like us to proceed. — *${data.shopName}*`
  };
  
  return templates[status] || null;
};

module.exports = { getMessageForStatus };
