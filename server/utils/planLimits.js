const PLAN_LIMITS = {
  starter: {
    maxJobs: 100,          // per month
    maxCustomers: 200,
    whatsappMessages: 500, // per month
    multipleUsers: false,
    reports: false,
    mobileApp: false
  },
  business: {
    maxJobs: 500,
    maxCustomers: 1000,
    whatsappMessages: 2000,
    multipleUsers: false,
    reports: true,
    mobileApp: false
  },
  advanced: {
    maxJobs: -1,           // unlimited
    maxCustomers: -1,
    whatsappMessages: 5000,
    multipleUsers: true,   // up to 3 users
    reports: true,
    mobileApp: false
  },
  mobile_app: {
    maxJobs: -1,
    maxCustomers: -1,
    whatsappMessages: -1,
    multipleUsers: true,
    reports: true,
    mobileApp: true
  }
};

const PRICING = {
  starter:    { setup: 999,  monthly: 249, quarterly: 699,  half_yearly: 1299, yearly: 2399 },
  business:   { setup: 1999, monthly: 429, quarterly: 1199, half_yearly: 2299, yearly: 4199 },
  advanced:   { setup: 2999, monthly: 699, quarterly: 1999, half_yearly: 3799, yearly: 6999 },
  mobile_app: { setup: 4999, monthly: 799, quarterly: 2299, half_yearly: 4399, yearly: 8199 }
};

module.exports = { PLAN_LIMITS, PRICING };
