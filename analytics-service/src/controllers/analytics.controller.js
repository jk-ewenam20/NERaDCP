const analyticsService = require('../services/analytics.service');

function handleError(res, err) {
  const status = err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = status === 500 ? 'An unexpected error occurred' : err.message;
  if (status === 500) console.error(err);
  return res.status(status).json({ success: false, error: { code, message } });
}

async function getResponseTimes(req, res) {
  try {
    const periods = await analyticsService.getResponseTimes(req.query);
    res.json({ success: true, data: { periods } });
  } catch (err) { handleError(res, err); }
}

async function getIncidentsByRegion(req, res) {
  try {
    const regions = await analyticsService.getIncidentsByRegion(req.query);
    res.json({ success: true, data: { regions } });
  } catch (err) { handleError(res, err); }
}

async function getIncidentsByType(req, res) {
  try {
    const types = await analyticsService.getIncidentsByType(req.query);
    res.json({ success: true, data: { types } });
  } catch (err) { handleError(res, err); }
}

async function getResourceUtilization(req, res) {
  try {
    // Resource utilization requires live data from Responder Service.
    // For now, return a stub — extend by calling Responder Service HTTP API.
    res.json({
      success: true,
      data: {
        note: 'Resource utilization aggregates hospital capacity logs. Populated as events arrive.',
        hospitals: [],
        policeStations: [],
        fireStations: [],
      },
    });
  } catch (err) { handleError(res, err); }
}

async function getTopResponders(req, res) {
  try {
    const responders = await analyticsService.getTopResponders(req.query);
    res.json({ success: true, data: { responders } });
  } catch (err) { handleError(res, err); }
}

async function getOverview(req, res) {
  try {
    const overview = await analyticsService.getOverview();
    res.json({ success: true, data: overview });
  } catch (err) { handleError(res, err); }
}

module.exports = {
  getResponseTimes,
  getIncidentsByRegion,
  getIncidentsByType,
  getResourceUtilization,
  getTopResponders,
  getOverview,
};
