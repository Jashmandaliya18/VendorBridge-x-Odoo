import mongoose from 'mongoose';

const ApprovalLevelSchema = new mongoose.Schema({
  level: { type: Number, required: true },
  approver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  remarks: { type: String },
  actionedAt: { type: Date },
}, { _id: false });

const ApprovalSchema = new mongoose.Schema({
  rfq: { type: mongoose.Schema.Types.ObjectId, ref: 'RFQ', required: true },
  quotation: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation', required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  levels: [ApprovalLevelSchema],
  initiatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.model('Approval', ApprovalSchema);
