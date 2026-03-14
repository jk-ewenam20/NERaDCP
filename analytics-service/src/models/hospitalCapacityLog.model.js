const mongoose = require('mongoose');

const hospitalCapacityLogSchema = new mongoose.Schema({
  hospitalId: { type: mongoose.Schema.Types.ObjectId, required: true },
  hospitalName: { type: String },
  totalBeds: { type: Number },
  availableBeds: { type: Number },
  occupancyPercent: { type: Number },
  recordedAt: { type: Date, default: Date.now },
});

hospitalCapacityLogSchema.index({ hospitalId: 1, recordedAt: -1 });

module.exports = mongoose.model('HospitalCapacityLog', hospitalCapacityLogSchema);
