const fireStationService = require('../services/fireStation.service');

function handleError(res, err) {
  const status = err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = status === 500 ? 'An unexpected error occurred' : err.message;
  if (status === 500) console.error(err);
  return res.status(status).json({ success: false, error: { code, message } });
}

async function create(req, res) {
  try {
    const station = await fireStationService.create(req.body);
    res.status(201).json({ success: true, data: { station } });
  } catch (err) { handleError(res, err); }
}

async function list(req, res) {
  try {
    const stations = await fireStationService.list();
    res.json({ success: true, data: { stations } });
  } catch (err) { handleError(res, err); }
}

async function getById(req, res) {
  try {
    const station = await fireStationService.getById(req.params.id);
    res.json({ success: true, data: { station } });
  } catch (err) { handleError(res, err); }
}

async function update(req, res) {
  try {
    const station = await fireStationService.update(req.params.id, req.body);
    res.json({ success: true, data: { station } });
  } catch (err) { handleError(res, err); }
}

async function updateStatus(req, res) {
  try {
    const station = await fireStationService.updateStatus(req.params.id, req.body.status);
    res.json({ success: true, data: { station } });
  } catch (err) { handleError(res, err); }
}

async function addPersonnel(req, res) {
  try {
    const personnel = await fireStationService.addPersonnel(req.params.id, req.body);
    res.status(201).json({ success: true, data: { personnel } });
  } catch (err) { handleError(res, err); }
}

async function listPersonnel(req, res) {
  try {
    const personnel = await fireStationService.listPersonnel(req.params.id);
    res.json({ success: true, data: { personnel } });
  } catch (err) { handleError(res, err); }
}

module.exports = { create, list, getById, update, updateStatus, addPersonnel, listPersonnel };
