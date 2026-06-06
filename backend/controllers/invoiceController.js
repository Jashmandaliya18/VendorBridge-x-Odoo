import asyncHandler from 'express-async-handler';
import Invoice from '../models/Invoice.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import { generateInvoiceNumber } from '../utils/generateNumber.js';
import { generateInvoicePDF } from '../utils/pdfGenerator.js';
import { logActivity } from '../utils/logActivity.js';
import { sendEmail } from '../utils/emailSender.js';

export const getInvoices = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === 'vendor') {
    const Quotation = (await import('../models/Quotation.js')).default;
    const vendorQuotations = await Quotation.find({ submittedBy: req.user._id }).select('_id');
    const quotationIds = vendorQuotations.map((q) => q._id);
    
    const PurchaseOrder = (await import('../models/PurchaseOrder.js')).default;
    const vendorPOs = await PurchaseOrder.find({ quotation: { $in: quotationIds } }).select('_id');
    const poIds = vendorPOs.map((po) => po._id);
    
    filter.purchaseOrder = { $in: poIds };
  }
  const invoices = await Invoice.find(filter).populate('purchaseOrder rfq vendor');
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
  const pdf = await generateInvoicePDF(invoice);
  res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename=${invoice.invoiceNumber}.pdf` });
  res.send(pdf);
});

export const sendInvoiceEmail = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id).populate('vendor');
  if (!invoice) {
    res.status(404);
    throw new Error('Invoice not found');
  }
  const { to, cc, body } = req.body;
  if (!to) {
    res.status(400);
    throw new Error('Recipient email (to) is required');
  }

  const pdfBuffer = await generateInvoicePDF(invoice);

  await sendEmail({
    to,
    cc,
    subject: `Invoice ${invoice.invoiceNumber} - VendorBridge`,
    html: body || `<p>Please find attached the Invoice <strong>${invoice.invoiceNumber}</strong>.</p>`,
    attachments: [
      {
        filename: `${invoice.invoiceNumber}.pdf`,
        content: pdfBuffer,
      }
    ]
  });

  await logActivity({
    eventType: 'invoice',
    description: `Invoice ${invoice.invoiceNumber} emailed to ${to}`,
    performedBy: req.user._id,
    entityId: invoice._id,
    entityType: 'Invoice'
  });

  res.json({ success: true, message: 'Invoice emailed successfully' });
});

export const markInvoicePaid = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) {
    res.status(404);
    throw new Error('Invoice not found');
  }
  if (invoice.status === 'paid') {
    res.status(400);
    throw new Error('Invoice is already marked as paid');
  }
  invoice.status = 'paid';
  invoice.paidAt = new Date();
  await invoice.save();
  await logActivity({
    eventType: 'invoice',
    description: `Invoice marked as paid: ${invoice.invoiceNumber}`,
    performedBy: req.user._id,
    entityId: invoice._id,
    entityType: 'Invoice'
  });

  // Update PO status to completed
  await PurchaseOrder.findByIdAndUpdate(invoice.purchaseOrder, { status: 'completed' });

  res.json(invoice);
});
