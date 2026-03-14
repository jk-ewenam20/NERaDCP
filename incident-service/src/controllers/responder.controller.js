const responderService = require('../services/responder.service');

function handleError(res, err) {
  const status = err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = status === 500 ? 'An unexpected error occurred' : err.message;
  if (status === 500) console.error(err);
  return res.status(status).json({ success: false, error: { code, message } });
}

async function findNearest(req, res) {
  try {
    const { lat, lng, type, maxDistance } = req.query;
    const responder = await responderService.findNearest({ lat, lng, type, maxDistance });
    res.json({ success: true, data: { responder } });
  } catch (err) { handleError(res, err); }
}

module.exports = { findNearest };
