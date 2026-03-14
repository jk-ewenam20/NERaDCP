const Incident = require('../models/incident.model');
const responderService = require('./responder.service'); // local — no HTTP call needed
const mq = require('../config/rabbitmq');

const TYPE_MAP = {
  medical: 'medical',
  fire: 'fire',
  crime: 'crime',
  accident: 'medical',
  other: 'medical',
};

async function createIncident(data, userId) {
  const { citizenName, citizenPhone, incidentType, latitude, longitude, address, notes } = data;

  // 1. Save incident as "created"
  const incident = await Incident.create({
    citizenName,
    citizenPhone,
    incidentType,
    location: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
    address,
    notes,
    createdBy: userId,
    statusHistory: [{ status: 'created', changedBy: userId }],
  });

  // 2. Find nearest responder (direct local service call — no HTTP)
  let responder;
  try {
    responder = await responderService.findNearest({
      lat: latitude,
      lng: longitude,
      type: TYPE_MAP[incidentType] || 'medical',
    });
  } catch (err) {
    console.warn('Auto-dispatch failed — no responder available:', err.message);
    return incident;
  }

  // 3. Update incident to "dispatched"
  const now = new Date();
  incident.assignedUnit = {
    unitId: responder.unitId,
    unitType: responder.unitType,
    unitName: responder.unitName,
    hospitalId: responder.hospitalId || null,
    hospitalName: responder.hospitalName || null,
  };
  incident.status = 'dispatched';
  incident.dispatchedAt = now;
  incident.statusHistory.push({ status: 'dispatched', changedAt: now, changedBy: userId });
  await incident.save();

  // 4. Publish events to RabbitMQ (async)
  mq.publish('incident.events', 'incident.created', {
    eventType: 'incident.created',
    timestamp: incident.createdAt.toISOString(),
    payload: {
      incidentId: incident._id,
      incidentType: incident.incidentType,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      address,
      region: 'Ghana',
      createdBy: userId,
      createdAt: incident.createdAt.toISOString(),
    },
  });

  mq.publish('incident.events', 'incident.dispatched', {
    eventType: 'incident.dispatched',
    timestamp: now.toISOString(),
    payload: {
      incidentId: incident._id,
      incidentType: incident.incidentType,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      assignedUnit: {
        unitId: responder.unitId,
        unitType: responder.unitType,
        unitName: responder.unitName,
        hospitalId: responder.hospitalId || null,
        driverId: null,
      },
      dispatchedAt: now.toISOString(),
    },
  });

  return incident;
}

async function listIncidents({ page = 1, limit = 20, status, incidentType, user } = {}) {
  const filter = {};
  if (status) filter.status = status;
  if (incidentType) filter.incidentType = incidentType;

  // Filter by user organization if not system_admin
  if (user && user.role !== 'system_admin') {
    // Admins see incidents they created
    filter.createdBy = user.userId;
  }

  const skip = (page - 1) * limit;
  const [incidents, total] = await Promise.all([
    Incident.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Incident.countDocuments(filter),
  ]);
  return { incidents, total, page, totalPages: Math.ceil(total / limit) };
}

async function listOpen(user) {
  const filter = { status: { $in: ['created', 'dispatched', 'in_progress'] } };

  // Filter by user organization if not system_admin
  if (user && user.role !== 'system_admin') {
    filter.createdBy = user.userId;
  }

  return Incident.find(filter).sort({ createdAt: -1 });
}

async function getById(id) {
  const incident = await Incident.findById(id);
  if (!incident) {
    const err = new Error('Incident not found');
    err.status = 404; err.code = 'NOT_FOUND'; throw err;
  }
  return incident;
}

async function updateStatus(id, newStatus, userId) {
  const incident = await getById(id);
  const previousStatus = incident.status;
  const now = new Date();

  incident.status = newStatus;
  incident.statusHistory.push({ status: newStatus, changedAt: now, changedBy: userId });

  if (newStatus === 'resolved') {
    incident.resolvedAt = now;
    if (incident.dispatchedAt) {
      incident.responseTimeMinutes = parseFloat(
        ((now - incident.dispatchedAt) / 60000).toFixed(2)
      );
    }
  }

  await incident.save();

  mq.publish('incident.events', 'incident.status_changed', {
    eventType: 'incident.status_changed',
    timestamp: now.toISOString(),
    payload: {
      incidentId: incident._id,
      previousStatus,
      newStatus,
      changedBy: userId,
      changedAt: now.toISOString(),
    },
  });

  if (newStatus === 'resolved') {
    mq.publish('incident.events', 'incident.resolved', {
      eventType: 'incident.resolved',
      timestamp: now.toISOString(),
      payload: {
        incidentId: incident._id,
        incidentType: incident.incidentType,
        region: 'Ghana',
        createdAt: incident.createdAt.toISOString(),
        dispatchedAt: incident.dispatchedAt ? incident.dispatchedAt.toISOString() : null,
        resolvedAt: now.toISOString(),
        responseTimeMinutes: incident.responseTimeMinutes,
        assignedUnitType: incident.assignedUnit ? incident.assignedUnit.unitType : null,
      },
    });
  }

  return incident;
}

async function reassign(id, { unitId, unitType }, userId) {
  const incident = await getById(id);
  incident.assignedUnit = { ...incident.assignedUnit, unitId, unitType };
  incident.statusHistory.push({ status: 'dispatched', changedAt: new Date(), changedBy: userId });
  await incident.save();
  return incident;
}

async function getStats() {
  const stats = await Incident.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  return stats.reduce((acc, s) => { acc[s._id] = s.count; return acc; }, {});
}

module.exports = { createIncident, listIncidents, listOpen, getById, updateStatus, reassign, getStats };
