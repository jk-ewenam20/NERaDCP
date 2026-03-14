const router = require('express').Router();
const ctrl = require('../controllers/ambulance.controller');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/role');

/**
 * @openapi
 * /api/v1/ambulances/available:
 *   get:
 *     summary: List all available ambulances
 *     tags: [Ambulances]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Available ambulances
 */
// Must be before /:id
router.get('/available', authenticate, ctrl.listAvailable);

/**
 * @openapi
 * /api/v1/ambulances:
 *   post:
 *     summary: Register a new ambulance
 *     tags: [Ambulances]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [vehicleNumber, hospitalId]
 *             properties:
 *               vehicleNumber: { type: string, example: AMB-001 }
 *               hospitalId: { type: string, example: 64abc123def456 }
 *               driverId: { type: string }
 *               longitude: { type: number, example: -0.2209 }
 *               latitude: { type: number, example: 5.5369 }
 *     responses:
 *       201:
 *         description: Ambulance registered
 *   get:
 *     summary: List all ambulances
 *     tags: [Ambulances]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of ambulances
 */
router.post('/', authenticate, authorize('system_admin', 'hospital_admin'), ctrl.create);
router.get('/', authenticate, ctrl.list);

/**
 * @openapi
 * /api/v1/ambulances/{id}:
 *   get:
 *     summary: Get ambulance by ID
 *     tags: [Ambulances]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Ambulance details
 *       404:
 *         description: Ambulance not found
 */
router.get('/:id', authenticate, ctrl.getById);

/**
 * @openapi
 * /api/v1/ambulances/{id}/status:
 *   put:
 *     summary: Update ambulance status and location
 *     tags: [Ambulances]
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
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [available, dispatched, out_of_service] }
 *               longitude: { type: number }
 *               latitude: { type: number }
 *     responses:
 *       200:
 *         description: Status updated
 *       404:
 *         description: Ambulance not found
 */
router.put('/:id/status', authenticate, authorize('system_admin', 'hospital_admin', 'ambulance_driver'), ctrl.updateStatus);
router.put('/:id/driver', authenticate, authorize('system_admin', 'hospital_admin'), ctrl.assignDriver);

module.exports = router;
