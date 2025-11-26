const express = require('express');
const {
  getFAQs,
  getFAQ,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  getFAQCategories
} = require('../controllers/faqController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: FAQs
 *   description: FAQ management
 */

/**
 * @swagger
 * /api/faqs:
 *   get:
 *     summary: Get all FAQs
 *     tags: [FAQs]
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
 *         description: Search term for question, answer, or category
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: all
 *         schema:
 *           type: string
 *           enum: [true]
 *         description: Get all FAQs (for CSV export)
 *     responses:
 *       200:
 *         description: List of FAQs
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
 *                     $ref: '#/components/schemas/FAQ'
 */
router.get('/', getFAQs);

/**
 * @swagger
 * /api/faqs/categories/list:
 *   get:
 *     summary: Get FAQ categories
 *     tags: [FAQs]
 *     responses:
 *       200:
 *         description: List of FAQ categories
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
 *                     type: string
 */
router.get('/categories/list', getFAQCategories);

/**
 * @swagger
 * /api/faqs/{id}:
 *   get:
 *     summary: Get single FAQ
 *     tags: [FAQs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: FAQ data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FAQ'
 *       404:
 *         description: FAQ not found
 */
router.get('/:id', getFAQ);

/**
 * @swagger
 * /api/faqs:
 *   post:
 *     summary: Create new FAQ
 *     tags: [FAQs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FAQ'
 *     responses:
 *       201:
 *         description: FAQ created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
router.post('/', protect, authorize('superAdmin'), createFAQ);

/**
 * @swagger
 * /api/faqs/{id}:
 *   put:
 *     summary: Update FAQ
 *     tags: [FAQs]
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
 *             $ref: '#/components/schemas/FAQ'
 *     responses:
 *       200:
 *         description: FAQ updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       404:
 *         description: FAQ not found
 */
router.put('/:id', protect, authorize('superAdmin'), updateFAQ);

/**
 * @swagger
 * /api/faqs/{id}:
 *   delete:
 *     summary: Delete FAQ
 *     tags: [FAQs]
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
 *         description: FAQ deleted
 *       401:
 *         description: Not authorized
 *       404:
 *         description: FAQ not found
 */
router.delete('/:id', protect, authorize('superAdmin'), deleteFAQ);

/**
 * @swagger
 * components:
 *   schemas:
 *     FAQ:
 *       type: object
 *       required:
 *         - question
 *         - answer
 *         - category
 *         - created_by
 *       properties:
 *         question:
 *           type: string
 *           description: The FAQ question
 *           example: "What is ElectionAT?"
 *         answer:
 *           type: string
 *           description: The FAQ answer (HTML allowed)
 *           example: "<p>ElectionAT is a comprehensive election management platform.</p>"
 *         category:
 *           type: string
 *           enum: [General Questions, Account & Login, Data & Analytics, Technical Support, Other]
 *           description: FAQ category
 *           example: "General Questions"
 *         is_active:
 *           type: boolean
 *           description: Whether the FAQ is active
 *           default: true
 *         order_index:
 *           type: number
 *           description: Order for displaying FAQs
 *           default: 0
 *         created_by:
 *           type: string
 *           description: Reference to User who created
 *           example: "507f1f77bcf86cd799439022"
 *         updated_by:
 *           type: string
 *           description: Reference to User who last updated
 *           example: "507f1f77bcf86cd799439023"
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