import asyncHandler from 'express-async-handler';
import Vendor from '../models/Vendor.js';
import User from '../models/User.js';
import { logActivity } from '../utils/logActivity.js';
import { createNotification } from '../utils/createNotification.js';

export const getVendors = asyncHandler(async (req, res) => {
  const { search, status, category, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (search) filter.name = new RegExp(search, 'i');
  if (status) filter.status = status;
  if (category) filter.category = category;
  const vendors = await Vendor.find(filter)
    .skip((page - 1) * limit)
    .limit(Number(limit));
  res.json(vendors);
});

// GET /api/vendors/my-profile — vendor user fetches their own linked vendor record
export const getMyVendorProfile = asyncHandler(async (req, res) => {
  const email = req.user.email;
  const vendor = await Vendor.findOne({ email });
  if (!vendor) {
    res.status(404);
    throw new Error('No vendor profile is linked to your account. Please ask an admin to create one with your email address.');
  }
  res.json(vendor);
});


export const getVendorStats = asyncHandler(async (req, res) => {
  const counts = await Vendor.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const stats = { all: 0, active: 0, pending: 0, blocked: 0 };
  counts.forEach((item) => {
    stats[item._id] = item.count;
    stats.all += item.count;
  });
  res.json(stats);
});

export const getVendor = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findById(req.params.id);
  if (!vendor) {
    res.status(404);
    throw new Error('Vendor not found');
  }
  res.json(vendor);
});

export const createVendor = asyncHandler(async (req, res) => {
  const vendor = await Vendor.create({ ...req.body, createdBy: req.user._id });
  await logActivity({ eventType: 'vendor', description: `Vendor created: ${vendor.name} (status: pending)`, performedBy: req.user._id, entityId: vendor._id, entityType: 'Vendor' });

  // Notify all admins about the new pending vendor
  const admins = await User.find({ role: 'admin' });
  for (const admin of admins) {
    await createNotification({
      userId: admin._id,
      title: 'New Vendor Pending Approval',
      message: `Vendor "${vendor.name}" has been created and is awaiting your approval.`,
      type: 'vendor',
      entityId: vendor._id
    });
  }

  res.status(201).json(vendor);
});

export const updateVendor = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findById(req.params.id);
  if (!vendor) {
    res.status(404);
    throw new Error('Vendor not found');
  }
  Object.assign(vendor, req.body);
  await vendor.save();
  res.json(vendor);
});

export const updateVendorStatus = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findById(req.params.id);
  if (!vendor) {
    res.status(404);
    throw new Error('Vendor not found');
  }

  const allowedStatuses = ['active', 'pending', 'blocked'];
  if (!allowedStatuses.includes(req.body.status)) {
    res.status(400);
    throw new Error(`Invalid status. Must be one of: ${allowedStatuses.join(', ')}`);
  }

  const previousStatus = vendor.status;
  vendor.status = req.body.status;
  await vendor.save();

  // Determine action description
  let action = 'updated';
  if (previousStatus === 'pending' && vendor.status === 'active') action = 'approved';
  else if (previousStatus === 'pending' && vendor.status === 'blocked') action = 'rejected';
  else if (vendor.status === 'blocked') action = 'blocked';
  else if (vendor.status === 'active') action = 'activated';

  await logActivity({
    eventType: 'vendor',
    description: `Vendor ${action}: ${vendor.name} (${previousStatus} → ${vendor.status})`,
    performedBy: req.user._id,
    entityId: vendor._id,
    entityType: 'Vendor'
  });

  res.json(vendor);
});

export const deleteVendor = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findById(req.params.id);
  if (!vendor) {
    res.status(404);
    throw new Error('Vendor not found');
  }
  await vendor.deleteOne();
  res.json({ success: true, message: 'Vendor deleted' });
});
