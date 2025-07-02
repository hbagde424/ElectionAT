const BoothSurvey = require('../models/BoothSurvey');
const Booth = require('../models/booth');
const User = require('../models/User');
const Division = require('../models/division');
const Parliament = require('../models/parliament');
const Assembly = require('../models/assembly');
const Block = require('../models/block');

// @desc    Get all booth surveys
// @route   GET /api/booth-surveys
// @access  Public
exports.getBoothSurveys = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Base query
    let query = BoothSurvey.find()
      .populate('booth_id', 'name booth_number')
      .populate('survey_done_by', 'name email')
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name')
      .populate('block_id', 'name')
      .populate('created_by', 'name')
      .populate('updated_by', 'name')
      .sort({ survey_date: -1 });

    // Search functionality
    if (req.query.search) {
      query = query.find({
        $or: [
          { remark: { $regex: req.query.search, $options: 'i' } },
          { poll_result: { $regex: req.query.search, $options: 'i' } }
        ]
      });
    }

    // Filter by status
    if (req.query.status) {
      query = query.where('status').equals(req.query.status);
    }

    // Filter by booth
    if (req.query.booth) {
      query = query.where('booth_id').equals(req.query.booth);
    }

    // Filter by surveyor
    if (req.query.surveyor) {
      query = query.where('survey_done_by').equals(req.query.surveyor);
    }

    // Filter by date range
    if (req.query.startDate && req.query.endDate) {
      query = query.where('survey_date').gte(new Date(req.query.startDate)).lte(new Date(req.query.endDate));
    }

    // Filter by geographical hierarchy
    if (req.query.division) query = query.where('division_id').equals(req.query.division);
    if (req.query.parliament) query = query.where('parliament_id').equals(req.query.parliament);
    if (req.query.assembly) query = query.where('assembly_id').equals(req.query.assembly);
    if (req.query.block) query = query.where('block_id').equals(req.query.block);

    const surveys = await query.skip(skip).limit(limit).exec();
    const total = await BoothSurvey.countDocuments(query.getFilter());

    res.status(200).json({
      success: true,
      count: surveys.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: surveys
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single booth survey
// @route   GET /api/booth-surveys/:id
// @access  Public
exports.getBoothSurvey = async (req, res, next) => {
  try {
    const survey = await BoothSurvey.findById(req.params.id)
      .populate('booth_id', 'name booth_number full_address')
      .populate('survey_done_by', 'name email phone')
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name')
      .populate('block_id', 'name')
      .populate('created_by', 'name email')
      .populate('updated_by', 'name email');

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Booth survey not found'
      });
    }

    res.status(200).json({
      success: true,
      data: survey
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create booth survey
// @route   POST /api/booth-surveys
// @access  Private
exports.createBoothSurvey = async (req, res, next) => {
  try {
    // Verify all references exist
    const [
      booth,
      surveyor,
      division,
      parliament,
      assembly,
      block
    ] = await Promise.all([
      Booth.findById(req.body.booth_id),
      User.findById(req.body.survey_done_by),
      Division.findById(req.body.division_id),
      Parliament.findById(req.body.parliament_id),
      Assembly.findById(req.body.assembly_id),
      Block.findById(req.body.block_id)
    ]);

    if (!booth) return res.status(400).json({ success: false, message: 'Booth not found' });
    if (!surveyor) return res.status(400).json({ success: false, message: 'Surveyor not found' });
    if (!division) return res.status(400).json({ success: false, message: 'Division not found' });
    if (!parliament) return res.status(400).json({ success: false, message: 'Parliament not found' });
    if (!assembly) return res.status(400).json({ success: false, message: 'Assembly not found' });
    if (!block) return res.status(400).json({ success: false, message: 'Block not found' });

    // Set created_by to current user
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }

    const surveyData = {
      ...req.body,
      created_by: req.user.id
    };

    const survey = await BoothSurvey.create(surveyData);

    res.status(201).json({
      success: true,
      data: survey
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update booth survey
// @route   PUT /api/booth-surveys/:id
// @access  Private
exports.updateBoothSurvey = async (req, res, next) => {
  try {
    let survey = await BoothSurvey.findById(req.params.id);

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Booth survey not found'
      });
    }

    // Verify references if being updated
    const verificationPromises = [];
    if (req.body.booth_id) verificationPromises.push(Booth.findById(req.body.booth_id));
    if (req.body.survey_done_by) verificationPromises.push(User.findById(req.body.survey_done_by));
    if (req.body.division_id) verificationPromises.push(Division.findById(req.body.division_id));
    if (req.body.parliament_id) verificationPromises.push(Parliament.findById(req.body.parliament_id));
    if (req.body.assembly_id) verificationPromises.push(Assembly.findById(req.body.assembly_id));
    if (req.body.block_id) verificationPromises.push(Block.findById(req.body.block_id));

    const verificationResults = await Promise.all(verificationPromises);
    
    for (const result of verificationResults) {
      if (!result) {
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

    survey = await BoothSurvey.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('booth_id', 'name booth_number')
      .populate('survey_done_by', 'name')
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name')
      .populate('block_id', 'name')
      .populate('created_by', 'name')
      .populate('updated_by', 'name');

    res.status(200).json({
      success: true,
      data: survey
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete booth survey
// @route   DELETE /api/booth-surveys/:id
// @access  Private (Admin only)
exports.deleteBoothSurvey = async (req, res, next) => {
  try {
    const survey = await BoothSurvey.findById(req.params.id);

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Booth survey not found'
      });
    }

    await survey.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get surveys by booth
// @route   GET /api/booth-surveys/booth/:boothId
// @access  Public
exports.getSurveysByBooth = async (req, res, next) => {
  try {
    // Verify booth exists
    const booth = await Booth.findById(req.params.boothId);
    if (!booth) {
      return res.status(404).json({
        success: false,
        message: 'Booth not found'
      });
    }

    const surveys = await BoothSurvey.find({ booth_id: req.params.boothId })
      .sort({ survey_date: -1 })
      .populate('survey_done_by', 'name')
      .populate('created_by', 'name');

    res.status(200).json({
      success: true,
      count: surveys.length,
      data: surveys
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get surveys by surveyor
// @route   GET /api/booth-surveys/surveyor/:userId
// @access  Public
exports.getSurveysBySurveyor = async (req, res, next) => {
  try {
    // Verify user exists
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const surveys = await BoothSurvey.find({ survey_done_by: req.params.userId })
      .sort({ survey_date: -1 })
      .populate('booth_id', 'name booth_number')
      .populate('created_by', 'name');

    res.status(200).json({
      success: true,
      count: surveys.length,
      data: surveys
    });
  } catch (err) {
    next(err);
  }
};