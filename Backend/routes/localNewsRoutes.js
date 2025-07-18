const express = require('express');
const {
  getLocalNews,
  getLocalNewsItem,
  createLocalNews,
  updateLocalNews,
  deleteLocalNews,
  getNewsByBooth
} = require('../controllers/localNewsController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Local News
 *   description: Local news management
 */

/**
 * @swagger
 * /api/local-news:
 *   get:
 *     summary: Get all local news
 *     tags: [Local News]
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
 *         description: Search term for headlines
 *       - in: query
 *         name: booth
 *         schema:
 *           type: string
 *         description: Booth ID to filter by
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering
 *     responses:
 *       200:
 *         description: List of local news items
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
 *                     $ref: '#/components/schemas/LocalNews'
 */
router.get('/', getLocalNews);

/**
 * @swagger
 * /api/local-news/{id}:
 *   get:
 *     summary: Get single news item
 *     tags: [Local News]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: News item data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LocalNews'
 *       404:
 *         description: News item not found
 */
router.get('/:id', getLocalNewsItem);

/**
 * @swagger
 * /api/local-news:
 *   post:
 *     summary: Create new news item
 *     tags: [Local News]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LocalNews'
 *     responses:
 *       201:
 *         description: News item created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
router.post('/', protect, authorize('superAdmin'), createLocalNews);

/**
 * @swagger
 * /api/local-news/{id}:
 *   put:
 *     summary: Update news item
 *     tags: [Local News]
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
 *             $ref: '#/components/schemas/LocalNews'
 *     responses:
 *       200:
 *         description: News item updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       404:
 *         description: News item not found
 */
router.put('/:id', protect, authorize('superAdmin'), updateLocalNews);

/**
 * @swagger
 * /api/local-news/{id}:
 *   delete:
 *     summary: Delete news item
 *     tags: [Local News]
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
 *         description: News item deleted
 *       401:
 *         description: Not authorized
 *       404:
 *         description: News item not found
 */
router.delete('/:id', protect, authorize('superAdmin'), deleteLocalNews);

/**
 * @swagger
 * /api/local-news/booth/{boothId}:
 *   get:
 *     summary: Get news by booth
 *     tags: [Local News]
 *     parameters:
 *       - in: path
 *         name: boothId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of news items for the booth
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
 *                     $ref: '#/components/schemas/LocalNews'
 *       404:
 *         description: Booth not found
 */
router.get('/booth/:boothId', getNewsByBooth);

/**
 * @swagger
 * components:
 *   schemas:
 *     LocalNews:
 *       type: object
 *       required:
 *         - booth_id
 *         - headline
 *         - source
 *         - news_url
 *       properties:
 *         booth_id:
 *           type: string
 *           description: Reference to Booth
 *           example: "507f1f77bcf86cd799439011"
 *         headline:
 *           type: string
 *           description: News headline
 *           example: "Local election results announced"
 *         source:
 *           type: string
 *           description: News source
 *           example: "Daily News"
 *         published_date:
 *           type: string
 *           format: date-time
 *           description: Publication date
 *           example: "2023-05-15T10:00:00Z"
 *         news_url:
 *           type: string
 *           description: URL to full news article
 *           example: "https://example.com/news/local-election-results"
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