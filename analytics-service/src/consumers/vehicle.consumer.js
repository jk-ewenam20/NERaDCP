const mq = require('../config/rabbitmq');

// Analytics Service does not persist raw location pings (high volume).
// Extend this handler if you want to compute vehicle utilization metrics.
async function handleVehicleLocationUpdated(message) {
  // Intentionally lightweight — location pings are high-frequency.
  // Future: aggregate into per-vehicle daily mileage or active-duty time.
  const { payload } = message;
  // eslint-disable-next-line no-unused-vars
  const { vehicleId, vehicleType, incidentId, latitude, longitude, recordedAt } = payload;
  // No-op for now; extend when vehicle utilization analytics are needed.
}

async function startConsumers() {
  await mq.consume(
    'tracking.events',
    'vehicle.location_updated',
    'analytics.vehicle.location',
    handleVehicleLocationUpdated
  );
  console.log('Analytics Service: vehicle.location_updated consumer started');
}

module.exports = { startConsumers };
