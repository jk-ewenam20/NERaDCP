const DispatchRecord = require('../models/dispatchRecord.model');
const mq = require('../config/rabbitmq');

let _io = null;
function setIo(io) { _io = io; }

async function createDispatch({ incidentId, vehicleId, vehicleType, driverId, dispatchedAt }) {
  return DispatchRecord.create({
    incidentId,
    vehicleId,
    vehicleType,
    driverId: driverId || null,
    dispatchedAt: dispatchedAt ? new Date(dispatchedAt) : new Date(),
    status: 'en_route',
  });
}

async function listDispatches() {
  return DispatchRecord.find().sort({ dispatchedAt: -1 });
}

async function getByIncident(incidentId) {
  return DispatchRecord.findOne({ incidentId }).sort({ dispatchedAt: -1 });
}

async function updateStatus(id, newStatus) {
  const record = await DispatchRecord.findById(id);
  if (!record) {
    const err = new Error('Dispatch record not found');
    err.status = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  record.status = newStatus;
  const now = new Date();

  if (newStatus === 'arrived') {
    record.arrivedAt = now;

    // Emit arrival event via Socket.io
    if (_io) {
      _io.to(`incident:${record.incidentId}`).emit('vehicle:arrived', {
        vehicleId: record.vehicleId,
        incidentId: record.incidentId,
        arrivedAt: now,
      });
    }

    // Publish vehicle.arrived to RabbitMQ (consumed by Incident Service)
    mq.publish('tracking.events', 'vehicle.arrived', {
      eventType: 'vehicle.arrived',
      timestamp: now.toISOString(),
      payload: {
        vehicleId: record.vehicleId,
        vehicleType: record.vehicleType,
        incidentId: record.incidentId,
        arrivedAt: now.toISOString(),
      },
    });
  }

  if (newStatus === 'completed') {
    record.completedAt = now;
  }

  if (newStatus === 'cancelled') {
    record.completedAt = now;
  }

  await record.save();

  // Emit dispatch status change via Socket.io
  if (_io) {
    _io.to(`incident:${record.incidentId}`).emit('dispatch:status_changed', {
      incidentId: record.incidentId,
      status: newStatus,
      timestamp: now,
    });
  }

  return record;
}

module.exports = { setIo, createDispatch, listDispatches, getByIncident, updateStatus };
