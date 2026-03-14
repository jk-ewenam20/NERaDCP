const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  changedAt: { type: Date, default: Date.now },
  changedBy: { type: mongoose.Schema.Types.ObjectId },
}, { _id: false });

const assignedUnitSchema = new mongoose.Schema({
  unitId: { type: mongoose.Schema.Types.ObjectId },
  unitType: { type: String, enum: ['ambulance', 'police_station', 'fire_station'] },
  unitName: { type: String },
  hospitalId: { type: mongoose.Schema.Types.ObjectId },
  hospitalName: { type: String },
}, { _id: false });

const incidentSchema = new mongoose.Schema({
  citizenName: { type: String, required: true, trim: true },
  citizenPhone: { type: String },
  incidentType: {
    type: String,
    enum: ['medical', 'fire', 'crime', 'accident', 'other'],
    required: true,
  },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], required: true }, // [longitude, latitude]
  },
  address: { type: String },
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, required: true },
  assignedUnit: assignedUnitSchema,
  status: {
    type: String,
    enum: ['created', 'dispatched', 'in_progress', 'resolved', 'cancelled'],
    default: 'created',
    index: true,
  },
  statusHistory: [statusHistorySchema],
  dispatchedAt: { type: Date },
  resolvedAt: { type: Date },
  responseTimeMinutes: { type: Number },
}, { timestamps: true });

incidentSchema.index({ location: '2dsphere' });
incidentSchema.index({ incidentType: 1 });
incidentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Incident', incidentSchema);
