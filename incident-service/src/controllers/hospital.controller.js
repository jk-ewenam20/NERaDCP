const hospitalService = require('../services/hospital.service');

function handleError(res, err) {
  const status = err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = status === 500 ? 'An unexpected error occurred' : err.message;
  if (status === 500) console.error(err);
  return res.status(status).json({ success: false, error: { code, message } });
}

async function create(req, res) {
  try {
    const hospital = await hospitalService.create(req.body);
    res.status(201).json({ success: true, data: { hospital } });
  } catch (err) { handleError(res, err); }
}

async function list(req, res) {
  try {
    const hospitals = await hospitalService.list();
    res.json({ success: true, data: { hospitals } });
  } catch (err) { handleError(res, err); }
}

async function getById(req, res) {
  try {
    const hospital = await hospitalService.getById(req.params.id);
    res.json({ success: true, data: { hospital } });
  } catch (err) { handleError(res, err); }
}

async function update(req, res) {
  try {
    const hospital = await hospitalService.update(req.params.id, req.body);
    res.json({ success: true, data: { hospital } });
  } catch (err) { handleError(res, err); }
}

async function updateCapacity(req, res) {
  try {
    // Hospital admins can only update their own hospital
    if (req.user.role === 'hospital_admin' && req.user.organizationId !== req.params.id) {
      const err = new Error('You can only update your own hospital');
      err.status = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }
    const hospital = await hospitalService.updateCapacity(req.params.id, req.body.availableBeds);
    res.json({ success: true, data: { hospital } });
  } catch (err) { handleError(res, err); }
}

async function remove(req, res) {
  try {
    await hospitalService.remove(req.params.id);
    res.json({ success: true, data: { message: 'Hospital deleted' } });
  } catch (err) { handleError(res, err); }
}

module.exports = { create, list, getById, update, updateCapacity, remove };
