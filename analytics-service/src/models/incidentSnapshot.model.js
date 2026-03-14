const mongoose = require('mongoose');

const incidentSnapshotSchema = new mongoose.Schema({
  incidentId: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true },
  incidentType: { type: String },
  region: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },
  status: { type: String },
  assignedUnitType: { type: String },
  responseTimeMinutes: { type: Number },
  dispatchedAt: { type: Date },
  resolvedAt: { type: Date },
  createdAt: { type: Date },
});

incidentSnapshotSchema.index({ incidentType: 1 });
incidentSnapshotSchema.index({ region: 1 });
incidentSnapshotSchema.index({ createdAt: -1 });
incidentSnapshotSchema.index({ status: 1 });

module.exports = mongoose.model('IncidentSnapshot', incidentSnapshotSchema);
