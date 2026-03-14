const PoliceStation = require('../models/policeStation.model');
const PoliceOfficer = require('../models/policeOfficer.model');

function notFound() {
  const err = new Error('Police station not found');
  err.status = 404;
  err.code = 'NOT_FOUND';
  return err;
}

async function create({ name, address, region, longitude, latitude, contactPhone }) {
  return PoliceStation.create({
    name, address, region, contactPhone,
    location: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
  });
}

async function list() {
  return PoliceStation.find().sort({ name: 1 });
}

async function getById(id) {
  const s = await PoliceStation.findById(id);
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
  const s = await PoliceStation.findByIdAndUpdate(id, patch, { new: true, runValidators: true });
  if (!s) throw notFound();
  return s;
}

async function updateStatus(id, status) {
  const s = await PoliceStation.findByIdAndUpdate(id, { status }, { new: true });
  if (!s) throw notFound();
  return s;
}

async function addOfficer(stationId, { userId, badgeNumber, rank }) {
  await getById(stationId);
  return PoliceOfficer.create({ userId, stationId, badgeNumber, rank });
}

async function listOfficers(stationId) {
  return PoliceOfficer.find({ stationId }).sort({ badgeNumber: 1 });
}

module.exports = { create, list, getById, update, updateStatus, addOfficer, listOfficers };
