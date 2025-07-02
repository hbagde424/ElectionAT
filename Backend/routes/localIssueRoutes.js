const express = require('express');
const {
  getLocalIssues,
  getLocalIssue,
  createLocalIssue,
  updateLocalIssue,
  deleteLocalIssue,
  getLocalIssuesByBooth,
  getLocalIssuesByStatus
} = require('../controllers/localIssueController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Local Issues
 *   description: Local issue management
 */

/**
 * @swagger
 * /api/local-issues:
 *   get:
 *     summary: Get all local issues
 *     tags: [Local Issues]
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
 *         description: Search term for issue names
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Reported, In Progress, Resolved, Rejected]
 *         description: Filter by status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [Low, Medium, High, Critical]
 *         description: Filter by priority
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter by department
 *       - in: query
 *         name: division
 *         schema:
 *           type: string
 *         description: Division ID to filter by
 *       - in: query
 *         name: parliament
 *         schema:
 *           type: string
 *         description: Parliament ID to filter by
 *       - in: query
 *         name: assembly
 *         schema:
 *           type: string
 *         description: Assembly ID to filter by
 *       - in: query
 *         name: block
 *         schema:
 *           type: string
 *         description: Block ID to filter by
 *       - in: query
 *         name: booth
 *         schema:
 *           type: string
 *         description: Booth ID to filter by
 *       - in: query
 *         name: creator
 *         schema:
 *           type: string
 *         description: Creator user ID to filter by
 *     responses:
 *       200:
 *         description: List of local issues
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
 *                     $ref: '#/components/schemas/LocalIssue'
 */
router.get('/', getLocalIssues);

/**
 * @swagger
 * /api/local-issues/{id}:
 *   get:
 *     summary: Get single local issue
 *     tags: [Local Issues]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Local issue data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LocalIssue'
 *       404:
 *         description: Local issue not found
 */
router.get('/:id', getLocalIssue);

/**
 * @swagger
 * /api/local-issues:
 *   post:
 *     summary: Create new local issue
 *     tags: [Local Issues]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LocalIssue'
 *     responses:
 *       201:
 *         description: Local issue created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
router.post('/', protect, createLocalIssue);

/**
 * @swagger
 * /api/local-issues/{id}:
 *   put:
 *     summary: Update local issue
 *     tags: [Local Issues]
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
 *             $ref: '#/components/schemas/LocalIssue'
 *     responses:
 *       200:
 *         description: Local issue updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Local issue not found
 */
router.put('/:id', protect, updateLocalIssue);

/**
 * @swagger
 * /api/local-issues/{id}:
 *   delete:
 *     summary: Delete local issue
 *     tags: [Local Issues]
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
 *         description: Local issue deleted
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Local issue not found
 */
router.delete('/:id', protect, authorize('superAdmin'), deleteLocalIssue);

/**
 * @swagger
 * /api/local-issues/booth/{boothId}:
 *   get:
 *     summary: Get local issues by booth
 *     tags: [Local Issues]
 *     parameters:
 *       - in: path
 *         name: boothId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of local issues for the booth
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LocalIssue'
 *       404:
 *         description: Booth not found
 */
router.get('/booth/:boothId', getLocalIssuesByBooth);

/**
 * @swagger
 * /api/local-issues/status/{status}:
 *   get:
 *     summary: Get local issues by status
 *     tags: [Local Issues]
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [Reported, In Progress, Resolved, Rejected]
 *     responses:
 *       200:
 *         description: List of local issues with the specified status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LocalIssue'
 *       400:
 *         description: Invalid status
 */
router.get('/status/:status', getLocalIssuesByStatus);

/**
 * @swagger
 * components:
 *   schemas:
 *     LocalIssue:
 *       type: object
 *       required:
 *         - issue_name
 *         - department
 *         - division_id
 *         - parliament_id
 *         - assembly_id
 *         - block_id
 *         - booth_id
 *         - created_by
 *       properties:
 *         issue_name:
 *           type: string
 *           description: Name of the issue
 *           example: "Road Repair"
 *         department:
 *           type: string
 *           description: Department responsible
 *           example: "Public Works"
 *         description:
 *           type: string
 *           description: Detailed description of the issue
 *           example: "Potholes on Main Street need repair"
 *         status:
 *           type: string
 *           enum: [Reported, In Progress, Resolved, Rejected]
 *           description: Current status of the issue
 *           example: "Reported"
 *         priority:
 *           type: string
 *           enum: [Low, Medium, High, Critical]
 *           description: Priority level of the issue
 *           example: "High"
 *         division_id:
 *           type: string
 *           description: Reference to Division
 *           example: "507f1f77bcf86cd799439011"
 *         parliament_id:
 *           type: string
 *           description: Reference to Parliament
 *           example: "507f1f77bcf86cd799439012"
 *         assembly_id:
 *           type: string
 *           description: Reference to Assembly
 *           example: "507f1f77bcf86cd799439013"
 *         block_id:
 *           type: string
 *           description: Reference to Block
 *           example: "507f1f77bcf86cd799439014"
 *         booth_id:
 *           type: string
 *           description: Reference to Booth
 *           example: "507f1f77bcf86cd799439015"
 *         created_by:
 *           type: string
 *           description: User who created the record
 *           example: "507f1f77bcf86cd799439016"
 *         updated_by:
 *           type: string
 *           description: User who last updated the record
 *           example: "507f1f77bcf86cd799439017"
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

module.exports = router;