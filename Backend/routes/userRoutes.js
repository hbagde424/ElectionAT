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
  toggleActive,
  getUserPermissions,
  getDashboard,
  getDashboardStats,
  assignRole,
  removeRole,
  getUserRoles,
  initRBAC
} = require('../controllers/userController');
const { 
  getRBACMetrics, 
  getRolePermissionMatrix, 
  getUserAccessReport 
} = require('../controllers/rbacMetricsController');
const { protect, authorize, requirePermission, requireRole, requireSuperAdmin } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management
 */

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/register', protect, authorize('superAdmin', 'Admin'), register);

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Login a user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *             required:
 *               - username
 *               - password
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
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
router.get('/me', protect, getMe);

/**
 * @swagger
 * /api/users/me:
 *   put:
 *     summary: Update current user profile
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
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
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
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Filter by role
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 pages:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
router.get('/', protect, authorize('superAdmin', 'Admin'), getUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get a user by ID
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
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/:id', protect, authorize('superAdmin', 'Admin'), getUser);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update a user
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
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.put('/:id', protect, authorize('superAdmin', 'Admin'), updateUser);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete a user
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
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.delete('/:id', protect, authorize('superAdmin', 'Admin'), deleteUser);

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
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.put('/:id/toggle-active', protect, authorize('superAdmin', 'Admin'), toggleActive);

// RBAC Routes

/**
 * @swagger
 * /api/users/dashboard:
 *   get:
 *     summary: Get user dashboard data with roles and permissions
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data with user permissions and accessible scopes
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
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         username:
 *                           type: string
 *                         email:
 *                           type: string
 *                         mobile:
 *                           type: string
 *                     roles:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           role:
 *                             type: string
 *                           scope:
 *                             type: string
 *                     permissions:
 *                       type: array
 *                       items:
 *                         type: string
 *                     accessibleScopes:
 *                       type: object
 *       401:
 *         description: Unauthorized
 */
router.get('/dashboard', protect, getDashboard);

/**
 * @swagger
 * /api/users/stats:
 *   get:
 *     summary: Get system statistics (for API connection testing)
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: System statistics
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
 *                     totalUsers:
 *                       type: number
 *                     totalRoles:
 *                       type: number
 *                     totalPermissions:
 *                       type: number
 *                     activeUsers:
 *                       type: number
 *                     systemStatus:
 *                       type: string
 */
router.get('/stats', getDashboardStats);

/**
 * @swagger
 * /api/users/{id}/permissions:
 *   get:
 *     summary: Get user permissions
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
 *         description: User permissions
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
 *                     userId:
 *                       type: string
 *                     username:
 *                       type: string
 *                     permissions:
 *                       type: array
 *                       items:
 *                         type: string
 *                     rolePermissions:
 *                       type: array
 *                       items:
 *                         type: object
 *                     roles:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: User not found
 */
router.get('/:id/permissions', protect, getUserPermissions);

/**
 * @swagger
 * /api/users/{id}/roles:
 *   get:
 *     summary: Get user roles
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
 *         description: User roles with scope information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       role:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           description:
 *                             type: string
 *                       scope:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                           id:
 *                             type: string
 *                           details:
 *                             type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: User not found
 */
router.get('/:id/roles', protect, getUserRoles);

/**
 * @swagger
 * /api/users/{id}/assign-role:
 *   post:
 *     summary: Assign role to user
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
 *             type: object
 *             properties:
 *               roleId:
 *                 type: string
 *                 description: Role ID to assign
 *               scopeType:
 *                 type: string
 *                 enum: [State, Division, Assembly, Parliament, Block, Booth]
 *                 description: Scope type for the role
 *               scopeId:
 *                 type: string
 *                 description: Scope ID for the role
 *             required:
 *               - roleId
 *               - scopeType
 *               - scopeId
 *     responses:
 *       200:
 *         description: Role assigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid input or role already assigned
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: User or role not found
 */
router.post('/:id/assign-role', protect, requirePermission('user.update'), assignRole);

/**
 * @swagger
 * /api/users/{id}/remove-role:
 *   delete:
 *     summary: Remove role from user
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
 *             type: object
 *             properties:
 *               roleId:
 *                 type: string
 *                 description: Role ID to remove
 *               scopeType:
 *                 type: string
 *                 enum: [State, Division, Assembly, Parliament, Block, Booth]
 *                 description: Scope type for the role
 *               scopeId:
 *                 type: string
 *                 description: Scope ID for the role
 *             required:
 *               - roleId
 *               - scopeType
 *               - scopeId
 *     responses:
 *       200:
 *         description: Role removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Role assignment not found
 */
router.delete('/:id/remove-role', protect, requirePermission('user.update'), removeRole);

/**
 * @swagger
 * /api/users/init-rbac:
 *   post:
 *     summary: Initialize RBAC system (SuperAdmin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: RBAC system initialized successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied - SuperAdmin role required
 */
router.post('/init-rbac', protect, requireSuperAdmin, initRBAC);

// Metrics and Analytics Routes

/**
 * @swagger
 * /api/users/rbac-metrics:
 *   get:
 *     summary: Get RBAC system metrics and analytics
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: RBAC metrics data
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
 *                     overview:
 *                       type: object
 *                       properties:
 *                         totalUsers:
 *                           type: number
 *                         totalRoles:
 *                           type: number
 *                         totalPermissions:
 *                           type: number
 *                         totalRoleAssignments:
 *                           type: number
 *                         inactiveUsersCount:
 *                           type: number
 *                     distributions:
 *                       type: object
 *                     analytics:
 *                       type: object
 *                     recent:
 *                       type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 */
router.get('/rbac-metrics', protect, requirePermission('system.admin'), getRBACMetrics);

/**
 * @swagger
 * /api/users/role-permission-matrix:
 *   get:
 *     summary: Get role-permission matrix
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Role-permission matrix
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
 *                     roles:
 *                       type: number
 *                     permissions:
 *                       type: number
 *                     matrix:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 */
router.get('/role-permission-matrix', protect, requirePermission('system.admin'), getRolePermissionMatrix);

/**
 * @swagger
 * /api/users/{userId}/access-report:
 *   get:
 *     summary: Get detailed access report for a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User access report
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
 *                     user:
 *                       type: object
 *                     roles:
 *                       type: array
 *                     permissions:
 *                       type: object
 *                     summary:
 *                       type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: User not found
 */
router.get('/:userId/access-report', protect, requirePermission('user.read'), getUserAccessReport);

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - username
 *         - mobile
 *         - email
 *         - password
 *         - role
 *       properties:
 *         username:
 *           type: string
 *           example: "john_doe"
 *         mobile:
 *           type: string
 *           example: "9876543210"
 *         email:
 *           type: string
 *           format: email
 *           example: "john@example.com"
 *         password:
 *           type: string
 *           minLength: 6
 *           example: "password123"
 *         role:
 *           type: string
 *           enum: ["superAdmin", "State", "Admin", "Booth", "Division", "Parliament", "Block", "Assembly"]
 *           example: "Admin"
 *         state_ids:
 *           type: array
 *           items:
 *             type: string
 *           example: ["507f1f77bcf86cd799439011"]
 *         division_ids:
 *           type: array
 *           items:
 *             type: string
 *           example: ["507f1f77bcf86cd799439012"]
 *         parliament_ids:
 *           type: array
 *           items:
 *             type: string
 *           example: ["507f1f77bcf86cd799439013"]
 *         assembly_ids:
 *           type: array
 *           items:
 *             type: string
 *           example: ["507f1f77bcf86cd799439014"]
 *         block_ids:
 *           type: array
 *           items:
 *             type: string
 *           example: ["507f1f77bcf86cd799439015"]
 *         booth_ids:
 *           type: array
 *           items:
 *             type: string
 *           example: ["507f1f77bcf86cd799439016"]
 *         isActive:
 *           type: boolean
 *           default: true
 *         created_by:
 *           type: string
 *           example: "507f1f77bcf86cd799439022"
 *         updated_by:
 *           type: string
 *           example: "507f1f77bcf86cd799439022"
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
 *             username:
 *               type: string
 *             email:
 *               type: string
 *             role:
 *               type: string
 *     UserUpdate:
 *       type: object
 *       properties:
 *         username:
 *           type: string
 *         mobile:
 *           type: string
 *         email:
 *           type: string
 *         password:
 *           type: string
 *         role:
 *           type: string
 *         state_ids:
 *           type: array
 *           items:
 *             type: string
 *         division_ids:
 *           type: array
 *           items:
 *             type: string
 *         parliament_ids:
 *           type: array
 *           items:
 *             type: string
 *         assembly_ids:
 *           type: array
 *           items:
 *             type: string
 *         block_ids:
 *           type: array
 *           items:
 *             type: string
 *         booth_ids:
 *           type: array
 *           items:
 *             type: string
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

module.exports = router;