const mongoose = require('mongoose');

const firePersonnelSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  stationId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  badgeNumber: { type: String, required: true, unique: true, trim: true },
  rank: { type: String, required: true },
  isOnDuty: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('FirePersonnel', firePersonnelSchema);
