


const express = require('express');
const router = express.Router();
const controller = require('../controllers/winningCandidateController');
const { protect, authorize } = require('../middlewares/auth');

// Simple middleware to validate parameters
const validateParam = (param) => {
  return typeof param === 'string' && /^[a-zA-Z0-9-_]+$/.test(param);
};
// Basic CRUD operations
router.get('/', controller.getWinningCandidates);
router.post('/', protect, authorize('superAdmin'), controller.createWinningCandidate);

// Graph and stats routes
router.get('/graph', controller.getWinningCandidatesForGraph);
router.get('/party-assembly-count', controller.getPartyAssemblyCountByYear);
router.get('/party-assembly-predictions', controller.getPredictedPartyAssemblyCount2028);

// Prediction routes
router.get('/predict', (req, res, next) => {
  req.query.year = req.query.year || '2028';
  controller.predictWinningPartyForNextYear(req, res, next);
});

// Assembly routes
router.get('/assembly-by-year', (req, res, next) => {
  const { assembly, year } = req.query;
  if (!assembly || !year) {
    return res.status(400).json({
      success: false,
      message: 'Assembly and year parameters are required'
    });
  }
  req.params = { assemblyId: assembly, yearId: year };
  controller.getCandidatesByAssemblyAndYear(req, res, next);
});

// Routes with URL parameters
router.get('/assembly/:assemblyId', (req, res, next) => {
  if (!validateParam(req.params.assemblyId)) {
    return res.status(400).json({ success: false, message: 'Invalid assembly ID' });
  }
  controller.getWinningCandidatesByAssembly(req, res, next);
});

router.get('/parliament/:parliamentId', (req, res, next) => {
  if (!validateParam(req.params.parliamentId)) {
    return res.status(400).json({ success: false, message: 'Invalid parliament ID' });
  }
  controller.getWinningCandidatesByParliament(req, res, next);
});

router.get('/party/:partyId', (req, res, next) => {
  if (!validateParam(req.params.partyId)) {
    return res.status(400).json({ success: false, message: 'Invalid party ID' });
  }
  controller.getWinningCandidatesByParty(req, res, next);
});

// Individual candidate routes with ID parameter
router.get('/:id', (req, res, next) => {
  if (!validateParam(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid candidate ID' });
  }
  controller.getWinningCandidate(req, res, next);
});

router.put('/:id', protect, authorize('superAdmin'), (req, res, next) => {
  if (!validateParam(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid candidate ID' });
  }
  controller.updateWinningCandidate(req, res, next);
});

router.delete('/:id', protect, authorize('superAdmin'), (req, res, next) => {
  if (!validateParam(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid candidate ID' });
  }
  controller.deleteWinningCandidate(req, res, next);
});

module.exports = router;

// Graph and prediction routes
router.get('/graph', getWinningCandidatesForGraph);
router.get('/party-assembly-predictions', getPredictedPartyAssemblyCount2028);
router.get('/predict', (req, res, next) => {
  req.query.year = req.query.year || '2028';
  predictWinningPartyForNextYear(req, res, next);
});

// Assembly routes
router.get('/assembly-by-year', (req, res, next) => {
  const { assembly, year } = req.query;
  if (!assembly || !year) {
    return res.status(400).json({
      success: false,
      message: 'Assembly and year parameters are required'
    });
  }
  req.params = { assemblyId: assembly, yearId: year };
  getCandidatesByAssemblyAndYear(req, res, next);
});

router.get('/assembly/:assemblyId', validateParams, getWinningCandidatesByAssembly);
router.get('/party/:partyId', validateParams, getWinningCandidatesByParty);

// Individual candidate routes
router.route('/:id')
  .all(validateParams)
  .get(getWinningCandidate)
  .put(protect, authorize('superAdmin'), updateWinningCandidate)
  .delete(protect, authorize('superAdmin'), deleteWinningCandidate);

module.exports = router;

/**
 * @swaggersemblyAndYear,
  getPartyAssemblyCountByYear,
  predictWinningPartyForNextYear,
  getPredictedPartyAssemblyCount2028
} = require('../controllers/winningCandidateController');
const { protect, authorize } = require('../middlewares/auth');

// Create router with options to prevent path-to-regexp issues
const router = express.Router({ 
  strict: true,
  caseSensitive: true
});

// Middleware to validate ID parameters
const validateId = (req, res, next) => {
  const id = req.params.id;
  if (!id || !/^[a-zA-Z0-9-_]+$/.test(id)) {
    return res.status(400).json({ success: false, message: 'Invalid ID format' });
  }
  next();
};

// Middleware to validate assembly ID parameters
const validateAssemblyId = (req, res, next) => {
  const assemblyId = req.params.assemblyId;
  if (!assemblyId || !/^[a-zA-Z0-9-_]+$/.test(assemblyId)) {
    return res.status(400).json({ success: false, message: 'Invalid assembly ID format' });
  }
  next();
};
// No routeHelpers needed, using standard Express routing

// Initialize router with parameter checking
router.param('id', (req, res, next, id) => {
  if (!id || !/^[a-zA-Z0-9-_]+$/.test(id)) {
    return res.status(400).json({ success: false, message: 'Invalid ID format' });
  }
  next();
});

/**
 * @swagger
 * tags:
 *   name: WinningCandidates
 *   description: API for managing winning election candidates
 */

/**
 * @swagger
 * /api/winning-candidates:
 *   get:
 *     summary: Get all winning candidates
 *     tags: [WinningCandidates]
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
 *         description: Search term for candidate or party names
 *       - in: query
 *         name: assembly
 *         schema:
 *           type: string
 *         description: Filter by assembly ID
 *       - in: query
 *         name: parliament
 *         schema:
 *           type: string
 *         description: Filter by parliament ID
 *       - in: query
 *         name: party
 *         schema:
 *           type: string
 *         description: Filter by party ID
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: Filter by state ID
 *       - in: query
 *         name: division
 *         schema:
 *           type: string
 *         description: Filter by division ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [General, Bye, Midterm, Special]
 *         description: Filter by election type
 *       - in: query
 *         name: all
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Set to 'true' to get all records without pagination
 *     responses:
 *       200:
 *         description: Successful response
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
 *                     $ref: '#/components/schemas/WinningCandidate'
 */
router.get('/', winningCandidateController.getWinningCandidates);

/**
 * @swagger
 * /api/winning-candidates/predicted-party-assembly-count:
 *   get:
 *     summary: Get predicted number of assemblies won by each party for 2028
 *     tags: [WinningCandidates]
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 year:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       party_id:
 *                         type: string
 *                       party_name:
 *                         type: string
 *                       party_symbol:
 *                         type: string
 *                       party_color:
 *                         type: string
 *                       assembly_count:
 *                         type: integer
 */
router.get('/party-assembly-predictions', require('../controllers/winningCandidateController').getPredictedPartyAssemblyCount2028);


/**
 * @swagger
 * /api/winning-candidates/predict/2028:
 *   get:
 *     summary: Predict winning party for each assembly for 2028 based on historical data
 *     tags: [WinningCandidates]
 *     responses:
 *       200:
 *         description: Successful prediction
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 year:
 *                   type: integer
 *                 total_assemblies:
 *                   type: integer
 *                 predictions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       assembly_id:
 *                         type: string
 *                       assembly_name:
 *                         type: string
 *                       assembly_no:
 *                         type: string
 *                       predicted_party:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           symbol:
 *                             type: string
 *                           color:
 *                             type: string
 *                       win_count:
 *                         type: integer
 */
// Use a query parameter instead of hardcoded year
router.get('/predict', (req, res, next) => {
  // Default to 2028 if no year provided
  req.query.year = req.query.year || '2028';
  require('../controllers/winningCandidateController').predictWinningPartyForNextYear(req, res, next);
});

/**
 * @swagger
 * /api/winning-candidates/party-assembly-count:
 *   get:
 *     summary: Get number of assemblies won by each party for a given year
 *     tags: [WinningCandidates]
 *     parameters:
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: string
 *         description: Election year ID
 *     responses:
 *       200:
 *         description: Successful response
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
 *                     type: object
 *                     properties:
 *                       party_id:
 *                         type: string
 *                       party_name:
 *                         type: string
 *                       party_symbol:
 *                         type: string
 *                       assembly_count:
 *                         type: integer
 */
router.get('/party-assembly-count', getPartyAssemblyCountByYear);

/**
 * @swagger
 * /api/winning-candidates/graph:
 *   get:
 *     summary: Get winning candidates data for visualization
 *     tags: [WinningCandidates]
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: string
 *         description: Filter by election year
 *     responses:
 *       200:
 *         description: Successful response
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
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/WinningCandidate'
 */
router.get('/graph', getWinningCandidatesForGraph);

/**
 * @swagger
 * /api/winning-candidates/{id}:
 *   get:
 *     summary: Get a single winning candidate
 *     tags: [WinningCandidates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Winning candidate ID
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/WinningCandidate'
 *       404:
 *         description: Winning candidate not found
 */
router.get('/:id', getWinningCandidate);

/**
 * @swagger
 * /api/winning-candidates:
 *   post:
 *     summary: Create a new winning candidate
 *     tags: [WinningCandidates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WinningCandidate'
 *     responses:
 *       201:
 *         description: Winning candidate created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/WinningCandidate'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */
router.post('/', protect, authorize('superAdmin'), createWinningCandidate);

/**
 * @swagger
 * /api/winning-candidates/{id}:
 *   put:
 *     summary: Update a winning candidate
 *     tags: [WinningCandidates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Winning candidate ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WinningCandidate'
 *     responses:
 *       200:
 *         description: Winning candidate updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/WinningCandidate'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Winning candidate not found
 */
router.put('/:id', protect, authorize('superAdmin'), updateWinningCandidate);

/**
 * @swagger
 * /api/winning-candidates/{id}:
 *   delete:
 *     summary: Delete a winning candidate
 *     tags: [WinningCandidates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Winning candidate ID
 *     responses:
 *       200:
 *         description: Winning candidate deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Winning candidate not found
 */
router.delete('/:id', protect, authorize('superAdmin'), deleteWinningCandidate);

/**
 * @swagger
 * /api/winning-candidates/assembly/{assemblyId}:
 *   get:
 *     summary: Get winning candidates by assembly
 *     tags: [WinningCandidates]
 *     parameters:
 *       - in: path
 *         name: assemblyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Assembly ID
 *     responses:
 *       200:
 *         description: Successful response
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
 *                     $ref: '#/components/schemas/WinningCandidate'
 *       404:
 *         description: Assembly not found
 */
router.get('/assembly/:assemblyId', getWinningCandidatesByAssembly);

/**
 * @swagger
 * /api/winning-candidates/parliament/{parliamentId}:
 *   get:
 *     summary: Get winning candidates by parliament
 *     tags: [WinningCandidates]
 *     parameters:
 *       - in: path
 *         name: parliamentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Parliament ID
 *     responses:
 *       200:
 *         description: Successful response
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
 *                     $ref: '#/components/schemas/WinningCandidate'
 *       404:
 *         description: Parliament not found
 */
router.get('/parliament/:parliamentId', (req, res, next) => {
  const { parliamentId } = req.params;
  if (!parliamentId || typeof parliamentId !== 'string') {
    return res.status(400).json({ success: false, message: 'Invalid parliament ID' });
  }
  getWinningCandidatesByParliament(req, res, next);
});

/**
 * @swagger
 * /api/winning-candidates/party/{partyId}:
 *   get:
 *     summary: Get winning candidates by party
 *     tags: [WinningCandidates]
 *     parameters:
 *       - in: path
 *         name: partyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Party ID
 *     responses:
 *       200:
 *         description: Successful response
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
 *                     $ref: '#/components/schemas/WinningCandidate'
 *       404:
 *         description: Party not found
 */
router.get('/party/:partyId', getWinningCandidatesByParty);

/**
 * @swagger
 * /api/winning-candidates/assembly/{assemblyId}/year/{yearId}:
 *   get:
 *     summary: Get candidates by assembly and year with statistics
 *     tags: [WinningCandidates]
 *     parameters:
 *       - in: path
 *         name: assemblyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Assembly ID
 *       - in: path
 *         name: yearId
 *         required: true
 *         schema:
 *           type: string
 *         description: Election year ID
 *     responses:
 *       200:
 *         description: Successful response
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
 *                     assembly:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         ac_no:
 *                           type: string
 *                     year:
 *                       type: string
 *                     total_candidates:
 *                       type: integer
 *                     total_votes_cast:
 *                       type: integer
 *                     winner:
 *                       $ref: '#/components/schemas/WinningCandidate'
 *                     all_candidates:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           candidate_id:
 *                             type: string
 *                           candidate_name:
 *                             type: string
 *                           party_id:
 *                             type: string
 *                           party_name:
 *                             type: string
 *                           party_symbol:
 *                             type: string
 *                           votes_received:
 *                             type: number
 *                           voting_percentage:
 *                             type: string
 *                           assembly_no:
 *                             type: string
 *                           election_type:
 *                             type: array
 *                             items:
 *                               type: string
 *                           poll_percentage:
 *                             type: string
 *       404:
 *         description: Assembly, year or candidates not found
 */
router.get('/assembly-by-year', (req, res, next) => {
  // Convert query params to route params format that the controller expects
  req.params = {
    assemblyId: req.query.assembly,
    yearId: req.query.year
  };
  getCandidatesByAssemblyAndYear(req, res, next);
});

/**
 * @swagger
 * components:
 *   schemas:
 *     WinningCandidate:
 *       type: object
 *       required:
 *         - state_id
 *         - division_id
 *         - parliament_id
 *         - assembly_id
 *         - assembly_no
 *         - type
 *         - poll_percentage
 *         - party_id
 *         - candidate_id
 *         - total_electors
 *         - total_votes
 *         - voting_percentage
 *         - margin
 *         - margin_percentage
 *         - created_by
 *       properties:
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
 *         assembly_no:
 *           type: string
 *           description: Assembly number
 *           example: "AC-42"
 *         type:
 *           type: array
 *           items:
 *             type: string
 *             enum: [General, Bye, Midterm, Special]
 *           description: Type(s) of election
 *           example: ["General"]
 *         poll_percentage:
 *           type: string
 *           description: Polling percentage
 *           example: "75.25%"
 *         party_id:
 *           type: string
 *           description: Reference to Party
 *           example: "507f1f77bcf86cd799439018"
 *         candidate_id:
 *           type: string
 *           description: Reference to Candidate
 *           example: "507f1f77bcf86cd799439019"
 *         total_electors:
 *           type: string
 *           description: Total number of electors
 *           example: "50000"
 *         total_votes:
 *           type: number
 *           description: Total votes received
 *           example: 35000
 *         voting_percentage:
 *           type: string
 *           description: Voting percentage
 *           example: "70.00%"
 *         margin:
 *           type: number
 *           description: Winning margin in numbers
 *           example: 5000
 *         margin_percentage:
 *           type: string
 *           description: Winning margin percentage
 *           example: "10.00%"
 *         description:
 *           type: string
 *           description: Candidate description (HTML allowed)
 *           example: "<p>Some description about the candidate.</p>"
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