const Candidate = require('../models/Candidate');
const Party = require('../models/party');
const Assembly = require('../models/assembly');
const Parliament = require('../models/parliament');
const State = require('../models/state');
const Division = require('../models/division');
const ElectionYear = require('../models/electionYear');

// @desc    Get all candidates
// @route   GET /api/candidates
// @access  Public
exports.getCandidates = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Basic query
    let query = Candidate.find({ is_active: true })
      .populate('party_id', 'name symbol')
      .populate('assembly_id', 'name')
      .populate('parliament_id', 'name')
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('election_year', 'year')
      .populate('created_by', 'username')
      .populate('updated_by', 'username')
      .sort({ name: 1 });

    // Search functionality
    if (req.query.search) {
      query = query.find({
        $or: [
          { name: { $regex: req.query.search, $options: 'i' } },
          { caste: { $regex: req.query.search, $options: 'i' } }
        ]
      });
    }

    // Filter by party
    if (req.query.party) {
      query = query.where('party_id').equals(req.query.party);
    }

    // Filter by assembly
    if (req.query.assembly) {
      query = query.where('assembly_id').equals(req.query.assembly);
    }

    // Filter by parliament
    if (req.query.parliament) {
      query = query.where('parliament_id').equals(req.query.parliament);
    }

    // Filter by state
    if (req.query.state) {
      query = query.where('state_id').equals(req.query.state);
    }

    // Filter by division
    if (req.query.division) {
      query = query.where('division_id').equals(req.query.division);
    }

    // Filter by election year
    if (req.query.election_year) {
      query = query.where('election_year').equals(req.query.election_year);
    }

    // Filter by caste
    if (req.query.caste) {
      query = query.where('caste').equals(req.query.caste);
    }

    const candidates = await query.skip(skip).limit(limit).exec();
    const total = await Candidate.countDocuments(query.getFilter());

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

// @desc    Get single candidate
// @route   GET /api/candidates/:id
// @access  Public
exports.getCandidate = async (req, res, next) => {
  try {
    const candidate = await Candidate.findById(req.params.id)
      .populate('party_id', 'name symbol')
      .populate('assembly_id', 'name')
      .populate('parliament_id', 'name')
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('election_year', 'year')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
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

// @desc    Create candidate
// @route   POST /api/candidates
// @access  Private (Admin only)
exports.createCandidate = async (req, res, next) => {
  try {
    // Verify all references exist
    const [
      party,
      assembly,
      parliament,
      state,
      division,
      electionYear
    ] = await Promise.all([
      Party.findById(req.body.party_id),
      Assembly.findById(req.body.assembly_id),
      Parliament.findById(req.body.parliament_id),
      State.findById(req.body.state_id),
      Division.findById(req.body.division_id),
      ElectionYear.findById(req.body.election_year)
    ]);

    // Check reference existence
    const missingRefs = [];
    if (!party) missingRefs.push('Party');
    if (!assembly) missingRefs.push('Assembly');
    if (!parliament) missingRefs.push('Parliament');
    if (!state) missingRefs.push('State');
    if (!division) missingRefs.push('Division');
    if (!electionYear) missingRefs.push('Election Year');
    
    if (missingRefs.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `${missingRefs.join(', ')} not found` 
      });
    }

    // Check if user exists in request
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }

    // Check for existing candidate with same name, party, and election year
    const existingCandidate = await Candidate.findOne({
      name: req.body.name,
      party_id: req.body.party_id,
      election_year: req.body.election_year
    });

    if (existingCandidate) {
      return res.status(409).json({
        success: false,
        message: 'Candidate with this name, party, and election year already exists'
      });
    }

    const candidateData = {
      ...req.body,
      created_by: req.user.id
    };

    const candidate = await Candidate.create(candidateData);

    res.status(201).json({
      success: true,
      data: candidate
    });
  } catch (err) {
    // Fallback error handling
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate candidate detected. A candidate with this name, party, and election year already exists.'
      });
    }
    next(err);
  }
};

// @desc    Update candidate
// @route   PUT /api/candidates/:id
// @access  Private (Admin only)
exports.updateCandidate = async (req, res, next) => {
  try {
    let candidate = await Candidate.findById(req.params.id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    // Verify all references exist if being updated
    const verificationPromises = [];
    if (req.body.party_id) verificationPromises.push(Party.findById(req.body.party_id));
    if (req.body.assembly_id) verificationPromises.push(Assembly.findById(req.body.assembly_id));
    if (req.body.parliament_id) verificationPromises.push(Parliament.findById(req.body.parliament_id));
    if (req.body.state_id) verificationPromises.push(State.findById(req.body.state_id));
    if (req.body.division_id) verificationPromises.push(Division.findById(req.body.division_id));
    if (req.body.election_year) verificationPromises.push(ElectionYear.findById(req.body.election_year));

    const verificationResults = await Promise.all(verificationPromises);
    
    for (const result of verificationResults) {
      if (!result) {
        return res.status(400).json({
          success: false,
          message: `${result.modelName} not found`
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

    candidate = await Candidate.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('party_id', 'name symbol')
      .populate('assembly_id', 'name')
      .populate('parliament_id', 'name')
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('election_year', 'year')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    res.status(200).json({
      success: true,
      data: candidate
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Candidate with this name and party already exists'
      });
    }
    next(err);
  }
};

// @desc    Delete candidate (soft delete)
// @route   DELETE /api/candidates/:id
// @access  Private (Admin only)
exports.deleteCandidate = async (req, res, next) => {
  try {
    const candidate = await Candidate.findById(req.params.id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    // Soft delete by setting is_active to false
    candidate.is_active = false;
    candidate.updated_by = req.user.id;
    candidate.updated_at = new Date();
    await candidate.save();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get candidates by party
// @route   GET /api/candidates/party/:partyId
// @access  Public
exports.getCandidatesByParty = async (req, res, next) => {
  try {
    // Verify party exists
    const party = await Party.findById(req.params.partyId);
    if (!party) {
      return res.status(404).json({
        success: false,
        message: 'Party not found'
      });
    }

    const candidates = await Candidate.find({ 
      party_id: req.params.partyId,
      is_active: true 
    })
      .sort({ name: 1 })
      .populate('assembly_id', 'name')
      .populate('parliament_id', 'name')
      .populate('state_id', 'name')
      .populate('election_year', 'year');

    res.status(200).json({
      success: true,
      count: candidates.length,
      data: candidates
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get candidates by election year
// @route   GET /api/candidates/year/:yearId
// @access  Public
exports.getCandidatesByYear = async (req, res, next) => {
  try {
    // Verify election year exists
    const year = await ElectionYear.findById(req.params.yearId);
    if (!year) {
      return res.status(404).json({
        success: false,
        message: 'Election year not found'
      });
    }

    const candidates = await Candidate.find({ 
      election_year: req.params.yearId,
      is_active: true 
    })
      .sort({ name: 1 })
      .populate('party_id', 'name symbol')
      .populate('assembly_id', 'name')
      .populate('parliament_id', 'name');

    res.status(200).json({
      success: true,
      count: candidates.length,
      data: candidates
    });
  } catch (err) {
    next(err);
  }
};