const mongoose = require('mongoose');

const vehicleLocationSchema = new mongoose.Schema({
  vehicleId: { type: mongoose.Schema.Types.ObjectId, required: true },
  vehicleType: { type: String, required: true },
  incidentId: { type: mongoose.Schema.Types.ObjectId },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], required: true }, // [longitude, latitude]
  },
  speed: { type: Number },
  heading: { type: Number },
  recordedAt: { type: Date, default: Date.now },
}, { timestamps: true });

vehicleLocationSchema.index({ location: '2dsphere' });
vehicleLocationSchema.index({ vehicleId: 1, recordedAt: -1 });
// TTL: auto-delete location history older than 7 days
vehicleLocationSchema.index({ recordedAt: 1 }, { expireAfterSeconds: 7 * 24 * 3600 });

module.exports = mongoose.model('VehicleLocation', vehicleLocationSchema);
