const dispatchService = require('../services/dispatch.service');

function handleError(res, err) {
  const status = err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = status === 500 ? 'An unexpected error occurred' : err.message;
  if (status === 500) console.error(err);
  return res.status(status).json({ success: false, error: { code, message } });
}

async function listDispatches(req, res) {
  try {
    const dispatches = await dispatchService.listDispatches();
    res.json({ success: true, data: { dispatches } });
  } catch (err) { handleError(res, err); }
}

async function getByIncident(req, res) {
  try {
    const dispatch = await dispatchService.getByIncident(req.params.incidentId);
    if (!dispatch) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Dispatch record not found' } });
    }
    res.json({ success: true, data: { dispatch } });
  } catch (err) { handleError(res, err); }
}

async function updateStatus(req, res) {
  try {
    const dispatch = await dispatchService.updateStatus(req.params.id, req.body.status);
    res.json({ success: true, data: { dispatch } });
  } catch (err) { handleError(res, err); }
}

module.exports = { listDispatches, getByIncident, updateStatus };
