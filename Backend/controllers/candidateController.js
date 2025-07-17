const Candidate = require('../models/Candidate');
const Party = require('../models/party');
const Assembly = require('../models/assembly');
const Parliament = require('../models/parliament');
const State = require('../models/state');
const Division = require('../models/division');
const ElectionYear = require('../models/electionYear');

// Helper function to populate candidate references
const populateCandidate = (query) => {
  return query
    .populate('party_id', 'name symbol')
    .populate('assembly_id', 'name')
    .populate('parliament_id', 'name')
    .populate('state_id', 'name')
    .populate('division_id', 'name')
    .populate('election_year', 'year')
    .populate('created_by', 'username')
    .populate('updated_by', 'username');
};

// @desc    Get all candidates
// @route   GET /api/candidates
// @access  Public
exports.getCandidates = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = Candidate.find();
    
    // Apply filters
    const filters = ['party', 'assembly', 'parliament', 'state', 'division', 'election_year', 'caste'];
    filters.forEach(filter => {
      if (req.query[filter]) {
        const field = filter === 'election_year' ? 'election_year' : `${filter}_id`;
        query = query.where(field).equals(req.query[filter]);
      }
    });

    // Search functionality
    if (req.query.search) {
      query = query.find({ $text: { $search: req.query.search } });
    }

    const total = await Candidate.countDocuments(query.getFilter());
    const candidates = await populateCandidate(query)
      .skip(skip)
      .limit(limit)
      .sort({ name: 1 });

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
    const candidate = await populateCandidate(Candidate.findById(req.params.id));

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
    const references = {
      party_id: Party,
      assembly_id: Assembly,
      parliament_id: Parliament,
      state_id: State,
      division_id: Division,
      election_year: ElectionYear
    };

    for (const [field, Model] of Object.entries(references)) {
      if (!await Model.findById(req.body[field])) {
        return res.status(400).json({ 
          success: false, 
          message: `${Model.modelName} not found`,
          field
        });
      }
    }

    // Check for existing candidate with same unique combination
    const existingCandidate = await Candidate.findOne({
      assembly_id: req.body.assembly_id,
      parliament_id: req.body.parliament_id,
      election_year: req.body.election_year,
      party_id: req.body.party_id
    });

    if (existingCandidate) {
      return res.status(409).json({
        success: false,
        message: 'Candidate with these details already exists',
        conflict: {
          assembly_id: existingCandidate.assembly_id,
          parliament_id: existingCandidate.parliament_id,
          election_year: existingCandidate.election_year,
          party_id: existingCandidate.party_id
        },
        existingCandidateId: existingCandidate._id
      });
    }

    // Check user authentication
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }

    const candidateData = {
      ...req.body,
      created_by: req.user.id
    };

    const candidate = await Candidate.create(candidateData);
    const populatedCandidate = await populateCandidate(Candidate.findById(candidate._id));

    res.status(201).json({
      success: true,
      data: populatedCandidate
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate candidate detected',
        error: err.keyValue
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
    const references = {
      party_id: Party,
      assembly_id: Assembly,
      parliament_id: Parliament,
      state_id: State,
      division_id: Division,
      election_year: ElectionYear
    };

    for (const [field, Model] of Object.entries(references)) {
      if (req.body[field] && !await Model.findById(req.body[field])) {
        return res.status(400).json({ 
          success: false, 
          message: `${Model.modelName} not found`,
          field
        });
      }
    }

    // Check for duplicate candidates if unique fields are being updated
    if (req.body.assembly_id || req.body.parliament_id || 
        req.body.election_year || req.body.party_id) {
      
      const duplicateCheck = {
        assembly_id: req.body.assembly_id || candidate.assembly_id,
        parliament_id: req.body.parliament_id || candidate.parliament_id,
        election_year: req.body.election_year || candidate.election_year,
        party_id: req.body.party_id || candidate.party_id
      };

      const existing = await Candidate.findOne({
        ...duplicateCheck,
        _id: { $ne: candidate._id }
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Another candidate already exists with these details',
          conflict: duplicateCheck,
          existingCandidateId: existing._id
        });
      }
    }

    // Set updated_by to current user
    if (req.user?.id) {
      req.body.updated_by = req.user.id;
    }
    req.body.updated_at = new Date();

    candidate = await populateCandidate(
      Candidate.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
      })
    );

    res.status(200).json({
      success: true,
      data: candidate
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate candidate detected',
        error: err.keyValue
      });
    }
    next(err);
  }
};

// @desc    Delete candidate
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

    await candidate.deleteOne();

    res.status(200).json({
      success: true,
      data: { id: req.params.id }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get candidates by assembly
// @route   GET /api/candidates/assembly/:assemblyId
// @access  Public
exports.getCandidatesByAssembly = async (req, res, next) => {
  try {
    if (!await Assembly.findById(req.params.assemblyId)) {
      return res.status(404).json({
        success: false,
        message: 'Assembly not found'
      });
    }

    const candidates = await populateCandidate(
      Candidate.find({ assembly_id: req.params.assemblyId })
    ).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: candidates.length,
      data: candidates
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
    if (!await Party.findById(req.params.partyId)) {
      return res.status(404).json({
        success: false,
        message: 'Party not found'
      });
    }

    const candidates = await populateCandidate(
      Candidate.find({ party_id: req.params.partyId })
    ).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: candidates.length,
      data: candidates
    });
  } catch (err) {
    next(err);
  }
};