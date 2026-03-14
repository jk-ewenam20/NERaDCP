const Hospital = require('../models/hospital.model');

function notFound() {
  const err = new Error('Hospital not found');
  err.status = 404;
  err.code = 'NOT_FOUND';
  return err;
}

async function create({ name, address, longitude, latitude, totalBeds, availableBeds, contactPhone, contactEmail }) {
  return Hospital.create({
    name, address,
    location: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
    totalBeds, availableBeds, contactPhone, contactEmail,
  });
}

async function list() {
  return Hospital.find().sort({ name: 1 });
}

async function getById(id) {
  const h = await Hospital.findById(id);
  if (!h) throw notFound();
  return h;
}

async function update(id, fields) {
  const allowed = ['name', 'address', 'contactPhone', 'contactEmail', 'status', 'totalBeds'];
  const patch = {};
  for (const key of allowed) {
    if (fields[key] !== undefined) patch[key] = fields[key];
  }
  if (fields.longitude !== undefined && fields.latitude !== undefined) {
    patch.location = { type: 'Point', coordinates: [parseFloat(fields.longitude), parseFloat(fields.latitude)] };
  }
  const h = await Hospital.findByIdAndUpdate(id, patch, { new: true, runValidators: true });
  if (!h) throw notFound();
  return h;
}

async function updateCapacity(id, availableBeds) {
  const h = await Hospital.findById(id);
  if (!h) throw notFound();
  h.availableBeds = availableBeds;
  if (availableBeds === 0) h.status = 'full';
  else if (h.status === 'full') h.status = 'active';
  await h.save();
  return h;
}

async function remove(id) {
  const h = await Hospital.findByIdAndDelete(id);
  if (!h) throw notFound();
}

module.exports = { create, list, getById, update, updateCapacity, remove };
