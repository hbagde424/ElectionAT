const express = require('express');
const {
  getPotentialCandidates,
  getPotentialCandidate,
  createPotentialCandidate,
  updatePotentialCandidate,
  deletePotentialCandidate,
  getPotentialCandidatesByConstituency,
  getPotentialCandidatesByParty
} = require('../controllers/potentialCandidateController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Potential Candidates
 *   description: Potential candidate management
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
 *         description: Search term for candidate names, history, pros, cons or post details
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, under_review]
 *         description: Filter by status
 *       - in: query
 *         name: party
 *         schema:
 *           type: string
 *         description: Filter by party ID
 *       - in: query
 *         name: constituency
 *         schema:
 *           type: string
 *         description: Filter by constituency ID
 *       - in: query
 *         name: election_year
 *         schema:
 *           type: string
 *         description: Filter by election year ID
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
router.post('/', protect, createPotentialCandidate);

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
router.put('/:id', protect, updatePotentialCandidate);

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
router.delete('/:id', protect, authorize('admin', 'superAdmin'), deletePotentialCandidate);

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
 *       404:
 *         description: Constituency not found
 */
router.get('/constituency/:constituencyId', getPotentialCandidatesByConstituency);

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
 *       404:
 *         description: Party not found
 */
router.get('/party/:partyId', getPotentialCandidatesByParty);

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
 *         - post_details.postname
 *         - post_details.from_date
 *         - post_details.to_date
 *         - post_details.place
 *         - election_year_id
 *         - created_by
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the potential candidate
 *         party_id:
 *           type: string
 *           description: Reference to Party
 *         constituency_id:
 *           type: string
 *           description: Reference to Assembly (constituency)
 *         history:
 *           type: string
 *           description: Background history of the candidate
 *         post_details:
 *           type: object
 *           properties:
 *             postname:
 *               type: string
 *               description: Name of the post held
 *             from_date:
 *               type: string
 *               format: date
 *               description: Start date of the post
 *             to_date:
 *               type: string
 *               format: date
 *               description: End date of the post
 *             place:
 *               type: string
 *               description: Location/place of the post
 *         pros:
 *           type: string
 *           description: Positive aspects/advantages of the candidate
 *         cons:
 *           type: string
 *           description: Negative aspects/disadvantages of the candidate
 *         election_year_id:
 *           type: string
 *           description: Reference to ElectionYear
 *         supporter_candidates:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of supporting candidate references
 *         image:
 *           type: string
 *           description: URL to candidate's image
 *         status:
 *           type: string
 *           enum: [active, inactive, under_review]
 *           description: Current status of the potential candidate
 *         created_by:
 *           type: string
 *           description: Reference to User who created the record
 *         updated_by:
 *           type: string
 *           description: Reference to User who last updated the record
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */

module.exports = router;