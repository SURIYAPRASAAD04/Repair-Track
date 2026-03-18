/**
 * Utility script to manually create a new Shop Tenant and Subscription
 * Run this script directly via Node.js:
 * node create_shop.js <shopName> <ownerName> <email> <password> [trialDays]
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Shop = require('./models/Shop');
const Subscription = require('./models/Subscription');

const args = process.argv.slice(2);

if (args.length < 4) {
  console.log('Usage: node create_shop.js <shopName> <ownerName> <email> <password> [trialDays]');
  console.log('Example: node create_shop.js "My Repair Shop" "John Doe" "john@example.com" "securepassword123" 14');
  process.exit(1);
}

const [shopName, ownerName, email, password, trialDaysInput] = args;
const trialDays = trialDaysInput ? parseInt(trialDaysInput) : 7;

const createShop = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.');

    // Check if user already exists
    const existingShop = await Shop.findOne({ email });
    if (existingShop) {
      console.log('❌ A shop with this email already exists.');
      process.exit(1);
    }

    console.log('Creating shop...');
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create the shop
    const newShop = new Shop({
      ownerName,
      email,
      shopName,
      password: hashedPassword,
      isActive: true
    });

    await newShop.save();

    console.log('Creating subscription...');

    // Create subscription
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + trialDays);
    
    const subscription = await Subscription.create({
      shopId: newShop._id,
      plan: 'starter',
      status: 'trial',
      billingCycle: 'monthly',
      startDate: new Date(),
      endDate
    });

    // Link subscription to shop
    newShop.subscription = subscription._id;
    await newShop.save();

    console.log('✅ Shop created successfully!');
    console.log('-----------------------------------');
    console.log(`Shop ID: ${newShop._id}`);
    console.log(`Email:   ${email}`);
    console.log(`Trial:   Expires in ${trialDays} days`);
    console.log('-----------------------------------');
    console.log('You can now log in at the main application.');

    process.exit(0);

  } catch (err) {
    console.error('❌ Error creating shop:', err.message);
    process.exit(1);
  }
};

createShop();
