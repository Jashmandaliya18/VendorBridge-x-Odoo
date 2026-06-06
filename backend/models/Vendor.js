import mongoose from 'mongoose';

const VendorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { type: String, trim: true },
  gstNumber: { type: String, trim: true },
  contactNumber: { type: String, trim: true },
  email: { type: String, trim: true },
  address: { type: String, trim: true },
  status: { type: String, enum: ['active', 'pending', 'blocked'], default: 'pending' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.model('Vendor', VendorSchema);
