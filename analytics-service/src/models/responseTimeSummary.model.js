const mongoose = require('mongoose');

// Pre-aggregated summaries per period/type/region for fast dashboard queries
const responseTimeSummarySchema = new mongoose.Schema({
  period: { type: String, required: true }, // e.g., "2025-03" or "2025-03-15"
  periodType: { type: String, enum: ['day', 'month'], required: true },
  incidentType: { type: String },
  region: { type: String },
  avgResponseTimeMinutes: { type: Number },
  totalIncidents: { type: Number, default: 0 },
  resolvedIncidents: { type: Number, default: 0 },
  computedAt: { type: Date, default: Date.now },
});

responseTimeSummarySchema.index({ period: 1, periodType: 1, incidentType: 1, region: 1 }, { unique: true });

module.exports = mongoose.model('ResponseTimeSummary', responseTimeSummarySchema);
