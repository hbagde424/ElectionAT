const express = require('express');
const router = express.Router();
const assemblyController = require('../controllers/assemblypolygenController');

/**
 * @swagger
 * tags:
 *   name: Assembly Polygons
 *   description: Assembly polygon data endpoints
 */

/**
 * @swagger
 * /api/assembly-polygons:
 *   get:
 *     summary: Get all assembly polygons
 *     tags: [Assembly Polygons]
 *     responses:
 *       200:
 *         description: List of all assembly polygons
 *       500:
 *         description: Server error
 */
router.get('/', assemblyController.getAllAssemblies);

/**
 * @swagger
 * /api/assembly-polygons/vs-code/{vs_code}:
 *   get:
 *     summary: Get assembly by VS Code
 *     tags: [Assembly Polygons]
 *     parameters:
 *       - in: path
 *         name: vs_code
 *         required: true
 *         schema:
 *           type: string
 *         description: Assembly VS Code
 *     responses:
 *       200:
 *         description: Assembly polygon data
 *       404:
 *         description: Assembly not found
 */
router.get('/vs-code/:vs_code', assemblyController.getAssemblyByVSCode);

/**
 * @swagger
 * /api/assembly-polygons/district/{district}:
 *   get:
 *     summary: Get assemblies by district
 *     tags: [Assembly Polygons]
 *     parameters:
 *       - in: path
 *         name: district
 *         required: true
 *         schema:
 *           type: string
 *         description: District name
 *     responses:
 *       200:
 *         description: List of assembly polygons in the district
 *       404:
 *         description: No assemblies found
 */
router.get('/district/:district', assemblyController.getAssembliesByDistrict);

/**
 * @swagger
 * /api/assembly-polygons/within:
 *   get:
 *     summary: Get assemblies within a geographic area
 *     tags: [Assembly Polygons]
 *     parameters:
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *         description: Longitude of center point
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *         description: Latitude of center point
 *       - in: query
 *         name: radius
 *         required: true
 *         schema:
 *           type: number
 *         description: Radius in kilometers
 *     responses:
 *       200:
 *         description: List of assemblies within the area
 *       400:
 *         description: Missing parameters
 *       404:
 *         description: No assemblies found
 */
router.get('/within', assemblyController.getAssembliesWithin);

/**
 * @swagger
 * /api/assembly-polygons/parliament/{pc_name}:
 *   get:
 *     summary: Get assemblies by parliamentary constituency
 *     tags: [Assembly Polygons]
 *     parameters:
 *       - in: path
 *         name: pc_name
 *         schema:
 *           type: string
 *         required: true
 *         description: Parliamentary Constituency name
 *     responses:
 *       200:
 *         description: List of assemblies in the parliamentary constituency
 *       404:
 *         description: No assemblies found
 */
router.get('/parliament/:pc_name', assemblyController.getAssembliesByParliament);

module.exports = router;
