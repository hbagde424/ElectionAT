const express = require('express');
const {
  getBoothSurveys,
  getBoothSurveyById,
  createBoothSurvey,
  updateBoothSurvey,
  deleteBoothSurvey,
  getSurveysByBooth,
  getSurveysBySurveyor,
  getSurveysByStatus
} = require('../controllers/boothSurveyController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Booth Surveys
 *   description: Booth survey management
 */

/**
 * @swagger
 * /api/booth-surveys:
 *   get:
 *     summary: Get all booth surveys
 *     tags: [Booth Surveys]
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
 *         name: booth
 *         schema:
 *           type: string
 *         description: Filter by booth ID
 *       - in: query
 *         name: surveyor
 *         schema:
 *           type: string
 *         description: Filter by surveyor ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Pending, In Progress, Completed, Verified, Rejected]
 *         description: Filter by survey status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter surveys after this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter surveys before this date
 *     responses:
 *       200:
 *         description: List of booth surveys
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
 *                     $ref: '#/components/schemas/BoothSurvey'
 */
router.get('/',  getBoothSurveys);

/**
 * @swagger
 * /api/booth-surveys/{id}:
 *   get:
 *     summary: Get single booth survey
 *     tags: [Booth Surveys]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booth survey data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BoothSurvey'
 *       404:
 *         description: Survey not found
 */
router.get('/:id', protect, getBoothSurveyById);

/**
 * @swagger
 * /api/booth-surveys:
 *   post:
 *     summary: Create new booth survey
 *     tags: [Booth Surveys]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BoothSurvey'
 *     responses:
 *       201:
 *         description: Survey created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
// router.post('/', protect, authorize('surveyor', 'admin', 'editor'), createBoothSurvey);
router.post('/',createBoothSurvey);

/**
 * @swagger
 * /api/booth-surveys/{id}:
 *   put:
 *     summary: Update booth survey
 *     tags: [Booth Surveys]
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
 *             $ref: '#/components/schemas/BoothSurvey'
 *     responses:
 *       200:
 *         description: Survey updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Survey not found
 */
router.put('/:id', protect, authorize('surveyor', 'admin', 'editor'), updateBoothSurvey);

/**
 * @swagger
 * /api/booth-surveys/{id}:
 *   delete:
 *     summary: Delete booth survey
 *     tags: [Booth Surveys]
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
 *         description: Survey deleted
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Survey not found
 */
router.delete('/:id', protect, authorize('admin'), deleteBoothSurvey);

/**
 * @swagger
 * /api/booth-surveys/booth/{boothId}:
 *   get:
 *     summary: Get surveys by booth ID
 *     tags: [Booth Surveys]
 *     parameters:
 *       - in: path
 *         name: boothId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of surveys for the booth
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
 *                     $ref: '#/components/schemas/BoothSurvey'
 *       404:
 *         description: Booth not found
 */
router.get('/booth/:boothId', protect, getSurveysByBooth);

/**
 * @swagger
 * /api/booth-surveys/surveyor/{surveyorId}:
 *   get:
 *     summary: Get surveys by surveyor ID
 *     tags: [Booth Surveys]
 *     parameters:
 *       - in: path
 *         name: surveyorId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of surveys conducted by the surveyor
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
 *                     $ref: '#/components/schemas/BoothSurvey'
 *       404:
 *         description: Surveyor not found
 */
router.get('/surveyor/:surveyorId', protect, getSurveysBySurveyor);

/**
 * @swagger
 * /api/booth-surveys/status/{status}:
 *   get:
 *     summary: Get surveys by status
 *     tags: [Booth Surveys]
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [Pending, In Progress, Completed, Verified, Rejected]
 *     responses:
 *       200:
 *         description: List of surveys with specified status
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
 *                     $ref: '#/components/schemas/BoothSurvey'
 */
router.get('/status/:status', protect, getSurveysByStatus);

/**
 * @swagger
 * components:
 *   schemas:
 *     BoothSurvey:
 *       type: object
 *       required:
 *         - booth_id
 *         - survey_done_by
 *         - survey_date
 *       properties:
 *         booth_id:
 *           type: string
 *           description: Reference to Booth
 *           example: "507f1f77bcf86cd799439011"
 *         survey_done_by:
 *           type: string
 *           description: Reference to User who conducted the survey
 *           example: "507f1f77bcf86cd799439012"
 *         survey_date:
 *           type: string
 *           format: date-time
 *           description: Date when survey was conducted
 *           example: "2023-05-15T10:00:00Z"
 *         status:
 *           type: string
 *           enum: [Pending, In Progress, Completed, Verified, Rejected]
 *           description: Current status of the survey
 *           example: "Completed"
 *         remark:
 *           type: string
 *           description: Additional remarks about the survey
 *           example: "Survey completed with minor issues"
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