import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, trim: true },
  read: { type: Boolean, default: false },
  entityId: { type: mongoose.Schema.Types.ObjectId },
}, { timestamps: true });

export default mongoose.model('Notification', NotificationSchema);
