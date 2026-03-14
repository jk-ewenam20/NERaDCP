const FireStation = require('../models/fireStation.model');
const FirePersonnel = require('../models/firePersonnel.model');

function notFound() {
  const err = new Error('Fire station not found');
  err.status = 404;
  err.code = 'NOT_FOUND';
  return err;
}

async function create({ name, address, region, longitude, latitude, contactPhone }) {
  return FireStation.create({
    name, address, region, contactPhone,
    location: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
  });
}

async function list() {
  return FireStation.find().sort({ name: 1 });
}

async function getById(id) {
  const s = await FireStation.findById(id);
  if (!s) throw notFound();
  return s;
}

async function update(id, fields) {
  const allowed = ['name', 'address', 'region', 'contactPhone'];
  const patch = {};
  for (const key of allowed) {
    if (fields[key] !== undefined) patch[key] = fields[key];
  }
  if (fields.longitude !== undefined && fields.latitude !== undefined) {
    patch.location = { type: 'Point', coordinates: [parseFloat(fields.longitude), parseFloat(fields.latitude)] };
  }
  const s = await FireStation.findByIdAndUpdate(id, patch, { new: true, runValidators: true });
  if (!s) throw notFound();
  return s;
}

async function updateStatus(id, status) {
  const s = await FireStation.findByIdAndUpdate(id, { status }, { new: true });
  if (!s) throw notFound();
  return s;
}

async function addPersonnel(stationId, { userId, badgeNumber, rank }) {
  await getById(stationId);
  return FirePersonnel.create({ userId, stationId, badgeNumber, rank });
}

async function listPersonnel(stationId) {
  return FirePersonnel.find({ stationId }).sort({ badgeNumber: 1 });
}

module.exports = { create, list, getById, update, updateStatus, addPersonnel, listPersonnel };
