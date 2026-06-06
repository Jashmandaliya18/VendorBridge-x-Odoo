import asyncHandler from 'express-async-handler';
import Vendor from '../models/Vendor.js';
import { logActivity } from '../utils/logActivity.js';

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
  await logActivity({ eventType: 'vendor', description: `Vendor created: ${vendor.name}`, performedBy: req.user._id, entityId: vendor._id, entityType: 'Vendor' });
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
  vendor.status = req.body.status || vendor.status;
  await vendor.save();
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
