const Ambulance = require('../models/ambulance.model');

function notFound() {
  const err = new Error('Ambulance not found');
  err.status = 404;
  err.code = 'NOT_FOUND';
  return err;
}

async function create({ vehicleNumber, hospitalId, driverId, longitude, latitude }) {
  const doc = { vehicleNumber, hospitalId, driverId: driverId || null };
  if (longitude !== undefined && latitude !== undefined) {
    doc.currentLocation = { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] };
  }
  return Ambulance.create(doc);
}

async function list() {
  return Ambulance.find().sort({ vehicleNumber: 1 });
}

async function getById(id) {
  const a = await Ambulance.findById(id);
  if (!a) throw notFound();
  return a;
}

async function updateStatus(id, { status, longitude, latitude }) {
  const patch = { status };
  if (longitude !== undefined && latitude !== undefined) {
    patch.currentLocation = { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] };
  }
  const a = await Ambulance.findByIdAndUpdate(id, patch, { new: true, runValidators: true });
  if (!a) throw notFound();
  return a;
}

async function listAvailable() {
  return Ambulance.find({ status: 'available' }).sort({ vehicleNumber: 1 });
}

async function assignDriver(ambulanceId, driverId) {
  // If reassigning, clear this driver from any other ambulance first
  if (driverId) {
    await Ambulance.updateMany(
      { driverId, _id: { $ne: ambulanceId } },
      { driverId: null },
    );
  }
  const a = await Ambulance.findByIdAndUpdate(
    ambulanceId,
    { driverId: driverId || null },
    { new: true, runValidators: true },
  );
  if (!a) throw notFound();
  return a;
}

module.exports = { create, list, getById, updateStatus, listAvailable, assignDriver };
