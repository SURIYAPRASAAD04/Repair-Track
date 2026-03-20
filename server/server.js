require('dotenv').config();

// ─── GLOBAL CRASH PREVENTION ───
// whatsapp-web.js can throw unhandled errors internally (e.g. "Execution context destroyed").
// Without these handlers, the entire Node.js process dies and Railway restarts it in a crash loop.
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception (process NOT killed):', err.message);
  // Do NOT call process.exit() — keep the server alive
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled Promise Rejection (process NOT killed):', reason?.message || reason);
  // Do NOT call process.exit() — keep the server alive
});

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const whatsappRoutes = require('./routes/whatsappRoutes');
const jobRoutes = require('./routes/jobRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(cors({
  origin: [process.env.CLIENT_URL || 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true
}));
app.use(express.json());

// Main Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/admin', adminRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Server error, please try again later' });
});

// Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
