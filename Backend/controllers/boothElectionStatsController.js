const BoothElectionStats = require('../models/boothElectionStats');

// @desc    Get all booth election stats
// @route   GET /api/booth-stats
// @access  Public
exports.getBoothStats = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit);
    const skip = (page - 1) * limit;

    // Build query
    let query = BoothElectionStats.find()
      .populate('booth_id', 'name code')
      .populate('year_id', 'year')
      .populate('winning_party_id', 'name symbol')
      .sort({ year_id: -1 });

    // Filter by booth
    if (req.query.booth) {
      query = query.where('booth_id').equals(req.query.booth);
    }

    // Filter by year
    if (req.query.year) {
      query = query.where('year_id').equals(req.query.year);
    }

    const stats = await query.skip(skip).limit(limit).exec();
    const total = await BoothElectionStats.countDocuments(query.getFilter());

    res.status(200).json({
      success: true,
      count: stats.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: stats
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get election stats by booth ID
// @route   GET /api/booth-stats/booth/:boothId
// @access  Public
exports.getStatsByBooth = async (req, res, next) => {
  try {
    const stats = await BoothElectionStats.find({ booth_id: req.params.boothId })
      .populate('year_id', 'year')
      .populate('winning_party_id', 'name symbol')
      .sort({ year_id: -1 });

    res.status(200).json({
      success: true,
      count: stats.length,
      data: stats
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get election stats by year ID
// @route   GET /api/booth-stats/year/:yearId
// @access  Public
exports.getStatsByYear = async (req, res, next) => {
  try {
    const stats = await BoothElectionStats.find({ year_id: req.params.yearId })
      .populate('booth_id', 'name code')
      .populate('winning_party_id', 'name symbol')
      .sort({ booth_id: 1 });

    res.status(200).json({
      success: true,
      count: stats.length,
      data: stats
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single booth election stats
// @route   GET /api/booth-stats/:id
// @access  Public
exports.getBoothStatsById = async (req, res, next) => {
  try {
    const stats = await BoothElectionStats.findById(req.params.id)
      .populate('booth_id', 'name code')
      .populate('year_id', 'year')
      .populate('winning_party_id', 'name symbol');

    if (!stats) {
      return res.status(404).json({
        success: false,
        message: 'Booth election statistics not found'
      });
    }

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new booth election stats
// @route   POST /api/booth-stats
// @access  Private (Admin, Data Entry)
exports.createBoothStats = async (req, res, next) => {
  try {
    // Check if record already exists for this booth and year
    const existingStats = await BoothElectionStats.findOne({
      booth_id: req.body.booth_id,
      year_id: req.body.year_id
    });

    if (existingStats) {
      return res.status(400).json({
        success: false,
        message: 'Election statistics already exist for this booth and year'
      });
    }

    // Calculate turnout percentage if not provided
    if (!req.body.turnout_percentage && req.body.total_votes_polled) {
      // You would need to get registered voters count from somewhere
      // This is just an example - adjust according to your data model
      const booth = await LocalDynamics.findOne({ booth_id: req.body.booth_id });
      if (booth && booth.registered_voters) {
        req.body.turnout_percentage = 
          (req.body.total_votes_polled / booth.registered_voters) * 100;
      }
    }

    const stats = await BoothElectionStats.create(req.body);

    res.status(201).json({
      success: true,
      data: stats
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update booth election stats
// @route   PUT /api/booth-stats/:id
// @access  Private (Admin, Data Entry)
exports.updateBoothStats = async (req, res, next) => {
  try {
    let stats = await BoothElectionStats.findById(req.params.id);

    if (!stats) {
      return res.status(404).json({
        success: false,
        message: 'Booth election statistics not found'
      });
    }

    // Prevent changing booth_id or year_id
    if (req.body.booth_id && req.body.booth_id !== stats.booth_id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change booth reference'
      });
    }

    if (req.body.year_id && req.body.year_id !== stats.year_id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change year reference'
      });
    }

    // Recalculate turnout if total votes changed
    if (req.body.total_votes_polled && !req.body.turnout_percentage) {
      const booth = await LocalDynamics.findOne({ booth_id: stats.booth_id });
      if (booth && booth.registered_voters) {
        req.body.turnout_percentage = 
          (req.body.total_votes_polled / booth.registered_voters) * 100;
      }
    }

    stats = await BoothElectionStats.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
    .populate('booth_id', 'name code')
    .populate('year_id', 'year')
    .populate('winning_party_id', 'name symbol');

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete booth election stats
// @route   DELETE /api/booth-stats/:id
// @access  Private (Admin)
exports.deleteBoothStats = async (req, res, next) => {
  try {
    const stats = await BoothElectionStats.findById(req.params.id);

    if (!stats) {
      return res.status(404).json({
        success: false,
        message: 'Booth election statistics not found'
      });
    }

    await stats.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};