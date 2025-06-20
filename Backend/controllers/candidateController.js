const Candidate = require('../models/Candidate');
const Party = require('../models/party');
const Assembly = require('../models/assembly'); // Assuming you have an Assembly model
const Year = require('../models/Year'); // Assuming you have a Year model

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
    let query = Candidate.find()
      .populate('party', 'name symbol')
      .populate('election_year', 'year')
      .sort({ name: 1 });

    // Search functionality
    if (req.query.search) {
      query = query.find({ $text: { $search: req.query.search } });
    }

    // Filter by assembly
    if (req.query.assembly) {
      query = query.where('assembly').equals(req.query.assembly);
    }

    // Filter by party
    if (req.query.party) {
      query = query.where('party').equals(req.query.party);
    }

    // Filter by caste
    if (req.query.caste) {
      query = query.where('caste').equals(req.query.caste);
    }

    // Filter by election year
    if (req.query.election_year) {
      query = query.where('election_year').equals(req.query.election_year);
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
      .populate('party', 'name symbol')
      .populate('election_year', 'year')
      .populate('assembly', 'name');

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
    // Verify party exists
    const party = await Party.findById(req.body.party);
    if (!party) {
      return res.status(400).json({
        success: false,
        message: 'Party not found'
      });
    }

    // Verify assembly exists
    const assembly = await Assembly.findById(req.body.assembly);
    if (!assembly) {
      return res.status(400).json({
        success: false,
        message: 'Assembly not found'
      });
    }

    // Verify election year exists
    const year = await Year.findById(req.body.election_year);
    if (!year) {
      return res.status(400).json({
        success: false,
        message: 'Election year not found'
      });
    }

    // Check for duplicate candidate (same party in same assembly for same year)
    const existingCandidate = await Candidate.findOne({
      assembly: req.body.assembly,
      election_year: req.body.election_year,
      party: req.body.party
    });

    if (existingCandidate) {
      return res.status(400).json({
        success: false,
        message: 'Candidate from this party already exists for this assembly in the specified election year'
      });
    }

    const candidate = await Candidate.create(req.body);

    res.status(201).json({
      success: true,
      data: candidate
    });
  } catch (err) {
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

    // Verify party exists if being updated
    if (req.body.party) {
      const party = await Party.findById(req.body.party);
      if (!party) {
        return res.status(400).json({
          success: false,
          message: 'Party not found'
        });
      }
    }

    // Verify assembly exists if being updated
    if (req.body.assembly) {
      const assembly = await Assembly.findById(req.body.assembly);
      if (!assembly) {
        return res.status(400).json({
          success: false,
          message: 'Assembly not found'
        });
      }
    }

    // Verify election year exists if being updated
    if (req.body.election_year) {
      const year = await Year.findById(req.body.election_year);
      if (!year) {
        return res.status(400).json({
          success: false,
          message: 'Election year not found'
        });
      }
    }

    candidate = await Candidate.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('party', 'name symbol')
      .populate('election_year', 'year')
      .populate('assembly', 'name');

    res.status(200).json({
      success: true,
      data: candidate
    });
  } catch (err) {
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

    await candidate.remove();

    res.status(200).json({
      success: true,
      data: {}
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
    // Verify assembly exists
    const assembly = await Assembly.findById(req.params.assemblyId);
    if (!assembly) {
      return res.status(404).json({
        success: false,
        message: 'Assembly not found'
      });
    }

    let query = Candidate.find({ assembly: req.params.assemblyId })
      .populate('party', 'name symbol')
      .populate('election_year', 'year')
      .sort({ votes: -1 });

    // Filter by election year if provided
    if (req.query.election_year) {
      query = query.where('election_year').equals(req.query.election_year);
    }

    const candidates = await query.exec();

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
    // Verify party exists
    const party = await Party.findById(req.params.partyId);
    if (!party) {
      return res.status(404).json({
        success: false,
        message: 'Party not found'
      });
    }

    let query = Candidate.find({ party: req.params.partyId })
      .populate('assembly', 'name')
      .populate('election_year', 'year')
      .sort({ votes: -1 });

    // Filter by election year if provided
    if (req.query.election_year) {
      query = query.where('election_year').equals(req.query.election_year);
    }

    const candidates = await query.exec();

    res.status(200).json({
      success: true,
      count: candidates.length,
      data: candidates
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get candidates by caste
// @route   GET /api/candidates/caste/:caste
// @access  Public
exports.getCandidatesByCaste = async (req, res, next) => {
  try {
    const validCastes = ['General', 'OBC', 'SC', 'ST', 'Other'];
    if (!validCastes.includes(req.params.caste)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid caste category'
      });
    }

    let query = Candidate.find({ caste: req.params.caste })
      .populate('party', 'name symbol')
      .populate('assembly', 'name')
      .populate('election_year', 'year')
      .sort({ votes: -1 });

    // Filter by election year if provided
    if (req.query.election_year) {
      query = query.where('election_year').equals(req.query.election_year);
    }

    const candidates = await query.exec();

    res.status(200).json({
      success: true,
      count: candidates.length,
      data: candidates
    });
  } catch (err) {
    next(err);
  }
};