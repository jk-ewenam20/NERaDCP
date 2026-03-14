const router = require('express').Router();
const ctrl = require('../controllers/fireStation.controller');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/role');

/**
 * @openapi
 * /api/v1/fire-stations:
 *   post:
 *     summary: Register a new fire station
 *     tags: [Fire Stations]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, address, region, longitude, latitude]
 *             properties:
 *               name: { type: string, example: Accra Fire Station }
 *               address: { type: string, example: Liberation Road, Accra }
 *               region: { type: string, example: Greater Accra }
 *               longitude: { type: number, example: -0.1969 }
 *               latitude: { type: number, example: 5.5913 }
 *               contactPhone: { type: string, example: "+233302789012" }
 *     responses:
 *       201:
 *         description: Fire station created
 *   get:
 *     summary: List all fire stations
 *     tags: [Fire Stations]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of fire stations
 */
router.post('/', authenticate, authorize('system_admin'), ctrl.create);
router.get('/', authenticate, ctrl.list);

/**
 * @openapi
 * /api/v1/fire-stations/{id}:
 *   get:
 *     summary: Get fire station by ID
 *     tags: [Fire Stations]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Fire station details
 *       404:
 *         description: Not found
 *   put:
 *     summary: Update fire station info
 *     tags: [Fire Stations]
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
router.put('/:id', authenticate, authorize('system_admin', 'fire_admin'), ctrl.update);

/**
 * @openapi
 * /api/v1/fire-stations/{id}/status:
 *   put:
 *     summary: Update station availability
 *     tags: [Fire Stations]
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
router.put('/:id/status', authenticate, authorize('fire_admin'), ctrl.updateStatus);

/**
 * @openapi
 * /api/v1/fire-stations/{id}/personnel:
 *   post:
 *     summary: Add personnel to fire station
 *     tags: [Fire Stations]
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
 *               badgeNumber: { type: string, example: GFS-001 }
 *               rank: { type: string, example: Firefighter }
 *     responses:
 *       201:
 *         description: Personnel added
 *   get:
 *     summary: List personnel at fire station
 *     tags: [Fire Stations]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Personnel list
 */
router.post('/:id/personnel', authenticate, authorize('fire_admin'), ctrl.addPersonnel);
router.get('/:id/personnel', authenticate, authorize('system_admin', 'fire_admin'), ctrl.listPersonnel);

module.exports = router;
