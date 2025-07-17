const PotentialCandidate = require('../models/PotentialCandidate');
const Party = require('../models/party');
const Assembly = require('../models/assembly');
const ElectionYear = require('../models/electionYear');
const Candidate = require('../models/Candidate');
const User = require('../models/User');

// @desc    Get all potential candidates
// @route   GET /api/potential-candidates
// @access  Public
exports.getPotentialCandidates = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Base query with population
    let query = PotentialCandidate.find()
      .populate('party_id', 'name')
      .populate('constituency_id', 'name')
      .populate('election_year_id', 'year')
      .populate('supporter_candidates', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username')
      .sort({ name: 1 });

    // Search functionality
    if (req.query.search) {
      query = query.find({
        $or: [
          { name: { $regex: req.query.search, $options: 'i' } },
          { history: { $regex: req.query.search, $options: 'i' } },
          { pros: { $regex: req.query.search, $options: 'i' } },
          { cons: { $regex: req.query.search, $options: 'i' } },
          { 'post_details.postname': { $regex: req.query.search, $options: 'i' } }
        ]
      });
    }

    // Filter by status
    if (req.query.status) {
      query = query.where('status').equals(req.query.status);
    }

    // Filter by party
    if (req.query.party) {
      query = query.where('party_id').equals(req.query.party);
    }

    // Filter by constituency
    if (req.query.constituency) {
      query = query.where('constituency_id').equals(req.query.constituency);
    }

    // Filter by election year
    if (req.query.election_year) {
      query = query.where('election_year_id').equals(req.query.election_year);
    }

    const candidates = await query.skip(skip).limit(limit).exec();
    const total = await PotentialCandidate.countDocuments(query.getFilter());

    res.status(200).json({
      success: true,
      count: candidates.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: candidates
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single potential candidate
// @route   GET /api/potential-candidates/:id
// @access  Public
exports.getPotentialCandidate = async (req, res, next) => {
  try {
    const candidate = await PotentialCandidate.findById(req.params.id)
      .populate('party_id', 'name symbol')
      .populate('constituency_id', 'name')
      .populate('election_year_id', 'year')
      .populate('supporter_candidates', 'name image')
      .populate('created_by', 'username email')
      .populate('updated_by', 'username email');

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Potential candidate not found'
      });
    }

    res.status(200).json({
      success: true,
      data: candidate
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create potential candidate
// @route   POST /api/potential-candidates
// @access  Private
exports.createPotentialCandidate = async (req, res, next) => {
  try {
    // Verify all references exist
    const [
      party,
      constituency,
      electionYear,
      supporters
    ] = await Promise.all([
      Party.findById(req.body.party_id),
      Assembly.findById(req.body.constituency_id),
      ElectionYear.findById(req.body.election_year_id),
      req.body.supporter_candidates && req.body.supporter_candidates.length > 0 ? 
        Candidate.find({ _id: { $in: req.body.supporter_candidates } }) : 
        Promise.resolve([])
    ]);

    if (!party) return res.status(400).json({ success: false, message: 'Party not found' });
    if (!constituency) return res.status(400).json({ success: false, message: 'Constituency not found' });
    if (!electionYear) return res.status(400).json({ success: false, message: 'Election year not found' });
    if (req.body.supporter_candidates && supporters.length !== req.body.supporter_candidates.length) {
      return res.status(400).json({ success: false, message: 'One or more supporter candidates not found' });
    }

    // Set created_by to current user
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }

    const candidateData = {
      ...req.body,
      created_by: req.user.id,
      updated_by: req.user.id
    };

    const candidate = await PotentialCandidate.create(candidateData);

    res.status(201).json({
      success: true,
      data: candidate
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update potential candidate
// @route   PUT /api/potential-candidates/:id
// @access  Private
exports.updatePotentialCandidate = async (req, res, next) => {
  try {
    let candidate = await PotentialCandidate.findById(req.params.id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Potential candidate not found'
      });
    }

    // Verify references if being updated
    const verificationPromises = [];
    if (req.body.party_id) verificationPromises.push(Party.findById(req.body.party_id));
    if (req.body.constituency_id) verificationPromises.push(Assembly.findById(req.body.constituency_id));
    if (req.body.election_year_id) verificationPromises.push(ElectionYear.findById(req.body.election_year_id));
    if (req.body.supporter_candidates) {
      verificationPromises.push(
        Candidate.find({ _id: { $in: req.body.supporter_candidates } })
          .then(supporters => ({
            found: supporters.length,
            expected: req.body.supporter_candidates.length
          }))
      );
    }

    const verificationResults = await Promise.all(verificationPromises);
    
    for (const result of verificationResults) {
      if (!result || (result.found !== undefined && result.found !== result.expected)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid reference ID provided'
        });
      }
    }

    // Set updated_by to current user
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }

    req.body.updated_by = req.user.id;
    req.body.updated_at = new Date();

    candidate = await PotentialCandidate.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('party_id', 'name')
      .populate('constituency_id', 'name')
      .populate('election_year_id', 'year')
      .populate('supporter_candidates', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    res.status(200).json({
      success: true,
      data: candidate
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete potential candidate
// @route   DELETE /api/potential-candidates/:id
// @access  Private (Admin only)
exports.deletePotentialCandidate = async (req, res, next) => {
  try {
    const candidate = await PotentialCandidate.findById(req.params.id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Potential candidate not found'
      });
    }

    await candidate.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get potential candidates by constituency
// @route   GET /api/potential-candidates/constituency/:constituencyId
// @access  Public
exports.getPotentialCandidatesByConstituency = async (req, res, next) => {
  try {
    // Verify constituency exists
    const constituency = await Assembly.findById(req.params.constituencyId);
    if (!constituency) {
      return res.status(404).json({
        success: false,
        message: 'Constituency not found'
      });
    }

    const candidates = await PotentialCandidate.find({ constituency_id: req.params.constituencyId })
      .sort({ name: 1 })
      .populate('party_id', 'name symbol')
      .populate('election_year_id', 'year')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    res.status(200).json({
      success: true,
      count: candidates.length,
      data: candidates
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get potential candidates by party
// @route   GET /api/potential-candidates/party/:partyId
// @access  Public
exports.getPotentialCandidatesByParty = async (req, res, next) => {
  try {
    // Verify party exists
    const party = await Party.findById(req.params.partyId);
    if (!party) {
      return res.status(404).json({
        success: false,
        message: 'Party not found'
      });
    }

    const candidates = await PotentialCandidate.find({ party_id: req.params.partyId })
      .sort({ name: 1 })
      .populate('constituency_id', 'name')
      .populate('election_year_id', 'year')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');


    res.status(200).json({
      success: true,
      count: candidates.length,
      data: candidates
    });
  } catch (err) {
    next(err);
  }
};