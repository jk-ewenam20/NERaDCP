const router = require('express').Router();
const ctrl = require('../controllers/dispatch.controller');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/role');

/**
 * @openapi
 * /api/v1/dispatches:
 *   get:
 *     summary: List all dispatch records
 *     tags: [Dispatches]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of dispatch records
 */
router.get('/', authenticate, authorize('system_admin'), ctrl.listDispatches);

/**
 * @openapi
 * /api/v1/dispatches/{incidentId}:
 *   get:
 *     summary: Get dispatch record for a specific incident
 *     tags: [Dispatches]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: incidentId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Dispatch record
 */
router.get('/:incidentId', authenticate, authorize('system_admin'), ctrl.getByIncident);

/**
 * @openapi
 * /api/v1/dispatches/{id}/status:
 *   put:
 *     summary: Update dispatch status (arrived, completed, cancelled)
 *     tags: [Dispatches]
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
 *               status: { type: string, enum: [en_route, arrived, completed, cancelled] }
 *     responses:
 *       200:
 *         description: Dispatch status updated
 */
router.put('/:id/status', authenticate, authorize('system_admin', 'ambulance_driver'), ctrl.updateStatus);

module.exports = router;
