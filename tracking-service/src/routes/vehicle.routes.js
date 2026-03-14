const router = require('express').Router();
const ctrl = require('../controllers/vehicle.controller');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/role');

/**
 * @openapi
 * /api/v1/vehicles:
 *   get:
 *     summary: List all tracked vehicles (live positions)
 *     tags: [Vehicles]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of vehicles with live positions
 */
router.get('/', authenticate, ctrl.listVehicles);

/**
 * @openapi
 * /api/v1/vehicles/{id}/location:
 *   get:
 *     summary: Get current location of a vehicle
 *     tags: [Vehicles]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Live position
 *   post:
 *     summary: Push a GPS location update (called by driver app)
 *     tags: [Vehicles]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [latitude, longitude]
 *             properties:
 *               latitude: { type: number }
 *               longitude: { type: number }
 *               speed: { type: number }
 *               heading: { type: number }
 *               incidentId: { type: string }
 *               vehicleType: { type: string }
 *     responses:
 *       200:
 *         description: Location received
 */
router.get('/:id/location', authenticate, ctrl.getLocation);
router.post('/:id/location', authenticate, authorize('ambulance_driver', 'system_admin', 'hospital_admin', 'police_admin', 'fire_admin'), ctrl.pushLocation);

module.exports = router;
