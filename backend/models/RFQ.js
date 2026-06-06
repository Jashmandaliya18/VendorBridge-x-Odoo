import mongoose from 'mongoose';

const LineItemSchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  description: { type: String },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
}, { _id: false });

const RFQSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, trim: true },
  description: { type: String },
  deadline: { type: Date, required: true },
  status: { type: String, enum: ['draft', 'published', 'closed', 'cancelled'], default: 'draft' },
  vendorIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', alias: 'assignedVendors' }],
  attachments: [{
    fileName: { type: String },
    fileUrl: { type: String },
    uploadedAt: { type: Date, default: Date.now }
  }],
  lineItems: [LineItemSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

export default mongoose.model('RFQ', RFQSchema);
