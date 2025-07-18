const express = require('express');
const router = express.Router();
const assemblyController = require('../controllers/assemblypolygenController');
const authController = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Assemblies
 *   description: Assembly data endpoints
 */

/**
 * @swagger
 * /api/assembly:
 *   get:
 *     summary: Get all assemblies polygen
 *     tags: [Assemblies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all assemblies
 *       401:
 *         description: Unauthorized
 */
router.get('/',  assemblyController.getAllAssemblies);

/**
 * @swagger
 * /api/assembly/vs_code/{vs_code}:
 *   get:
 *     summary: Get assembly polygen by VS Code 
 *     tags: [Assemblies]
 *     parameters:
 *       - in: path
 *         name: vs_code
 *         schema:
 *           type: integer
 *         required: true
 *         description: Assembly VS Code
 *     responses:
 *       200:
 *         description: Assembly data
 *       404:
 *         description: Assembly not found
 */
router.get('/vs_code/:vs_code',  assemblyController.getAssemblyByVSCode);

/**
 * @swagger
 * /api/Assembly/district/{district}:
 *   get:
 *     summary: Get assemblies polygens by district 
 *     tags: [Assemblies]
 *     parameters:
 *       - in: path
 *         name: district
 *         schema:
 *           type: string
 *         required: true
 *         description: District name
 *     responses:
 *       200:
 *         description: List of assemblies in the district
 */
router.get('/district/:district', assemblyController.getAssembliesByDistrict);

/**
 * @swagger
 * /api/assembly/within:
 *   get:
 *     summary: Get assemblies polygens within geographic area
 *     tags: [Assemblies]
 *     parameters:
 *       - in: query
 *         name: longitude
 *         schema:
 *           type: number
 *         required: true
 *         description: Longitude of center point
 *       - in: query
 *         name: latitude
 *         schema:
 *           type: number
 *         required: true
 *         description: Latitude of center point
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *         required: true
 *         description: Radius in kilometers
 *     responses:
 *       200:
 *         description: List of assemblies within the area
 */
router.get('/within', assemblyController.getAssembliesWithin);

module.exports = router;