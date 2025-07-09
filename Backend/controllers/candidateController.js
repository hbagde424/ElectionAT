const Candidate = require('../models/Candidate');
const Party = require('../models/party');
const Assembly = require('../models/assembly');
const Parliament = require('../models/parliament');
const Year = require('../models/electionYear');

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
      .populate('party_id', 'name symbol')
      .populate('assembly_id', 'name')
      .populate('parliament_id', 'name')
      .populate('election_year', 'year')
      .populate('created_by', 'username')
      .populate('updated_by', 'username')
      .sort({ name: 1 });

    // Search functionality
    if (req.query.search) {
      query = query.find({
        $or: [
          { name: { $regex: req.query.search, $options: 'i' } },
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

    // Filter by election year
    if (req.query.year) {
      query = query.where('election_year').equals(req.query.year);
    }

    // Filter by caste
    if (req.query.caste) {
      query = query.where('caste').equals(req.query.caste);
    }

    // Filter by active status
    if (req.query.active) {
      query = query.where('is_active').equals(req.query.active === 'true');
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
    const [party, assembly, parliament, year] = await Promise.all([
      Party.findById(req.body.party_id),
      Assembly.findById(req.body.assembly_id),
      Parliament.findById(req.body.parliament_id),
      Year.findById(req.body.election_year)
    ]);

    if (!party) {
      return res.status(400).json({ success: false, message: 'Party not found' });
    }
    if (!assembly) {
      return res.status(400).json({ success: false, message: 'Assembly not found' });
    }
    if (!parliament) {
      return res.status(400).json({ success: false, message: 'Parliament not found' });
    }
    if (!year) {
      return res.status(400).json({ success: false, message: 'Election year not found' });
    }

    // Check if user exists in request
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

    const candidate = await Candidate.create(candidateData);

    res.status(201).json({
      success: true,
      data: candidate
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Candidate with this combination already exists'
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
    if (req.body.election_year) verificationPromises.push(Year.findById(req.body.election_year));

    const verificationResults = await Promise.all(verificationPromises);

    for (const result of verificationResults) {
      if (!result) {
        return res.status(400).json({
          success: false,
          message: `${result.modelName} not found`
        });
      }
    }

    // Add updated_by
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }
    req.body.updated_by = req.user.id;

    candidate = await Candidate.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('party_id', 'name symbol')
      .populate('assembly_id', 'name')
      .populate('parliament_id', 'name')
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
        message: 'Candidate with this combination already exists'
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

    const candidates = await Candidate.find({ assembly_id: req.params.assemblyId })
      .sort({ name: 1 })
      .populate('party_id', 'name symbol')
      .populate('parliament_id', 'name')
      .populate('election_year', 'year')
      .populate('created_by', 'username');

    res.status(200).json({
      success: true,
      count: candidates.length,
      data: candidates
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get candidates by parliament
// @route   GET /api/candidates/parliament/:parliamentId
// @access  Public
exports.getCandidatesByParliament = async (req, res, next) => {
  try {
    // Verify parliament exists
    const parliament = await Parliament.findById(req.params.parliamentId);
    if (!parliament) {
      return res.status(404).json({
        success: false,
        message: 'Parliament not found'
      });
    }

    const candidates = await Candidate.find({ parliament_id: req.params.parliamentId })
      .sort({ name: 1 })
      .populate('party_id', 'name symbol')
      .populate('assembly_id', 'name')
      .populate('election_year', 'year')
      .populate('created_by', 'username');

    res.status(200).json({
      success: true,
      count: candidates.length,
      data: candidates
    });
  } catch (err) {
    next(err);
  }
};