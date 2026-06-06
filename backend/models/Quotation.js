import mongoose from 'mongoose';

const QuotationLineItemSchema = new mongoose.Schema({
  rfqLineItemIndex: { type: Number, required: true },
  itemName: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  unitPrice: { type: Number, required: true },
  total: { type: Number, required: true },
  deliveryDays: { type: Number },
}, { _id: false });

const QuotationSchema = new mongoose.Schema({
  rfq: { type: mongoose.Schema.Types.ObjectId, ref: 'RFQ', required: true },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['draft', 'submitted', 'selected', 'rejected'], default: 'draft' },
  lineItems: [QuotationLineItemSchema],
  gstPercent: { type: Number, default: 18 },
  subtotal: { type: Number, default: 0 },
  gstAmount: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
  notes: { type: String },
  deliveryDays: { type: Number },
  paymentTerms: { type: String },
  submittedAt: { type: Date },
}, { timestamps: true });

export default mongoose.model('Quotation', QuotationSchema);
