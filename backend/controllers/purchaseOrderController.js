import asyncHandler from 'express-async-handler';
import PurchaseOrder from '../models/PurchaseOrder.js';
import Quotation from '../models/Quotation.js';
import { generatePONumber } from '../utils/generateNumber.js';
import { generatePOPDF } from '../utils/pdfGenerator.js';
import { logActivity } from '../utils/logActivity.js';
import { sendEmail } from '../utils/emailSender.js';

export const getPurchaseOrders = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === 'vendor') {
    const Quotation = (await import('../models/Quotation.js')).default;
    const vendorQuotations = await Quotation.find({ submittedBy: req.user._id }).select('_id');
    const quotationIds = vendorQuotations.map((q) => q._id);
    filter.quotation = { $in: quotationIds };
  }
  const orders = await PurchaseOrder.find(filter).populate('quotation rfq vendor createdBy');
  res.json(orders);
});

export const createPO = asyncHandler(async (req, res) => {
  const quotation = await Quotation.findById(req.body.quotationId).populate('vendor rfq');
  if (!quotation) {
    res.status(404);
    throw new Error('Quotation not found');
  }
  const poNumber = await generatePONumber();
  const lineItems = quotation.lineItems.map((item) => ({ ...item }));
  const subtotal = quotation.subtotal;
  const cgst = subtotal * 0.09;
  const sgst = subtotal * 0.09;
  const grandTotal = subtotal + cgst + sgst;
  const billTo = req.body.billTo || {
    name: 'VendorBridge Corp',
    address: '123 Procurement Way, Tech City, India',
    gstin: '29ABCDE1234F1ZH'
  };
  const poDate = req.body.poDate || new Date();

  const po = await PurchaseOrder.create({
    poNumber,
    quotation: quotation._id,
    rfq: quotation.rfq,
    vendor: quotation.vendor,
    vendorName: quotation.vendor?.name || '',
    lineItems,
    subtotal,
    cgst,
    sgst,
    grandTotal,
    billTo,
    poDate,
    status: req.body.status || 'pending_payment',
    createdBy: req.user._id,
  });
  await logActivity({ eventType: 'po', description: `PO created: ${po.poNumber}`, performedBy: req.user._id, entityId: po._id, entityType: 'PurchaseOrder' });
  res.status(201).json(po);
});

export const getPO = asyncHandler(async (req, res) => {
  const po = await PurchaseOrder.findById(req.params.id).populate('quotation rfq vendor createdBy');
  if (!po) {
    res.status(404);
    throw new Error('PO not found');
  }
  res.json(po);
});

export const updatePOStatus = asyncHandler(async (req, res) => {
  const po = await PurchaseOrder.findById(req.params.id);
  if (!po) {
    res.status(404);
    throw new Error('PO not found');
  }
  po.status = req.body.status || po.status;
  await po.save();
  res.json(po);
});

export const downloadPOPdf = asyncHandler(async (req, res) => {
  const po = await PurchaseOrder.findById(req.params.id).populate('vendor');
  if (!po) {
    res.status(404);
    throw new Error('PO not found');
  }
  const pdf = await generatePOPDF(po);
  res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename=${po.poNumber}.pdf` });
  res.send(pdf);
});

export const sendPOEmail = asyncHandler(async (req, res) => {
  const po = await PurchaseOrder.findById(req.params.id).populate('vendor');
  if (!po) {
    res.status(404);
    throw new Error('PO not found');
  }
  const { to, cc, body } = req.body;
  if (!to) {
    res.status(400);
    throw new Error('Recipient email (to) is required');
  }

  const pdfBuffer = await generatePOPDF(po);

  await sendEmail({
    to,
    cc,
    subject: `Purchase Order ${po.poNumber} - VendorBridge`,
    html: body || `<p>Please find attached the Purchase Order <strong>${po.poNumber}</strong>.</p>`,
    attachments: [
      {
        filename: `${po.poNumber}.pdf`,
        content: pdfBuffer,
      }
    ]
  });

  await logActivity({
    eventType: 'po',
    description: `PO ${po.poNumber} emailed to ${to}`,
    performedBy: req.user._id,
    entityId: po._id,
    entityType: 'PurchaseOrder'
  });

  res.json({ success: true, message: 'Purchase Order emailed successfully' });
});
