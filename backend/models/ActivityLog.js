import mongoose from 'mongoose';

const ActivityLogSchema = new mongoose.Schema({
  eventType: { type: String, enum: ['rfq', 'approval', 'invoice', 'vendor', 'quotation', 'po'], required: true },
  description: { type: String, required: true },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  entityId: { type: mongoose.Schema.Types.ObjectId },
  entityType: { type: String },
}, { timestamps: true });

ActivityLogSchema.pre('findOneAndUpdate', function () { throw new Error('ActivityLog is immutable'); });
ActivityLogSchema.pre('updateOne', function () { throw new Error('ActivityLog is immutable'); });
ActivityLogSchema.pre('deleteOne', function () { throw new Error('ActivityLog is immutable'); });
ActivityLogSchema.pre('findOneAndDelete', function () { throw new Error('ActivityLog is immutable'); });

export default mongoose.model('ActivityLog', ActivityLogSchema);
