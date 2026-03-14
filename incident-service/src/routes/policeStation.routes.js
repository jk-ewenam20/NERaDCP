const router = require('express').Router();
const ctrl = require('../controllers/policeStation.controller');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/role');

/**
 * @openapi
 * /api/v1/police-stations:
 *   post:
 *     summary: Register a new police station
 *     tags: [Police Stations]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, address, region, longitude, latitude]
 *             properties:
 *               name: { type: string, example: Accra Central Police Station }
 *               address: { type: string, example: Ring Road, Accra }
 *               region: { type: string, example: Greater Accra }
 *               longitude: { type: number, example: -0.1870 }
 *               latitude: { type: number, example: 5.6037 }
 *               contactPhone: { type: string, example: "+233302123456" }
 *     responses:
 *       201:
 *         description: Police station created
 *   get:
 *     summary: List all police stations
 *     tags: [Police Stations]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of police stations
 */
router.post('/', authenticate, authorize('system_admin'), ctrl.create);
router.get('/', authenticate, ctrl.list);

/**
 * @openapi
 * /api/v1/police-stations/{id}:
 *   get:
 *     summary: Get police station by ID
 *     tags: [Police Stations]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Police station details
 *       404:
 *         description: Not found
 *   put:
 *     summary: Update police station info
 *     tags: [Police Stations]
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
 *             properties:
 *               name: { type: string }
 *               address: { type: string }
 *               region: { type: string }
 *               contactPhone: { type: string }
 *               longitude: { type: number }
 *               latitude: { type: number }
 *     responses:
 *       200:
 *         description: Station updated
 */
router.get('/:id', authenticate, ctrl.getById);
router.put('/:id', authenticate, authorize('system_admin', 'police_admin'), ctrl.update);

/**
 * @openapi
 * /api/v1/police-stations/{id}/status:
 *   put:
 *     summary: Update station availability
 *     tags: [Police Stations]
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
 *               status: { type: string, enum: [active, inactive] }
 *     responses:
 *       200:
 *         description: Status updated
 */
router.put('/:id/status', authenticate, authorize('police_admin'), ctrl.updateStatus);

/**
 * @openapi
 * /api/v1/police-stations/{id}/officers:
 *   post:
 *     summary: Add officer to station
 *     tags: [Police Stations]
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
 *             required: [userId, badgeNumber, rank]
 *             properties:
 *               userId: { type: string }
 *               badgeNumber: { type: string, example: GPS-001 }
 *               rank: { type: string, example: Inspector }
 *     responses:
 *       201:
 *         description: Officer added
 *   get:
 *     summary: List officers at station
 *     tags: [Police Stations]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Officer list
 */
router.post('/:id/officers', authenticate, authorize('police_admin'), ctrl.addOfficer);
router.get('/:id/officers', authenticate, authorize('system_admin', 'police_admin'), ctrl.listOfficers);

module.exports = router;
