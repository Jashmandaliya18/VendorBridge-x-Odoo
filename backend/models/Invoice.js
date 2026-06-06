import mongoose from 'mongoose';

const InvoiceLineItemSchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  unitPrice: { type: Number, required: true },
  total: { type: Number, required: true },
}, { _id: false });

const InvoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, unique: true },
  purchaseOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder', required: true },
  rfq: { type: mongoose.Schema.Types.ObjectId, ref: 'RFQ' },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  vendorName: { type: String, required: true },
  lineItems: [InvoiceLineItemSchema],
  subtotal: { type: Number, default: 0 },
  gstAmount: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
  dueDate: { type: Date },
  paidAt: { type: Date },
  status: { type: String, enum: ['pending', 'paid', 'overdue'], default: 'pending' },
  emailSentAt: { type: Date },
}, { timestamps: true });

export default mongoose.model('Invoice', InvoiceSchema);
