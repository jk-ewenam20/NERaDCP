const VehicleLocation = require('../models/vehicleLocation.model');
const LivePosition = require('../models/livePosition.model');
const mq = require('../config/rabbitmq');

// Called by getIo() from app.js — injected after socket.io is initialized
let _io = null;
function setIo(io) { _io = io; }

async function pushLocation(vehicleId, vehicleType, { latitude, longitude, speed, heading, incidentId }) {
  const coordinates = [parseFloat(longitude), parseFloat(latitude)];
  const now = new Date();

  // 1. Append to location history
  await VehicleLocation.create({
    vehicleId,
    vehicleType,
    incidentId: incidentId || null,
    location: { type: 'Point', coordinates },
    speed,
    heading,
    recordedAt: now,
  });

  // 2. Upsert live position (single doc per vehicle)
  await LivePosition.findOneAndUpdate(
    { vehicleId },
    {
      vehicleId,
      vehicleType,
      incidentId: incidentId || null,
      location: { type: 'Point', coordinates },
      speed,
      heading,
      lastUpdated: now,
    },
    { upsert: true, new: true }
  );

  // 3. Emit via Socket.io to subscribed clients
  if (_io) {
    const payload = { vehicleId, incidentId, lat: latitude, lng: longitude, speed, heading, timestamp: now };
    _io.to('all').emit('vehicle:location', payload);
    if (incidentId) {
      _io.to(`incident:${incidentId}`).emit('vehicle:location', payload);
    }
  }

  // 4. Publish to RabbitMQ for Analytics
  mq.publish('tracking.events', 'vehicle.location_updated', {
    eventType: 'vehicle.location_updated',
    timestamp: now.toISOString(),
    payload: {
      vehicleId,
      vehicleType,
      incidentId: incidentId || null,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      speed,
      recordedAt: now.toISOString(),
    },
  });
}

async function getLivePosition(vehicleId) {
  return LivePosition.findOne({ vehicleId });
}

async function listVehicles(filter = {}) {
  return LivePosition.find(filter).sort({ lastUpdated: -1 });
}

module.exports = { setIo, pushLocation, getLivePosition, listVehicles };
