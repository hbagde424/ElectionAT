const express = require('express');
const {
  register,
  login,
  getMe,
  updateMe,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  toggleActive
} = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/auth');
const User = require('../models/User'); // Add this line
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management and authentication
 */

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Register a new user (open for first superAdmin, protected for others)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserRegister'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       400:
 *         description: Invalid input data
 */
// router.post('/register', async (req, res, next) => {
//   // Check if any superAdmin exists
//   const superAdminExists = await User.exists({ role: 'superAdmin' });
  
//   if (superAdminExists) {
//     // If superAdmin exists, protect this route
//     return protect(req, res, () => authorize('superAdmin')(req, res, next));
//   }
  
//   // If no superAdmin exists, allow open registration
//   return register(req, res, next);
// });
// router.post('/register', register);
router.post('/register', protect, authorize('superAdmin', 'admin'), register);

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Login user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLogin'
 *     responses:
 *       200:
 *         description: User logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       400:
 *         description: Invalid credentials
 */
router.post('/login', login);

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get current logged in user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authorized
 */
router.get('/me', protect, getMe);

/**
 * @swagger
 * /api/users/me:
 *   put:
 *     summary: Update current user details
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserUpdate'
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
router.put('/me', protect, updateMe);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authorized
 */
router.get('/', protect, authorize('superAdmin', 'admin'), getUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get single user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authorized
 *       404:
 *         description: User not found
 */
router.get('/:id', protect, authorize('superAdmin', 'admin'), getUser);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserUpdate'
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       404:
 *         description: User not found
 */
router.put('/:id', protect, authorize('superAdmin', 'admin'), updateUser);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted
 *       401:
 *         description: Not authorized
 *       404:
 *         description: User not found
 */
router.delete('/:id', protect, authorize('superAdmin', 'admin'), deleteUser);

/**
 * @swagger
 * /api/users/{id}/toggle-active:
 *   put:
 *     summary: Toggle user active status
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User active status toggled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     isActive:
 *                       type: boolean
 *       401:
 *         description: Not authorized
 *       404:
 *         description: User not found
 */
router.put('/:id/toggle-active', protect, authorize('superAdmin', 'admin'), toggleActive);

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         email:
 *           type: string
 *         role:
 *           type: string
 *           enum: ['superAdmin', 'admin', 'master', 'division', 'parliament', 'block', 'assembly']
 *         accessLevel:
 *           type: string
 *           enum: ['editor', 'viewOnly']
 *         regionIds:
 *           type: array
 *           items:
 *             type: string
 *         regionModel:
 *           type: string
 *           enum: ['Division', 'Parliament', 'Block', 'Assembly', 'master']
 *         isActive:
 *           type: boolean
 *         createdBy:
 *           type: string
 *         updatedBy:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     UserRegister:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - role
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           minLength: 6
 *         role:
 *           type: string
 *           enum: ['superAdmin', 'admin', 'master', 'division', 'parliament', 'block', 'assembly']
 *         accessLevel:
 *           type: string
 *           enum: ['editor', 'viewOnly']
 *           default: 'viewOnly'
 *         regionIds:
 *           type: array
 *           items:
 *             type: string
 *         regionModel:
 *           type: string
 *           enum: ['Division', 'Parliament', 'Block', 'Assembly', 'master']
 *     UserLogin:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *     UserUpdate:
 *       type: object
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           minLength: 6
 *         accessLevel:
 *           type: string
 *           enum: ['editor', 'viewOnly']
 *     UserResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         token:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             email:
 *               type: string
 *             role:
 *               type: string
 *             accessLevel:
 *               type: string
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

module.exports = router;