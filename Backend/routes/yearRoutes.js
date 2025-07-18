const express = require('express');
const {
  getYears,
  getCurrentYear,
  createYear,
  updateYear,
  setCurrentYear,
  deleteYear
} = require('../controllers/yearController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Years
 *   description: Year management
 */

/**
 * @swagger
 * /api/years:
 *   get:
 *     summary: Get all years
 *     tags: [Years]
 *     responses:
 *       200:
 *         description: List of all years
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
 *                     $ref: '#/components/schemas/Year'
 */
router.get('/', getYears);

/**
 * @swagger
 * /api/years/current:
 *   get:
 *     summary: Get current year
 *     tags: [Years]
 *     responses:
 *       200:
 *         description: Current year data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Year'
 */
router.get('/current', getCurrentYear);

/**
 * @swagger
 * /api/years:
 *   post:
 *     summary: Create a new year
 *     tags: [Years]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Year'
 *     responses:
 *       201:
 *         description: Year created successfully
 *       400:
 *         description: Year already exists
 */
router.post('/', createYear);

/**
 * @swagger
 * /api/years/{id}:
 *   put:
 *     summary: Update a year
 *     tags: [Years]
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
 *             $ref: '#/components/schemas/Year'
 *     responses:
 *       200:
 *         description: Year updated successfully
 *       400:
 *         description: Year value cannot be changed
 *       404:
 *         description: Year not found
 */
router.put('/:id', updateYear);

/**
 * @swagger
 * /api/years/set-current/{id}:
 *   put:
 *     summary: Set current year
 *     tags: [Years]
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
 *         description: Current year set successfully
 *       404:
 *         description: Year not found
 */
router.put('/set-current/:id', protect, setCurrentYear);

/**
 * @swagger
 * /api/years/{id}:
 *   delete:
 *     summary: Delete a year
 *     tags: [Years]
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
 *         description: Year deleted successfully
 *       400:
 *         description: Cannot delete the current year
 *       404:
 *         description: Year not found
 */
router.delete('/:id',  deleteYear);

/**
 * @swagger
 * components:
 *   schemas:
 *     Year:
 *       type: object
 *       required:
 *         - year
 *       properties:
 *         year:
 *           type: integer
 *           description: The year value (e.g., 2023)
 *           minimum: 1900
 *           maximum: 2100
 *         is_current:
 *           type: boolean
 *           description: Whether this is the current year
 *           default: false
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Date when the year was added
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Date when the year was last updated
 *       example:
 *         year: 2023
 *         is_current: true
 *         created_at: "2023-01-01T00:00:00.000Z"
 *         updated_at: "2023-01-01T00:00:00.000Z"
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

module.exports = router;