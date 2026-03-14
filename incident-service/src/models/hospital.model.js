const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  address: { type: String, required: true },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], required: true }, // [longitude, latitude]
  },
  totalBeds: { type: Number, required: true, min: 0 },
  availableBeds: { type: Number, required: true, min: 0 },
  contactPhone: { type: String },
  contactEmail: { type: String },
  status: { type: String, enum: ['active', 'inactive', 'full'], default: 'active' },
}, { timestamps: true });

hospitalSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Hospital', hospitalSchema);
