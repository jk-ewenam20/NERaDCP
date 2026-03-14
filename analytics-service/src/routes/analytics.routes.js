const router = require('express').Router();
const ctrl = require('../controllers/analytics.controller');
const authenticate = require('../middleware/auth');

/**
 * @openapi
 * /api/v1/analytics/overview:
 *   get:
 *     summary: Dashboard summary stats
 *     tags: [Analytics]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Overview stats
 */
router.get('/overview', authenticate, ctrl.getOverview);

/**
 * @openapi
 * /api/v1/analytics/response-times:
 *   get:
 *     summary: Average response times by type and period
 *     tags: [Analytics]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: incidentType
 *         schema: { type: string }
 *       - in: query
 *         name: periodType
 *         schema: { type: string, enum: [day, month], default: month }
 *     responses:
 *       200:
 *         description: Response time periods
 */
router.get('/response-times', authenticate, ctrl.getResponseTimes);

/**
 * @openapi
 * /api/v1/analytics/incidents-by-region:
 *   get:
 *     summary: Incident counts by region and type
 *     tags: [Analytics]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Regional breakdown
 */
router.get('/incidents-by-region', authenticate, ctrl.getIncidentsByRegion);

/**
 * @openapi
 * /api/v1/analytics/incidents-by-type:
 *   get:
 *     summary: Breakdown of incidents by type
 *     tags: [Analytics]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Type breakdown
 */
router.get('/incidents-by-type', authenticate, ctrl.getIncidentsByType);

/**
 * @openapi
 * /api/v1/analytics/resource-utilization:
 *   get:
 *     summary: Hospital capacity and vehicle deployment stats
 *     tags: [Analytics]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Resource utilization
 */
router.get('/resource-utilization', authenticate, ctrl.getResourceUtilization);

/**
 * @openapi
 * /api/v1/analytics/top-responders:
 *   get:
 *     summary: Most frequently deployed responders
 *     tags: [Analytics]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Top responders
 */
router.get('/top-responders', authenticate, ctrl.getTopResponders);

module.exports = router;
