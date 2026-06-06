import asyncHandler from 'express-async-handler';
import RFQ from '../models/RFQ.js';
import Quotation from '../models/Quotation.js';
import User from '../models/User.js';
import Approval from '../models/Approval.js';
import { logActivity } from '../utils/logActivity.js';
import { createNotification } from '../utils/createNotification.js';
import { generateQuotationPDF } from '../utils/pdfGenerator.js';

const calculateTotals = (quotation) => {
  const subtotal = quotation.lineItems.reduce((sum, item) => sum + Number(item.total || item.quantity * item.unitPrice), 0);
  const gstAmount = subtotal * (quotation.gstPercent / 100 || 0);
  const grandTotal = subtotal + gstAmount;
  quotation.subtotal = subtotal;
  quotation.gstAmount = gstAmount;
  quotation.grandTotal = grandTotal;
};

export const getQuotations = asyncHandler(async (req, res) => {
  const { rfqId, vendorId, status } = req.query;
  const filter = {};

  if (req.user.role === 'vendor') {
    filter.submittedBy = req.user._id;
  } else {
    if (rfqId) filter.rfq = rfqId;
    if (vendorId) filter.vendor = vendorId;
  }

  if (status) filter.status = status;

  const quotations = await Quotation.find(filter).populate('rfq vendor submittedBy');
  res.json(quotations);
});

export const createQuotation = asyncHandler(async (req, res) => {
  const quotation = new Quotation({ ...req.body, submittedBy: req.user._id });
  calculateTotals(quotation);
  await quotation.save();
  await logActivity({ eventType: 'quotation', description: `Quotation created for RFQ ${quotation.rfq}`, performedBy: req.user._id, entityId: quotation._id, entityType: 'Quotation' });
  res.status(201).json(quotation);
});

export const getQuotation = asyncHandler(async (req, res) => {
  const quotation = await Quotation.findById(req.params.id).populate('rfq vendor submittedBy');
  if (!quotation) {
    res.status(404);
    throw new Error('Quotation not found');
  }

  if (req.user.role === 'vendor' && !quotation.submittedBy.equals(req.user._id)) {
    res.status(403);
    throw new Error('Not authorized to view this quotation');
  }

  res.json(quotation);
});

export const updateQuotation = asyncHandler(async (req, res) => {
  const quotation = await Quotation.findById(req.params.id);
  if (!quotation) {
    res.status(404);
    throw new Error('Quotation not found');
  }

  if (!quotation.submittedBy.equals(req.user._id)) {
    res.status(403);
    throw new Error('Not authorized to update this quotation');
  }

  if (quotation.status !== 'draft') {
    res.status(400);
    throw new Error('Only drafts can be updated');
  }

  Object.assign(quotation, req.body);
  calculateTotals(quotation);
  await quotation.save();
  res.json(quotation);
});

export const submitQuotation = asyncHandler(async (req, res) => {
  const quotation = await Quotation.findById(req.params.id);
  if (!quotation) {
    res.status(404);
    throw new Error('Quotation not found');
  }

  if (!quotation.submittedBy.equals(req.user._id)) {
    res.status(403);
    throw new Error('Not authorized to submit this quotation');
  }

  quotation.status = 'submitted';
  quotation.submittedAt = new Date();
  calculateTotals(quotation);
  await quotation.save();

  // Notify RFQ creator
  const rfq = await RFQ.findById(quotation.rfq);
  if (rfq) {
    await createNotification({
      userId: rfq.createdBy,
      title: 'Quotation Submitted',
      message: `A new quotation has been submitted for RFQ "${rfq.title}" by vendor.`,
      type: 'quotation',
      entityId: quotation._id
    });
  }

  await logActivity({ eventType: 'quotation', description: `Quotation submitted for RFQ ${quotation.rfq}`, performedBy: req.user._id, entityId: quotation._id, entityType: 'Quotation' });
  res.json(quotation);
});

export const selectQuotation = asyncHandler(async (req, res) => {
  const quotation = await Quotation.findById(req.params.id);
  if (!quotation) {
    res.status(404);
    throw new Error('Quotation not found');
  }
  quotation.status = 'selected';
  await quotation.save();

  // Create approval document with 2 levels of managers
  const managers = await User.find({ role: 'manager', status: 'active' }).limit(2);
  const levels = managers.map((manager, idx) => ({
    level: idx + 1,
    approver: manager._id,
    status: 'pending'
  }));

  const approval = await Approval.create({
    rfq: quotation.rfq,
    quotation: quotation._id,
    status: 'pending',
    levels,
    initiatedBy: req.user._id
  });

  // Notify first manager in the chain
  if (managers.length > 0) {
    await createNotification({
      userId: managers[0]._id,
      title: 'Quotation Approval Required',
      message: `Quotation for RFQ ${quotation.rfq} has been selected and requires your Level 1 approval.`,
      type: 'approval',
      entityId: approval._id
    });
  }

  // Notify vendor
  await createNotification({
    userId: quotation.submittedBy,
    title: 'Quotation Selected',
    message: `Your quotation for RFQ ${quotation.rfq} has been selected and is pending approval.`,
    type: 'quotation',
    entityId: quotation._id
  });

  await logActivity({ eventType: 'quotation', description: `Quotation selected: ${quotation._id}`, performedBy: req.user._id, entityId: quotation._id, entityType: 'Quotation' });
  res.json(quotation);
});

export const rejectQuotation = asyncHandler(async (req, res) => {
  const quotation = await Quotation.findById(req.params.id);
  if (!quotation) {
    res.status(404);
    throw new Error('Quotation not found');
  }
  quotation.status = 'rejected';
  await quotation.save();

  // Notify vendor
  await createNotification({
    userId: quotation.submittedBy,
    title: 'Quotation Rejected',
    message: `Your quotation for RFQ ${quotation.rfq} has been rejected.`,
    type: 'quotation',
    entityId: quotation._id
  });

  await logActivity({ eventType: 'quotation', description: `Quotation rejected: ${quotation._id}`, performedBy: req.user._id, entityId: quotation._id, entityType: 'Quotation' });
  res.json(quotation);
});

export const downloadQuotationPdf = asyncHandler(async (req, res) => {
  const quotation = await Quotation.findById(req.params.id).populate('vendor submittedBy rfq');
  if (!quotation) {
    res.status(404);
    throw new Error('Quotation not found');
  }

  // Authorization check
  if (req.user.role === 'vendor' && !quotation.submittedBy.equals(req.user._id)) {
    res.status(403);
    throw new Error('Not authorized to access this quotation');
  }

  const pdf = await generateQuotationPDF(quotation);
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename=Quotation-${quotation._id.toString().slice(-6).toUpperCase()}.pdf`
  });
  res.send(pdf);
});
