const express = require('express');
const {
  getVisits,
  getVisit,
  createVisit,
  updateVisit,
  deleteVisit,
  getVisitsByBooth,
  getVisitsByDateRange,
  getVisitsByStatus,
  getNearbyVisits,
  getCandidatePath,
  importVisits
} = require('../controllers/visitController');
const {
  uploadVisitDocument,
  deleteVisitDocument
} = require('../controllers/visitController');
const { protect, authorize } = require('../middlewares/auth');
const { getUserPermissionsAndHierarchy } = require('../middlewares/permissions');
const visitUpload = require('../config/visitUpload');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Visits
 *   description: Visit management
 */

// Protected: requires authentication via serviceToken
router.get('/', protect, getUserPermissionsAndHierarchy, getVisits);

// Protected: requires authentication via serviceToken
router.get('/:id', protect, getUserPermissionsAndHierarchy, getVisit);

/**
 * @swagger
 * /api/visits:
 *   get:
 *     summary: Get all visits
 *     tags: [Visits]
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
 *         description: Comprehensive search across all fields - candidate names, states, divisions, assemblies, parliaments, blocks, booths, posts, work status, dates, location names, visit agendas, speech content, remarks, and descriptions
 *       - in: query
 *         name: work_status
 *         schema:
 *           type: string
 *           enum: [announced, approved, in progress, complete]
 *         description: Filter by work status
 *       - in: query
 *         name: candidate
 *         schema:
 *           type: string
 *         description: Filter by candidate ID
 *       - in: query
 *         name: latitude
 *         schema:
 *           type: number
 *         description: Latitude for proximity search
 *       - in: query
 *         name: longitude
 *         schema:
 *           type: number
 *         description: Longitude for proximity search
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *         description: Radius in kilometers for proximity search
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: State ID or name to filter by
 *       - in: query
 *         name: division
 *         schema:
 *           type: string
 *         description: Division ID or name to filter by
 *       - in: query
 *         name: parliament
 *         schema:
 *           type: string
 *         description: Parliament ID or name to filter by
 *       - in: query
 *         name: assembly
 *         schema:
 *           type: string
 *         description: Assembly ID or name to filter by
 *       - in: query
 *         name: block
 *         schema:
 *           type: string
 *         description: Block ID or name to filter by
 *       - in: query
 *         name: booth
 *         schema:
 *           type: string
 *         description: Booth ID or name to filter by
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering (ISO format)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering (ISO format)
 *       - in: query
 *         name: all
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Set to 'true' to fetch all records without pagination
 *     responses:
 *       200:
 *         description: List of visits
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
 *                     $ref: '#/components/schemas/Visit'
 */
// Test endpoint to check if API is working
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Visits API is working',
    timestamp: new Date().toISOString(),
    query: req.query
  });
});

// Protected: requires authentication via serviceToken
router.get('/', protect, getUserPermissionsAndHierarchy, getVisits);

/**
 * @swagger
 * /api/visits/{id}:
 *   get:
 *     summary: Get single visit
 *     tags: [Visits]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Visit data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Visit'
 *       404:
 *         description: Visit not found
 */
router.get('/:id', getVisit);

/**
 * @swagger
 * /api/visits:
 *   post:
 *     summary: Create new visit
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Visit'
 *     responses:
 *       201:
 *         description: Visit created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
router.post('/', protect, authorize('admin', 'superAdmin'), createVisit);

/**
 * @swagger
 * /api/visits/import:
 *   post:
 *     summary: Import visits from Excel
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rows:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Import summary
 *       401:
 *         description: Unauthorized
 */
router.post('/import', protect, authorize('superAdmin'), importVisits);

/**
 * @swagger
 * /api/visits/{id}:
 *   put:
 *     summary: Update visit
 *     tags: [Visits]
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
 *             $ref: '#/components/schemas/Visit'
 *     responses:
 *       200:
 *         description: Visit updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Visit not found
 */
router.put('/:id', protect, authorize('admin', 'superAdmin'), updateVisit);

/**
 * @swagger
 * /api/visits/{id}:
 *   delete:
 *     summary: Delete visit
 *     tags: [Visits]
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
 *         description: Visit deleted
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Visit not found
 */
router.delete('/:id', protect, authorize('admin', 'superAdmin'), deleteVisit);

// Upload a single document to a visit (slot in body: 0..2)
router.post('/:id/documents', protect, authorize('admin', 'superAdmin'), visitUpload.single('file'), uploadVisitDocument);

// Delete a document from a visit by slot index
router.delete('/:id/documents/:slot', protect, authorize('admin', 'superAdmin'), deleteVisitDocument);

/**
 * @swagger
 * /api/visits/booth/{boothId}:
 *   get:
 *     summary: Get visits by booth
 *     tags: [Visits]
 *     parameters:
 *       - in: path
 *         name: boothId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of visits for the booth
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
 *                     $ref: '#/components/schemas/Visit'
 *       404:
 *         description: Booth not found
 */
router.get('/booth/:boothId', getVisitsByBooth);

/**
 * @swagger
 * /api/visits/status/{status}:
 *   get:
 *     summary: Get visits by work status
 *     tags: [Visits]
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [announced, approved, in progress, complete]
 *     responses:
 *       200:
 *         description: List of visits with the specified status
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
 *                     $ref: '#/components/schemas/Visit'
 */
router.get('/status/:status', getVisitsByStatus);

/**
 * @swagger
 * /api/visits/date-range:
 *   get:
 *     summary: Get visits by date range
 *     tags: [Visits]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: End date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: List of visits within the date range
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
 *                     $ref: '#/components/schemas/Visit'
 */
router.get('/date-range', getVisitsByDateRange);

/**
 * @swagger
 * /api/visits/nearby:
 *   get:
 *     summary: Get visits near a location
 *     tags: [Visits]
 *     parameters:
 *       - in: query
 *         name: longitude
 *         schema:
 *           type: number
 *         required: true
 *         description: Longitude of the center point
 *       - in: query
 *         name: latitude
 *         schema:
 *           type: number
 *         required: true
 *         description: Latitude of the center point
 *       - in: query
 *         name: maxDistance
 *         schema:
 *           type: number
 *         default: 10
 *         description: Maximum distance in kilometers from the center point
 *     responses:
 *       200:
 *         description: List of nearby visits
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
 *                     $ref: '#/components/schemas/Visit'
 */
router.get('/nearby', getNearbyVisits);

/**
 * @swagger
 * /api/visits/candidate/{candidateId}/path:
 *   get:
 *     summary: Get candidate's visit path
 *     tags: [Visits]
 *     parameters:
 *       - in: path
 *         name: candidateId
 *         required: true
 *         schema:
 *           type: string
 *         description: Candidate ID
 *     responses:
 *       200:
 *         description: Candidate's visit path as GeoJSON
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     visits:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Visit'
 *                     path:
 *                       type: object
 *                       properties:
 *                         type:
 *                           type: string
 *                         properties:
 *                           type: object
 *                         geometry:
 *                           type: object
 *                           properties:
 *                             type:
 *                               type: string
 *                             coordinates:
 *                               type: array
 *                               items:
 *                                 type: array
 *                                 items:
 *                                   type: number
 */
router.get('/candidate/:candidateId/path', getCandidatePath);

/**
 * @swagger
 * components:
 *   schemas:
 *     Visit:
 *       type: object
 *       required:
 *         - state_id
 *         - division_id
 *         - assembly_id
 *         - parliament_id
 *         - candidate_id
 *         - post
 *         - date
 *         - work_status
 *         - created_by
 *       properties:
 *         state_id:
 *           type: string
 *           description: Reference to State
 *         division_id:
 *           type: string
 *           description: Reference to Division
 *         assembly_id:
 *           type: string
 *           description: Reference to Assembly
 *         parliament_id:
 *           type: string
 *           description: Reference to Parliament
 *         block_id:
 *           type: string
 *           description: (Optional) Reference to Block
 *         booth_id:
 *           type: string
 *           description: (Optional) Reference to Booth
 *         candidate_id:
 *           type: string
 *           description: Reference to Candidate
 *         post:
 *           type: string
 *           description: Post/position of the visiting person
 *         date:
 *           type: string
 *           format: date-time
 *           description: Date of visit
 *         work_status:
 *           type: string
 *           enum: [announced, approved, in progress, complete]
 *           description: Status of the work
 *         workName:
 *           type: string
 *           description: Name of the work/project
 *         visitAgenda:
 *           type: string
 *           description: Agenda/details of the visit
 *         speechFiveLines:
 *           type: string
 *           description: Short speech content (rich HTML allowed)
 *         speechIssue:
 *           type: string
 *           description: Issue addressed in the speech (rich HTML allowed)
 *         remark:
 *           type: string
 *           description: Additional remarks
 *         announcementDate:
 *           type: string
 *           format: date-time
 *           description: Date when the work was announced
 *         completionDate:
 *           type: string
 *           format: date-time
 *           description: Date when the work was/should be completed
 *         budgetAnnouncedDate:
 *           type: string
 *           format: date-time
 *           description: Date when budget for the work was announced
 *         longitude:
 *           type: number
 *           minimum: -180
 *           maximum: 180
 *           description: Longitude coordinate of visit location
 *         latitude:
 *           type: number
 *           minimum: -90
 *           maximum: 90
 *           description: Latitude coordinate of visit location
 *         locationName:
 *           type: string
 *           description: Name of the visit location
 *         location:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *               enum: ['Point']
 *             coordinates:
 *               type: array
 *               items:
 *                 type: number
 *           description: GeoJSON Point for geospatial queries
 *         description:
 *           type: string
 *           description: Candidate description (HTML allowed)
 *           example: "<p>Some description about the candidate.</p>"
 *         created_by:
 *           type: string
 *           description: Reference to User who created
 *         updated_by:
 *           type: string
 *           description: Reference to User who last updated
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