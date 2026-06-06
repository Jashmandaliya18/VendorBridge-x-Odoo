import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import errorHandler from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import vendorRoutes from './routes/vendors.js';
import rfqRoutes from './routes/rfqs.js';
import quotationRoutes from './routes/quotations.js';
import approvalRoutes from './routes/approvals.js';
import poRoutes from './routes/purchaseOrders.js';
import invoiceRoutes from './routes/invoices.js';
import activityRoutes from './routes/activity.js';
import reportRoutes from './routes/reports.js';
import dashboardRoutes from './routes/dashboard.js';
import notificationRoutes from './routes/notifications.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

const seedAdminUser = async () => {
  try {
    const User = (await import('./models/User.js')).default;
    const existingUser = await User.findOne({ email: 'admin@vendorbridge.test' });
    if (!existingUser) {
      await User.create({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@vendorbridge.test',
        password: 'Password123!',
        role: 'admin',
      });
      console.log('Seeded default admin user: admin@vendorbridge.test / Password123!');
    }
  } catch (error) {
    console.error('Failed to seed default user:', error.message);
  }
};

connectDB().then(seedAdminUser);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({ origin: [process.env.CLIENT_URL || 'http://localhost:5173', 'http://localhost:5174'], credentials: true }));
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/rfqs', rfqRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/purchase-orders', poRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`VendorBridge backend running on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the running process or change PORT in .env.`);
  } else {
    console.error(err);
  }
  process.exit(1);
});
