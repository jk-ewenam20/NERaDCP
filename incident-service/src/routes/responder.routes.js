const router = require('express').Router();
const ctrl = require('../controllers/responder.controller');
const authenticate = require('../middleware/auth');

/**
 * @openapi
 * /api/v1/responders/nearest:
 *   get:
 *     summary: Find nearest available responder
 *     tags: [Responders]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema: { type: number }
 *       - in: query
 *         name: lng
 *         required: true
 *         schema: { type: number }
 *       - in: query
 *         name: type
 *         required: true
 *         schema: { type: string, enum: [medical, fire, crime] }
 *       - in: query
 *         name: maxDistance
 *         schema: { type: integer, default: 50000 }
 *     responses:
 *       200:
 *         description: Nearest responder
 */
router.get('/nearest', authenticate, ctrl.findNearest);

module.exports = router;
