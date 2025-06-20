const express = require('express');
const {
  getFullHierarchy,
  getHierarchyByDivision,
  getHierarchyByParliament
} = require('../controllers/hierarchyController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Hierarchy
 *   description: Geographical hierarchy management
 */

/**
 * @swagger
 * /api/hierarchy:
 *   get:
 *     summary: Get full geographical hierarchy
 *     tags: [Hierarchy]
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
 *         name: division
 *         schema:
 *           type: string
 *         description: Filter by division ID
 *       - in: query
 *         name: parliament
 *         schema:
 *           type: string
 *         description: Filter by parliament ID
 *       - in: query
 *         name: assembly
 *         schema:
 *           type: string
 *         description: Filter by assembly ID
 *       - in: query
 *         name: block
 *         schema:
 *           type: string
 *         description: Filter by block ID
 *     responses:
 *       200:
 *         description: Full geographical hierarchy
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
 *                     $ref: '#/components/schemas/HierarchyItem'
 */
router.get('/', getFullHierarchy);

/**
 * @swagger
 * /api/hierarchy/division/{divisionId}:
 *   get:
 *     summary: Get hierarchy starting from division
 *     tags: [Hierarchy]
 *     parameters:
 *       - in: path
 *         name: divisionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Hierarchy for specific division
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/HierarchyItem'
 *       404:
 *         description: Division not found
 */
router.get('/division/:divisionId', getHierarchyByDivision);

/**
 * @swagger
 * /api/hierarchy/parliament/{parliamentId}:
 *   get:
 *     summary: Get hierarchy starting from parliament
 *     tags: [Hierarchy]
 *     parameters:
 *       - in: path
 *         name: parliamentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Hierarchy for specific parliament
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/HierarchyItem'
 *       404:
 *         description: Parliament not found
 */
router.get('/parliament/:parliamentId', getHierarchyByParliament);

/**
 * @swagger
 * components:
 *   schemas:
 *     HierarchyItem:
 *       type: object
 *       properties:
 *         division:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *         parliament:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *         assembly:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *             type:
 *               type: string
 *         block:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *         booth:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             number:
 *               type: string
 *             name:
 *               type: string
 */

module.exports = router;