const router = require('express').Router();
const ctrl = require('../controllers/hospital.controller');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/role');

/**
 * @openapi
 * /api/v1/hospitals:
 *   post:
 *     summary: Register a new hospital
 *     tags: [Hospitals]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, address, longitude, latitude, totalBeds, availableBeds]
 *             properties:
 *               name: { type: string, example: Korle Bu Teaching Hospital }
 *               address: { type: string, example: Guggisberg Ave, Accra }
 *               longitude: { type: number, example: -0.2209 }
 *               latitude: { type: number, example: 5.5369 }
 *               totalBeds: { type: integer, example: 200 }
 *               availableBeds: { type: integer, example: 47 }
 *               contactPhone: { type: string, example: "+233302674500" }
 *               contactEmail: { type: string, example: info@korlebu.gov.gh }
 *     responses:
 *       201:
 *         description: Hospital created
 *       403:
 *         description: Forbidden — system_admin only
 *   get:
 *     summary: List all hospitals
 *     tags: [Hospitals]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of hospitals
 */
router.post('/', authenticate, authorize('system_admin'), ctrl.create);
router.get('/', authenticate, ctrl.list);

/**
 * @openapi
 * /api/v1/hospitals/{id}:
 *   get:
 *     summary: Get hospital by ID
 *     tags: [Hospitals]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Hospital details
 *       404:
 *         description: Hospital not found
 *   put:
 *     summary: Update hospital info
 *     tags: [Hospitals]
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
 *               longitude: { type: number }
 *               latitude: { type: number }
 *               totalBeds: { type: integer }
 *               contactPhone: { type: string }
 *               contactEmail: { type: string }
 *               status: { type: string, enum: [active, inactive, full] }
 *     responses:
 *       200:
 *         description: Hospital updated
 *       404:
 *         description: Hospital not found
 *   delete:
 *     summary: Delete hospital
 *     tags: [Hospitals]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Hospital deleted
 *       404:
 *         description: Hospital not found
 */
router.get('/:id', authenticate, ctrl.getById);
router.put('/:id', authenticate, authorize('system_admin', 'hospital_admin'), ctrl.update);
router.delete('/:id', authenticate, authorize('system_admin'), ctrl.remove);

/**
 * @openapi
 * /api/v1/hospitals/{id}/capacity:
 *   put:
 *     summary: Update bed availability
 *     tags: [Hospitals]
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
 *             required: [availableBeds]
 *             properties:
 *               availableBeds: { type: integer, example: 45 }
 *     responses:
 *       200:
 *         description: Capacity updated
 *       404:
 *         description: Hospital not found
 */
router.put('/:id/capacity', authenticate, authorize('hospital_admin'), ctrl.updateCapacity);

module.exports = router;
