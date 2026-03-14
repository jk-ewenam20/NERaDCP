const vehicleService = require('../services/vehicle.service');

function handleError(res, err) {
  const status = err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = status === 500 ? 'An unexpected error occurred' : err.message;
  if (status === 500) console.error(err);
  return res.status(status).json({ success: false, error: { code, message } });
}

// Role → vehicleType filter. system_admin gets all vehicles.
const ROLE_VEHICLE_TYPE = {
  hospital_admin:   'ambulance',
  ambulance_driver: 'ambulance',
  police_admin:     'police_car',
  fire_admin:       'fire_truck',
};

async function listVehicles(req, res) {
  try {
    const filter = {};
    const vehicleType = ROLE_VEHICLE_TYPE[req.user.role];
    if (vehicleType) filter.vehicleType = vehicleType;
    const vehicles = await vehicleService.listVehicles(filter);
    res.json({ success: true, data: { vehicles } });
  } catch (err) { handleError(res, err); }
}

async function getLocation(req, res) {
  try {
    const position = await vehicleService.getLivePosition(req.params.id);
    if (!position) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Vehicle location not found' } });
    }
    res.json({ success: true, data: { position } });
  } catch (err) { handleError(res, err); }
}

async function pushLocation(req, res) {
  try {
    const { id } = req.params;
    // vehicleType can be passed in body or default to ambulance
    const vehicleType = req.body.vehicleType || 'ambulance';
    await vehicleService.pushLocation(id, vehicleType, req.body);
    res.json({ success: true, data: { received: true } });
  } catch (err) { handleError(res, err); }
}

module.exports = { listVehicles, getLocation, pushLocation };
