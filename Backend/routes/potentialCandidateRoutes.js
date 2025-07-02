const express = require('express');
const {
  getPotentialCandidates,
  getPotentialCandidate,
  createPotentialCandidate,
  updatePotentialCandidate,
  deletePotentialCandidate,
  getPotentialCandidatesByParty,
  getPotentialCandidatesByConstituency
} = require('../controllers/potentialCandidateController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Potential Candidates
 *   description: Potential election candidate management
 */

/**
 * @swagger
 * /api/potential-candidates:
 *   get:
 *     summary: Get all potential candidates
 *     tags: [Potential Candidates]
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
 *         description: Search term for candidate details
 *       - in: query
 *         name: party_id
 *         schema:
 *           type: string
 *         description: Party ID to filter by
 *       - in: query
 *         name: constituency_id
 *         schema:
 *           type: string
 *         description: Constituency ID to filter by
 *       - in: query
 *         name: election_year_id
 *         schema:
 *           type: string
 *         description: Election year ID to filter by
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, under_review]
 *         description: Status to filter by
 *     responses:
 *       200:
 *         description: List of potential candidates
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
 *                     $ref: '#/components/schemas/PotentialCandidate'
 */
router.get('/', getPotentialCandidates);

/**
 * @swagger
 * /api/potential-candidates/{id}:
 *   get:
 *     summary: Get single potential candidate
 *     tags: [Potential Candidates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Potential candidate data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PotentialCandidate'
 *       404:
 *         description: Potential candidate not found
 */
router.get('/:id', getPotentialCandidate);

/**
 * @swagger
 * /api/potential-candidates:
 *   post:
 *     summary: Create new potential candidate
 *     tags: [Potential Candidates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PotentialCandidate'
 *     responses:
 *       201:
 *         description: Potential candidate created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
router.post('/', protect, authorize('superAdmin'), createPotentialCandidate);

/**
 * @swagger
 * /api/potential-candidates/{id}:
 *   put:
 *     summary: Update potential candidate
 *     tags: [Potential Candidates]
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
 *             $ref: '#/components/schemas/PotentialCandidate'
 *     responses:
 *       200:
 *         description: Potential candidate updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Potential candidate not found
 */
router.put('/:id', protect, authorize('superAdmin'), updatePotentialCandidate);

/**
 * @swagger
 * /api/potential-candidates/{id}:
 *   delete:
 *     summary: Delete potential candidate
 *     tags: [Potential Candidates]
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
 *         description: Potential candidate deleted
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Potential candidate not found
 */
router.delete('/:id', protect, authorize('superAdmin'), deletePotentialCandidate);

/**
 * @swagger
 * /api/potential-candidates/party/{partyId}:
 *   get:
 *     summary: Get potential candidates by party
 *     tags: [Potential Candidates]
 *     parameters:
 *       - in: path
 *         name: partyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of potential candidates for the party
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
 *                     $ref: '#/components/schemas/PotentialCandidate'
 */
router.get('/party/:partyId', getPotentialCandidatesByParty);

/**
 * @swagger
 * /api/potential-candidates/constituency/{constituencyId}:
 *   get:
 *     summary: Get potential candidates by constituency
 *     tags: [Potential Candidates]
 *     parameters:
 *       - in: path
 *         name: constituencyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of potential candidates for the constituency
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
 *                     $ref: '#/components/schemas/PotentialCandidate'
 */
router.get('/constituency/:constituencyId', getPotentialCandidatesByConstituency);

/**
 * @swagger
 * components:
 *   schemas:
 *     PotentialCandidate:
 *       type: object
 *       required:
 *         - name
 *         - party_id
 *         - constituency_id
 *         - election_year_id
 *         - created_by
 *       properties:
 *         name:
 *           type: string
 *           description: Candidate name
 *           example: "John Doe"
 *         party_id:
 *           type: string
 *           description: Reference to Party
 *           example: "507f1f77bcf86cd799439011"
 *         constituency_id:
 *           type: string
 *           description: Reference to Constituency
 *           example: "507f1f77bcf86cd799439012"
 *         history:
 *           type: string
 *           description: Candidate background and history
 *           example: "Former mayor with 10 years of experience"
 *         post_details:
 *           type: object
 *           properties:
 *             postname:
 *               type: string
 *               example: "Mayor"
 *             from_date:
 *               type: string
 *               format: date
 *               example: "2015-01-01"
 *             to_date:
 *               type: string
 *               format: date
 *               example: "2020-01-01"
 *             place:
 *               type: string
 *               example: "New York City"
 *         pros:
 *           type: string
 *           description: Strengths of the candidate
 *           example: "Strong public speaker, popular among youth"
 *         cons:
 *           type: string
 *           description: Weaknesses of the candidate
 *           example: "Limited superAdministrative experience"
 *         election_year_id:
 *           type: string
 *           description: Reference to Election Year
 *           example: "507f1f77bcf86cd799439013"
 *         supporter_candidates:
 *           type: array
 *           items:
 *             type: string
 *           description: References to supporting candidates
 *           example: ["507f1f77bcf86cd799439014", "507f1f77bcf86cd799439015"]
 *         image:
 *           type: string
 *           description: URL to candidate image
 *           example: "https://example.com/images/john-doe.jpg"
 *         status:
 *           type: string
 *           enum: [active, inactive, under_review]
 *           description: Candidate status
 *           example: "active"
 *         created_by:
 *           type: string
 *           description: Reference to User who created this record
 *           example: "507f1f77bcf86cd799439016"
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