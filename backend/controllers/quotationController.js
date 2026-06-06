import asyncHandler from 'express-async-handler';
import RFQ from '../models/RFQ.js';
import Quotation from '../models/Quotation.js';
import { logActivity } from '../utils/logActivity.js';

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
  if (rfqId) filter.rfq = rfqId;
  if (vendorId) filter.vendor = vendorId;
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
  res.json(quotation);
});

export const updateQuotation = asyncHandler(async (req, res) => {
  const quotation = await Quotation.findById(req.params.id);
  if (!quotation) {
    res.status(404);
    throw new Error('Quotation not found');
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
  quotation.status = 'submitted';
  quotation.submittedAt = new Date();
  calculateTotals(quotation);
  await quotation.save();
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
  await logActivity({ eventType: 'quotation', description: `Quotation rejected: ${quotation._id}`, performedBy: req.user._id, entityId: quotation._id, entityType: 'Quotation' });
  res.json(quotation);
});
