const mq = require('../config/rabbitmq');
const dispatchService = require('../services/dispatch.service');

async function handleIncidentDispatched(message) {
  const { payload } = message;
  const { incidentId, assignedUnit, dispatchedAt } = payload;

  if (!assignedUnit || !assignedUnit.unitId) {
    console.warn('incident.dispatched: no assigned unit, skipping dispatch record creation');
    return;
  }

  // Map unitType to vehicleType enum
  const vehicleTypeMap = {
    ambulance: 'ambulance',
    police_station: 'police_vehicle',
    fire_station: 'fire_truck',
  };

  await dispatchService.createDispatch({
    incidentId,
    vehicleId: assignedUnit.unitId,
    vehicleType: vehicleTypeMap[assignedUnit.unitType] || 'ambulance',
    driverId: assignedUnit.driverId || null,
    dispatchedAt,
  });

  console.log(`Dispatch record created for incident ${incidentId}`);
}

async function startConsumers() {
  await mq.consume(
    'incident.events',
    'incident.dispatched',
    'tracking.incident.dispatched',
    handleIncidentDispatched
  );
  console.log('Tracking Service: incident.dispatched consumer started');
}

module.exports = { startConsumers };
