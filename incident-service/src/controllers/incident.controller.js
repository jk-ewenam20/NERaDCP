const incidentService = require('../services/incident.service');

function handleError(res, err) {
  const status = err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = status === 500 ? 'An unexpected error occurred' : err.message;
  if (status === 500) console.error(err);
  return res.status(status).json({ success: false, error: { code, message } });
}

// Non-admin roles may only create incidents of their own type.
const ROLE_FORCED_TYPE = {
  hospital_admin: 'medical',
  ambulance_driver: 'medical',
  police_admin: 'crime',
  fire_admin: 'fire',
};

async function create(req, res) {
  try {
    const body = { ...req.body };
    const forcedType = ROLE_FORCED_TYPE[req.user.role];
    if (forcedType) body.incidentType = forcedType;
    const incident = await incidentService.createIncident(body, req.user.userId);
    res.status(201).json({ success: true, data: { incident } });
  } catch (err) { handleError(res, err); }
}

async function list(req, res) {
  try {
    const { page, limit, status, incidentType } = req.query;
    const result = await incidentService.listIncidents({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      status,
      incidentType,
      user: req.user,
    });
    res.json({ success: true, data: result });
  } catch (err) { handleError(res, err); }
}

async function listOpen(req, res) {
  try {
    const incidents = await incidentService.listOpen(req.user);
    res.json({ success: true, data: { incidents } });
  } catch (err) { handleError(res, err); }
}

async function getById(req, res) {
  try {
    const incident = await incidentService.getById(req.params.id);
    res.json({ success: true, data: { incident } });
  } catch (err) { handleError(res, err); }
}

async function updateStatus(req, res) {
  try {
    const incident = await incidentService.updateStatus(req.params.id, req.body.status, req.user.userId);
    res.json({ success: true, data: { incident } });
  } catch (err) { handleError(res, err); }
}

async function reassign(req, res) {
  try {
    const incident = await incidentService.reassign(req.params.id, req.body, req.user.userId);
    res.json({ success: true, data: { incident } });
  } catch (err) { handleError(res, err); }
}

async function getStats(req, res) {
  try {
    const stats = await incidentService.getStats();
    res.json({ success: true, data: { stats } });
  } catch (err) { handleError(res, err); }
}

module.exports = { create, list, listOpen, getById, updateStatus, reassign, getStats };
