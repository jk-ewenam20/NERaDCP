const mongoose = require('mongoose');

// One document per vehicle — upserted on each GPS ping
const livePositionSchema = new mongoose.Schema({
  vehicleId: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true },
  vehicleType: { type: String, required: true },
  incidentId: { type: mongoose.Schema.Types.ObjectId },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], required: true }, // [longitude, latitude]
  },
  speed: { type: Number },
  heading: { type: Number },
  lastUpdated: { type: Date, default: Date.now },
});

livePositionSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('LivePosition', livePositionSchema);
