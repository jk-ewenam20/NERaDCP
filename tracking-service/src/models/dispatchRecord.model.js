const mongoose = require('mongoose');

const dispatchRecordSchema = new mongoose.Schema({
  incidentId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, required: true },
  vehicleType: {
    type: String,
    enum: ['ambulance', 'police_vehicle', 'fire_truck'],
    required: true,
  },
  driverId: { type: mongoose.Schema.Types.ObjectId },
  dispatchedAt: { type: Date, default: Date.now },
  arrivedAt: { type: Date },
  completedAt: { type: Date },
  status: {
    type: String,
    enum: ['en_route', 'arrived', 'completed', 'cancelled'],
    default: 'en_route',
  },
}, { timestamps: true });

module.exports = mongoose.model('DispatchRecord', dispatchRecordSchema);
