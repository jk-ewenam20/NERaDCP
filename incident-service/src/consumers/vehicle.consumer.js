const mq = require('../config/rabbitmq');
const Incident = require('../models/incident.model');

async function handleVehicleArrived(message) {
  const { payload } = message;
  const { incidentId, arrivedAt } = payload;

  const incident = await Incident.findById(incidentId);
  if (!incident) {
    console.warn(`vehicle.arrived: incident ${incidentId} not found`);
    return;
  }

  if (incident.status !== 'dispatched') return; // already updated

  const now = new Date(arrivedAt || Date.now());
  incident.status = 'in_progress';
  incident.statusHistory.push({ status: 'in_progress', changedAt: now });
  await incident.save();

  console.log(`Incident ${incidentId} auto-updated to in_progress (vehicle arrived)`);

  // Publish status changed
  mq.publish('incident.events', 'incident.status_changed', {
    eventType: 'incident.status_changed',
    timestamp: now.toISOString(),
    payload: {
      incidentId,
      previousStatus: 'dispatched',
      newStatus: 'in_progress',
      changedBy: null,
      changedAt: now.toISOString(),
    },
  });
}

async function startConsumers() {
  await mq.consume(
    'tracking.events',
    'vehicle.arrived',
    'incident.vehicle.arrived',
    handleVehicleArrived
  );
  console.log('Incident Service: vehicle.arrived consumer started');
}

module.exports = { startConsumers };
