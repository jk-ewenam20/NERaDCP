const ambulanceService = require('../services/ambulance.service');

function handleError(res, err) {
  const status = err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = status === 500 ? 'An unexpected error occurred' : err.message;
  if (status === 500) console.error(err);
  return res.status(status).json({ success: false, error: { code, message } });
}

async function create(req, res) {
  try {
    const ambulance = await ambulanceService.create(req.body);
    res.status(201).json({ success: true, data: { ambulance } });
  } catch (err) { handleError(res, err); }
}

async function list(req, res) {
  try {
    const ambulances = await ambulanceService.list();
    res.json({ success: true, data: { ambulances } });
  } catch (err) { handleError(res, err); }
}

async function getById(req, res) {
  try {
    const ambulance = await ambulanceService.getById(req.params.id);
    res.json({ success: true, data: { ambulance } });
  } catch (err) { handleError(res, err); }
}

async function updateStatus(req, res) {
  try {
    const ambulance = await ambulanceService.updateStatus(req.params.id, req.body);
    res.json({ success: true, data: { ambulance } });
  } catch (err) { handleError(res, err); }
}

async function listAvailable(req, res) {
  try {
    const ambulances = await ambulanceService.listAvailable();
    res.json({ success: true, data: { ambulances } });
  } catch (err) { handleError(res, err); }
}

async function assignDriver(req, res) {
  try {
    // driverId: ObjectId string to assign, or null/empty to unassign
    const driverId = req.body.driverId || null;
    const ambulance = await ambulanceService.assignDriver(req.params.id, driverId);
    res.json({ success: true, data: { ambulance } });
  } catch (err) { handleError(res, err); }
}

module.exports = { create, list, getById, updateStatus, listAvailable, assignDriver };
