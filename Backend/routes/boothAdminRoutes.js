const express = require('express');
const router = express.Router();
const boothAdminController = require('../controllers/boothAdminController');
const { protect, authorize } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Booth Admin
 *   description: Booth administrative information management
 */

/**
 * @swagger
 * /api/booth-admin:
 *   post:
 *     summary: Create booth admin details
 *     tags: [Booth Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BoothAdmin'
 *     responses:
 *       201:
 *         description: Booth admin details created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BoothAdmin'
 *       400:
 *         description: Bad request
 *       404:
 *         description: Booth not found
 *       401:
 *         description: Unauthorized
 */
router.post('/', protect, authorize('master', 'district'), boothAdminController.createBoothAdmin);

/**
 * @swagger
 * /api/booth-admin:
 *   get:
 *     summary: Get all booth admin details
 *     tags: [Booth Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all booth admin details
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BoothAdmin'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/',  boothAdminController.getAllBoothAdmins);

/**
 * @swagger
 * /api/booth-admin/booth/{boothId}:
 *   get:
 *     summary: Get booth admin details by booth ID
 *     tags: [Booth Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: boothId
 *         schema:
 *           type: string
 *         required: true
 *         description: Booth ID
 *     responses:
 *       200:
 *         description: Booth admin details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BoothAdmin'
 *       404:
 *         description: Booth admin details not found
 *       401:
 *         description: Unauthorized
 */
router.get('/booth/:boothId', protect, boothAdminController.getBoothAdminByBoothId);

/**
 * @swagger
 * /api/booth-admin/booth/{boothId}:
 *   put:
 *     summary: Update booth admin details
 *     tags: [Booth Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: boothId
 *         schema:
 *           type: string
 *         required: true
 *         description: Booth ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BoothAdmin'
 *     responses:
 *       200:
 *         description: Updated booth admin details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BoothAdmin'
 *       400:
 *         description: Bad request
 *       404:
 *         description: Booth admin details not found
 *       401:
 *         description: Unauthorized
 */
router.put('/booth/:boothId', protect, authorize('master', 'district'), boothAdminController.updateBoothAdmin);

/**
 * @swagger
 * /api/booth-admin/booth/{boothId}:
 *   delete:
 *     summary: Delete booth admin details
 *     tags: [Booth Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: boothId
 *         schema:
 *           type: string
 *         required: true
 *         description: Booth ID
 *     responses:
 *       200:
 *         description: Booth admin details deleted successfully
 *       404:
 *         description: Booth admin details not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/booth/:boothId', protect, authorize('master', 'district'), boothAdminController.deleteBoothAdmin);

module.exports = router;