const { Router } = require('express');
const { body, param } = require('express-validator');
const controller = require('../controllers/auth.controller');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/role');
const validate = require('../middleware/validate');
const { ROLES } = require('../models/user.model');

const router = Router();

// ── Public ────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, role]
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *               role: { type: string, enum: [system_admin, hospital_admin, police_admin, fire_admin, ambulance_driver] }
 *               stationId: { type: string }
 *               organizationId: { type: string, description: "Required for hospital_admin, police_admin, fire_admin" }
 *               organizationType: { type: string, enum: [hospital, police_station, fire_station], description: "Required for admin roles" }
 *     responses:
 *       201:
 *         description: User created
 *       409:
 *         description: Email already in use
 */
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('role').isIn(ROLES).withMessage(`Role must be one of: ${ROLES.join(', ')}`),
    body('stationId').optional().isMongoId().withMessage('Invalid stationId'),
    body('organizationId').optional().isMongoId().withMessage('Invalid organizationId'),
    body('organizationType').optional().isIn(['hospital', 'police_station', 'fire_station']).withMessage('Invalid organizationType'),
  ],
  validate,
  controller.register
);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login and receive tokens
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Returns accessToken, refreshToken, and user
 *       401:
 *         description: Invalid credentials
 */
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  controller.login
);

/**
 * @swagger
 * /api/v1/auth/refresh-token:
 *   post:
 *     summary: Exchange a refresh token for a new access token
 *     tags: [Auth]
 */
router.post(
  '/refresh-token',
  [body('refreshToken').notEmpty().withMessage('Refresh token required')],
  validate,
  controller.refreshToken
);

// ── Authenticated ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Revoke refresh token
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post('/logout', authenticate, controller.logout);

/**
 * @swagger
 * /api/v1/auth/profile:
 *   get:
 *     summary: Get own profile
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Current user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         _id: { type: string }
 *                         name: { type: string }
 *                         email: { type: string }
 *                         role: { type: string }
 *                         isActive: { type: boolean }
 *       401:
 *         description: Missing or invalid token
 */
router.get('/profile', authenticate, controller.getProfile);

/**
 * @swagger
 * /api/v1/auth/profile:
 *   put:
 *     summary: Update own profile
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Kofi Mensah
 *     responses:
 *       200:
 *         description: Profile updated
 *       401:
 *         description: Missing or invalid token
 */
router.put(
  '/profile',
  authenticate,
  [body('name').trim().notEmpty().withMessage('Name is required')],
  validate,
  controller.updateProfile
);

// ── System Admin only ─────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/auth/users:
 *   get:
 *     summary: List all users
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [system_admin, hospital_admin, police_admin, fire_admin, ambulance_driver]
 *     responses:
 *       200:
 *         description: Paginated user list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     users: { type: array, items: { type: object } }
 *                     total: { type: integer }
 *                     page: { type: integer }
 *                     totalPages: { type: integer }
 *       403:
 *         description: Forbidden — system_admin only
 */
router.get('/users', authenticate, authorize('system_admin'), controller.listUsers);

/**
 * @swagger
 * /api/v1/auth/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: MongoDB ObjectId of the user
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: User not found
 */
router.get(
  '/users/:id',
  authenticate,
  authorize('system_admin'),
  [param('id').isMongoId().withMessage('Invalid user ID')],
  validate,
  controller.getUserById
);

/**
 * @swagger
 * /api/v1/auth/users/{id}/status:
 *   put:
 *     summary: Activate or deactivate a user
 *     tags: [Users]
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
 *             required: [isActive]
 *             properties:
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: User status updated
 *       404:
 *         description: User not found
 */
router.put(
  '/users/:id/status',
  authenticate,
  authorize('system_admin'),
  [
    param('id').isMongoId().withMessage('Invalid user ID'),
    body('isActive').isBoolean().withMessage('isActive must be a boolean'),
  ],
  validate,
  controller.setUserStatus
);

/**
 * @swagger
 * /api/v1/auth/users/{id}:
 *   delete:
 *     summary: Delete a user
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User deleted
 *       404:
 *         description: User not found
 */
router.delete(
  '/users/:id',
  authenticate,
  authorize('system_admin'),
  [param('id').isMongoId().withMessage('Invalid user ID')],
  validate,
  controller.deleteUser
);

module.exports = router;
