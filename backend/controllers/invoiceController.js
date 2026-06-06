import asyncHandler from 'express-async-handler';
import Invoice from '../models/Invoice.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import { generateInvoiceNumber } from '../utils/generateNumber.js';
import { generateInvoicePDF } from '../utils/pdfGenerator.js';
import { logActivity } from '../utils/logActivity.js';

export const getInvoices = asyncHandler(async (req, res) => {
  const invoices = await Invoice.find().populate('purchaseOrder rfq vendor');
  res.json(invoices);
});

export const createInvoice = asyncHandler(async (req, res) => {
  const purchaseOrder = await PurchaseOrder.findById(req.body.purchaseOrderId).populate('vendor rfq');
  if (!purchaseOrder) {
    res.status(404);
    throw new Error('PO not found');
  }
  const invoiceNumber = await generateInvoiceNumber();
  const invoice = await Invoice.create({
    invoiceNumber,
    purchaseOrder: purchaseOrder._id,
    rfq: purchaseOrder.rfq,
    vendor: purchaseOrder.vendor,
    vendorName: purchaseOrder.vendorName,
    lineItems: purchaseOrder.lineItems,
    subtotal: purchaseOrder.subtotal,
    gstAmount: purchaseOrder.cgst + purchaseOrder.sgst,
    grandTotal: purchaseOrder.grandTotal,
    dueDate: req.body.dueDate,
  });
  await logActivity({ eventType: 'invoice', description: `Invoice created: ${invoice.invoiceNumber}`, performedBy: req.user._id, entityId: invoice._id, entityType: 'Invoice' });
  res.status(201).json(invoice);
});

export const getInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id).populate('purchaseOrder rfq vendor');
  if (!invoice) {
    res.status(404);
    throw new Error('Invoice not found');
  }
  res.json(invoice);
});

export const downloadInvoicePdf = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id).populate('vendor');
  if (!invoice) {
    res.status(404);
    throw new Error('Invoice not found');
  }
  const pdf = generateInvoicePDF(invoice);
  res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename=${invoice.invoiceNumber}.pdf` });
  res.send(pdf);
});

export const sendInvoiceEmail = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Invoice email request received' });
});

export const markInvoicePaid = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) {
    res.status(404);
    throw new Error('Invoice not found');
  }
  invoice.status = 'paid';
  await invoice.save();
  res.json(invoice);
});
