const router = require('express').Router();
const ctrl = require('../controllers/incident.controller');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/role');

const adminOnly    = authorize('system_admin');
// All responder roles may create incidents; their allowed type is enforced
// in the controller based on req.user.role.
const allResponders = authorize(
  'system_admin', 'hospital_admin', 'police_admin', 'fire_admin', 'ambulance_driver'
);

/**
 * @openapi
 * /api/v1/incidents/stats:
 *   get:
 *     summary: Incident summary counts by status
 *     tags: [Incidents]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Stats object
 */
router.get('/stats', authenticate, adminOnly, ctrl.getStats);

/**
 * @openapi
 * /api/v1/incidents/open:
 *   get:
 *     summary: List open/active incidents
 *     tags: [Incidents]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Open incidents
 */
router.get('/open', authenticate, allResponders, ctrl.listOpen);

/**
 * @openapi
 * /api/v1/incidents:
 *   post:
 *     summary: Create new incident with auto-dispatch
 *     tags: [Incidents]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [citizenName, incidentType, latitude, longitude]
 *             properties:
 *               citizenName: { type: string }
 *               citizenPhone: { type: string }
 *               incidentType: { type: string, enum: [medical, fire, crime, accident, other] }
 *               latitude: { type: number }
 *               longitude: { type: number }
 *               address: { type: string }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: Incident created and dispatched
 *   get:
 *     summary: List all incidents (paginated)
 *     tags: [Incidents]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated incidents
 */
router.post('/', authenticate, allResponders, ctrl.create);
router.get('/', authenticate, allResponders, ctrl.list);

/**
 * @openapi
 * /api/v1/incidents/{id}:
 *   get:
 *     summary: Get incident details
 *     tags: [Incidents]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Incident details
 */
router.get('/:id', authenticate, adminOnly, ctrl.getById);

/**
 * @openapi
 * /api/v1/incidents/{id}/status:
 *   put:
 *     summary: Manually update incident status
 *     tags: [Incidents]
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
 *               status: { type: string, enum: [created, dispatched, in_progress, resolved, cancelled] }
 *     responses:
 *       200:
 *         description: Status updated
 */
router.put('/:id/status', authenticate, adminOnly, ctrl.updateStatus);

/**
 * @openapi
 * /api/v1/incidents/{id}/assign:
 *   put:
 *     summary: Reassign incident to different unit
 *     tags: [Incidents]
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
 *             required: [unitId, unitType]
 *             properties:
 *               unitId: { type: string }
 *               unitType: { type: string, enum: [ambulance, police_station, fire_station] }
 *     responses:
 *       200:
 *         description: Incident reassigned
 */
router.put('/:id/assign', authenticate, adminOnly, ctrl.reassign);

module.exports = router;
