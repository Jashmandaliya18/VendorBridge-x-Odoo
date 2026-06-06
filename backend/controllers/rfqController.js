import asyncHandler from 'express-async-handler';
import RFQ from '../models/RFQ.js';
import Vendor from '../models/Vendor.js';
import Quotation from '../models/Quotation.js';
import User from '../models/User.js';
import { logActivity } from '../utils/logActivity.js';
import { createNotification } from '../utils/createNotification.js';

export const getRFQs = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = {};
  
  // Vendors can only see published RFQs
  if (req.user.role === 'vendor') {
    filter.status = 'published';
  } else if (status) {
    filter.status = status;
  }

  const rfqs = await RFQ.find(filter)
    .populate('vendorIds')
    .skip((page - 1) * limit)
    .limit(Number(limit));
  res.json(rfqs);
});

export const createRFQ = asyncHandler(async (req, res) => {
  const rfq = await RFQ.create({ ...req.body, createdBy: req.user._id });
  await logActivity({ eventType: 'rfq', description: `RFQ created: ${rfq.title}`, performedBy: req.user._id, entityId: rfq._id, entityType: 'RFQ' });
  res.status(201).json(rfq);
});

export const getRFQ = asyncHandler(async (req, res) => {
  const rfq = await RFQ.findById(req.params.id).populate('vendorIds');
  if (!rfq) {
    res.status(404);
    throw new Error('RFQ not found');
  }
  res.json(rfq);
});

export const updateRFQ = asyncHandler(async (req, res) => {
  const rfq = await RFQ.findById(req.params.id);
  if (!rfq) {
    res.status(404);
    throw new Error('RFQ not found');
  }
  if (rfq.status !== 'draft') {
    res.status(400);
    throw new Error('Only drafts can be updated');
  }
  Object.assign(rfq, req.body);
  await rfq.save();
  res.json(rfq);
});

export const publishRFQ = asyncHandler(async (req, res) => {
  const rfq = await RFQ.findById(req.params.id);
  if (!rfq) {
    res.status(404);
    throw new Error('RFQ not found');
  }
  rfq.status = 'published';
  await rfq.save();

  // Create notifications for assigned vendors
  const vendors = await Vendor.find({ _id: { $in: rfq.vendorIds } });
  const vendorEmails = vendors.map((v) => v.email).filter(Boolean);
  if (vendorEmails.length > 0) {
    const users = await User.find({ email: { $in: vendorEmails }, role: 'vendor' });
    for (const user of users) {
      await createNotification({
        userId: user._id,
        title: 'New RFQ Assigned',
        message: `You have been assigned to the new RFQ "${rfq.title}". Please submit your quotation before the deadline.`,
        type: 'rfq',
        entityId: rfq._id
      });
    }
  }

  await logActivity({ eventType: 'rfq', description: `RFQ published: ${rfq.title}`, performedBy: req.user._id, entityId: rfq._id, entityType: 'RFQ' });
  res.json(rfq);
});

export const closeRFQ = asyncHandler(async (req, res) => {
  const rfq = await RFQ.findById(req.params.id);
  if (!rfq) {
    res.status(404);
    throw new Error('RFQ not found');
  }
  rfq.status = 'closed';
  await rfq.save();
  res.json(rfq);
});

export const deleteRFQ = asyncHandler(async (req, res) => {
  const rfq = await RFQ.findById(req.params.id);
  if (!rfq) {
    res.status(404);
    throw new Error('RFQ not found');
  }
  if (rfq.status !== 'draft') {
    res.status(400);
    throw new Error('Only draft RFQs can be deleted');
  }
  await rfq.deleteOne();
  res.json({ success: true, message: 'RFQ deleted' });
});

export const uploadRFQAttachment = asyncHandler(async (req, res) => {
  const rfq = await RFQ.findById(req.params.id);
  if (!rfq) {
    res.status(404);
    throw new Error('RFQ not found');
  }
  if (req.file) {
    rfq.attachments.push(`/uploads/${req.file.filename}`);
    await rfq.save();
  }
  res.json(rfq);
});

export const addRFQVendors = asyncHandler(async (req, res) => {
  const rfq = await RFQ.findById(req.params.id);
  if (!rfq) {
    res.status(404);
    throw new Error('RFQ not found');
  }
  const vendorIds = req.body.vendorIds || [];
  const vendors = await Vendor.find({ _id: { $in: vendorIds } });
  rfq.vendorIds = Array.from(new Set([...rfq.vendorIds.map(String), ...vendors.map((v) => String(v._id))]));
  await rfq.save();
  res.json(rfq);
});

export const getRFQQuotations = asyncHandler(async (req, res) => {
  const rfq = await RFQ.findById(req.params.rfqId);
  if (!rfq) {
    res.status(404);
    throw new Error('RFQ not found');
  }
  const quotations = await Quotation.find({ rfq: rfq._id }).populate('vendor submittedBy');
  res.json(quotations);
});
