import PurchaseOrder from '../models/PurchaseOrder.js';
import Invoice from '../models/Invoice.js';

const pad = (value, width = 4) => String(value).padStart(width, '0');

export const generatePONumber = async () => {
  const year = new Date().getFullYear();
  const lastPO = await PurchaseOrder.findOne({}).sort({ createdAt: -1 });
  const next = lastPO ? Number(lastPO.poNumber.split('-')[2]) + 1 : 1;
  return `PO-${year}-${pad(next)}`;
};

export const generateInvoiceNumber = async () => {
  const year = new Date().getFullYear();
  const lastInvoice = await Invoice.findOne({}).sort({ createdAt: -1 });
  const next = lastInvoice ? Number(lastInvoice.invoiceNumber.split('-')[2]) + 1 : 1;
  return `INV-${year}-${pad(next)}`;
};
