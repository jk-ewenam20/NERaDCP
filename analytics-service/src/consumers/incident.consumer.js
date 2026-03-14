const mq = require('../config/rabbitmq');
const IncidentSnapshot = require('../models/incidentSnapshot.model');

async function handleIncidentCreated(message) {
  const { payload } = message;
  await IncidentSnapshot.findOneAndUpdate(
    { incidentId: payload.incidentId },
    {
      incidentId: payload.incidentId,
      incidentType: payload.incidentType,
      region: payload.region || 'Unknown',
      latitude: payload.latitude,
      longitude: payload.longitude,
      status: 'created',
      createdAt: new Date(payload.createdAt),
    },
    { upsert: true, new: true }
  );
}

async function handleIncidentDispatched(message) {
  const { payload } = message;
  await IncidentSnapshot.findOneAndUpdate(
    { incidentId: payload.incidentId },
    {
      $set: {
        status: 'dispatched',
        assignedUnitType: payload.assignedUnit ? payload.assignedUnit.unitType : null,
        dispatchedAt: payload.dispatchedAt ? new Date(payload.dispatchedAt) : new Date(),
      },
    }
  );
}

async function handleIncidentResolved(message) {
  const { payload } = message;
  await IncidentSnapshot.findOneAndUpdate(
    { incidentId: payload.incidentId },
    {
      $set: {
        status: 'resolved',
        resolvedAt: payload.resolvedAt ? new Date(payload.resolvedAt) : new Date(),
        responseTimeMinutes: payload.responseTimeMinutes,
        assignedUnitType: payload.assignedUnitType,
      },
    }
  );
}

async function handleIncidentStatusChanged(message) {
  const { payload } = message;
  if (!['resolved', 'cancelled'].includes(payload.newStatus)) {
    await IncidentSnapshot.findOneAndUpdate(
      { incidentId: payload.incidentId },
      { $set: { status: payload.newStatus } }
    );
  }
}

async function startConsumers() {
  await mq.consume('incident.events', 'incident.created', 'analytics.incident.created', handleIncidentCreated);
  await mq.consume('incident.events', 'incident.dispatched', 'analytics.incident.dispatched', handleIncidentDispatched);
  await mq.consume('incident.events', 'incident.resolved', 'analytics.incident.resolved', handleIncidentResolved);
  await mq.consume('incident.events', 'incident.status_changed', 'analytics.incident.status', handleIncidentStatusChanged);
  console.log('Analytics Service: incident consumers started');
}

module.exports = { startConsumers };
