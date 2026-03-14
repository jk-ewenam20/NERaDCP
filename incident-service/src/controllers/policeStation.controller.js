const policeStationService = require('../services/policeStation.service');

function handleError(res, err) {
  const status = err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = status === 500 ? 'An unexpected error occurred' : err.message;
  if (status === 500) console.error(err);
  return res.status(status).json({ success: false, error: { code, message } });
}

async function create(req, res) {
  try {
    const station = await policeStationService.create(req.body);
    res.status(201).json({ success: true, data: { station } });
  } catch (err) { handleError(res, err); }
}

async function list(req, res) {
  try {
    const stations = await policeStationService.list();
    res.json({ success: true, data: { stations } });
  } catch (err) { handleError(res, err); }
}

async function getById(req, res) {
  try {
    const station = await policeStationService.getById(req.params.id);
    res.json({ success: true, data: { station } });
  } catch (err) { handleError(res, err); }
}

async function update(req, res) {
  try {
    const station = await policeStationService.update(req.params.id, req.body);
    res.json({ success: true, data: { station } });
  } catch (err) { handleError(res, err); }
}

async function updateStatus(req, res) {
  try {
    const station = await policeStationService.updateStatus(req.params.id, req.body.status);
    res.json({ success: true, data: { station } });
  } catch (err) { handleError(res, err); }
}

async function addOfficer(req, res) {
  try {
    const officer = await policeStationService.addOfficer(req.params.id, req.body);
    res.status(201).json({ success: true, data: { officer } });
  } catch (err) { handleError(res, err); }
}

async function listOfficers(req, res) {
  try {
    const officers = await policeStationService.listOfficers(req.params.id);
    res.json({ success: true, data: { officers } });
  } catch (err) { handleError(res, err); }
}

module.exports = { create, list, getById, update, updateStatus, addOfficer, listOfficers };
