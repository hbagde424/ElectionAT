const express = require('express');
const {
  getBoothSurveys,
  getBoothSurvey,
  createBoothSurvey,
  updateBoothSurvey,
  deleteBoothSurvey,
  getSurveysByBooth,
  getSurveysBySurveyor,
  getSurveysByState
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for remarks or poll results
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status (Pending, In Progress, Completed, Verified, Rejected)
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: State ID to filter by
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
 *         name: surveyor
 *         schema:
 *           type: string
 *         description: Surveyor ID to filter by
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for date range filter
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for date range filter
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
router.get('/', getBoothSurveys);

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
 *         description: Booth survey not found
 */
router.get('/:id', getBoothSurvey);

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
 *         description: Booth survey created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
router.post('/', protect, authorize('admin', 'surveyor'), createBoothSurvey);

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
 *         description: Booth survey updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Booth survey not found
 */
router.put('/:id', protect, authorize('admin', 'surveyor'), updateBoothSurvey);

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
 *         description: Booth survey deleted
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Booth survey not found
 */
router.delete('/:id', protect, authorize('admin'), deleteBoothSurvey);

/**
 * @swagger
 * /api/booth-surveys/booth/{boothId}:
 *   get:
 *     summary: Get surveys by booth
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
router.get('/booth/:boothId', getSurveysByBooth);

/**
 * @swagger
 * /api/booth-surveys/surveyor/{surveyorId}:
 *   get:
 *     summary: Get surveys by surveyor
 *     tags: [Booth Surveys]
 *     parameters:
 *       - in: path
 *         name: surveyorId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of surveys by the surveyor
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
router.get('/surveyor/:surveyorId', getSurveysBySurveyor);

/**
 * @swagger
 * /api/booth-surveys/state/{stateId}:
 *   get:
 *     summary: Get surveys by state
 *     tags: [Booth Surveys]
 *     parameters:
 *       - in: path
 *         name: stateId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of surveys in the state
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
 *         description: State not found
 */
router.get('/state/:stateId', getSurveysByState);

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
 *         - state_id
 *         - division_id
 *         - parliament_id
 *         - assembly_id
 *         - block_id
 *         - created_by
 *       properties:
 *         booth_id:
 *           type: string
 *           description: Reference to Booth
 *           example: "507f1f77bcf86cd799439011"
 *         survey_done_by:
 *           type: string
 *           description: Reference to User who conducted the survey
 *           example: "507f1f77bcf86cd799439022"
 *         survey_date:
 *           type: string
 *           format: date-time
 *           description: Date when survey was conducted
 *         status:
 *           type: string
 *           enum: [Pending, In Progress, Completed, Verified, Rejected]
 *           description: Current status of the survey
 *           example: "Completed"
 *         remark:
 *           type: string
 *           description: Additional remarks about the survey
 *           example: "Survey completed with 100 responses"
 *         poll_result:
 *           type: string
 *           description: Summary of poll results
 *           example: "Party A: 45%, Party B: 40%, Others: 15%"
 *         state_id:
 *           type: string
 *           description: Reference to State
 *           example: "507f1f77bcf86cd799439016"
 *         division_id:
 *           type: string
 *           description: Reference to Division
 *           example: "507f1f77bcf86cd799439015"
 *         parliament_id:
 *           type: string
 *           description: Reference to Parliament
 *           example: "507f1f77bcf86cd799439013"
 *         assembly_id:
 *           type: string
 *           description: Reference to Assembly
 *           example: "507f1f77bcf86cd799439012"
 *         block_id:
 *           type: string
 *           description: Reference to Block
 *           example: "507f1f77bcf86cd799439011"
 *         created_by:
 *           type: string
 *           description: Reference to User who created the record
 *           example: "507f1f77bcf86cd799439022"
 *         updated_by:
 *           type: string
 *           description: Reference to User who last updated the record
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