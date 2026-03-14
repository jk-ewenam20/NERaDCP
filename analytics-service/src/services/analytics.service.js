const IncidentSnapshot = require('../models/incidentSnapshot.model');
const ResponseTimeSummary = require('../models/responseTimeSummary.model');

async function getResponseTimes({ from, to, incidentType, periodType = 'month' }) {
  const match = {};
  if (from || to) {
    match.createdAt = {};
    if (from) match.createdAt.$gte = new Date(from);
    if (to) match.createdAt.$lte = new Date(to);
  }
  if (incidentType) match.incidentType = incidentType;

  const dateFormat = periodType === 'day' ? '%Y-%m-%d' : '%Y-%m';

  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: {
          period: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          incidentType: '$incidentType',
        },
        avgResponseTimeMinutes: { $avg: '$responseTimeMinutes' },
        totalIncidents: { $sum: 1 },
        resolvedIncidents: {
          $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] },
        },
      },
    },
    {
      $project: {
        _id: 0,
        period: '$_id.period',
        incidentType: '$_id.incidentType',
        avgResponseTimeMinutes: { $round: ['$avgResponseTimeMinutes', 2] },
        totalIncidents: 1,
        resolvedIncidents: 1,
      },
    },
    { $sort: { period: 1 } },
  ];

  return IncidentSnapshot.aggregate(pipeline);
}

async function getIncidentsByRegion({ from, to } = {}) {
  const match = {};
  if (from || to) {
    match.createdAt = {};
    if (from) match.createdAt.$gte = new Date(from);
    if (to) match.createdAt.$lte = new Date(to);
  }

  return IncidentSnapshot.aggregate([
    { $match: match },
    {
      $group: {
        _id: { region: '$region', incidentType: '$incidentType' },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        region: '$_id.region',
        incidentType: '$_id.incidentType',
        count: 1,
      },
    },
    { $sort: { region: 1, count: -1 } },
  ]);
}

async function getIncidentsByType({ from, to } = {}) {
  const match = {};
  if (from || to) {
    match.createdAt = {};
    if (from) match.createdAt.$gte = new Date(from);
    if (to) match.createdAt.$lte = new Date(to);
  }

  return IncidentSnapshot.aggregate([
    { $match: match },
    { $group: { _id: '$incidentType', count: { $sum: 1 } } },
    { $project: { _id: 0, incidentType: '$_id', count: 1 } },
    { $sort: { count: -1 } },
  ]);
}

async function getTopResponders({ limit = 10 } = {}) {
  return IncidentSnapshot.aggregate([
    { $match: { assignedUnitType: { $exists: true } } },
    { $group: { _id: '$assignedUnitType', deployments: { $sum: 1 } } },
    { $project: { _id: 0, unitType: '$_id', deployments: 1 } },
    { $sort: { deployments: -1 } },
    { $limit: parseInt(limit) },
  ]);
}

async function getOverview() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalIncidents,
    openIncidents,
    resolvedToday,
    avgTime,
    byType,
  ] = await Promise.all([
    IncidentSnapshot.countDocuments(),
    IncidentSnapshot.countDocuments({ status: { $in: ['created', 'dispatched', 'in_progress'] } }),
    IncidentSnapshot.countDocuments({ status: 'resolved', resolvedAt: { $gte: today } }),
    IncidentSnapshot.aggregate([
      { $match: { responseTimeMinutes: { $exists: true, $ne: null } } },
      { $group: { _id: null, avg: { $avg: '$responseTimeMinutes' } } },
    ]),
    IncidentSnapshot.aggregate([
      { $group: { _id: '$incidentType', count: { $sum: 1 } } },
    ]),
  ]);

  const incidentsByType = byType.reduce((acc, b) => {
    acc[b._id] = b.count;
    return acc;
  }, {});

  return {
    totalIncidents,
    openIncidents,
    resolvedToday,
    avgResponseTimeMinutes: avgTime[0] ? parseFloat(avgTime[0].avg.toFixed(2)) : 0,
    incidentsByType,
  };
}

module.exports = { getResponseTimes, getIncidentsByRegion, getIncidentsByType, getTopResponders, getOverview };
