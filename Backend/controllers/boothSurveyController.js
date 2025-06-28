const BoothSurvey = require('../models/boothSurvey');
const Booth = require('../models/booth');
const User = require('../models/User');

// @desc    Get all booth surveys
// @route   GET /api/booth-surveys
// @access  Private
exports.getBoothSurveys = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Basic query
    let query = BoothSurvey.find()
      .populate('booth_id', 'booth_number location')
      .populate('survey_done_by', 'name email role')
      .sort({ survey_date: -1 });

    // Filter by booth
    if (req.query.booth) {
      query = query.where('booth_id').equals(req.query.booth);
    }

    // Filter by surveyor
    if (req.query.surveyor) {
      query = query.where('survey_done_by').equals(req.query.surveyor);
    }

    // Filter by status
    if (req.query.status) {
      query = query.where('status').equals(req.query.status);
    }

    // Filter by date range
    if (req.query.startDate) {
      const startDate = new Date(req.query.startDate);
      query = query.where('survey_date').gte(startDate);
    }
    if (req.query.endDate) {
      const endDate = new Date(req.query.endDate);
      query = query.where('survey_date').lte(endDate);
    }

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
// @access  Private
exports.getBoothSurveyById = async (req, res, next) => {
  try {
    const survey = await BoothSurvey.findById(req.params.id)
      .populate('booth_id', 'booth_number location')
      .populate('survey_done_by', 'name email role');

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found'
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

// @desc    Create new booth survey
// @route   POST /api/booth-surveys
// @access  Private (Surveyor, Admin, Editor)
exports.createBoothSurvey = async (req, res, next) => {
  try {
    // Verify booth exists
    const booth = await Booth.findById(req.body.booth_id);
    if (!booth) {
      return res.status(400).json({
        success: false,
        message: 'Booth not found'
      });
    }

    // Verify surveyor exists
    const surveyor = await User.findById(req.body.survey_done_by);
    if (!surveyor) {
      return res.status(400).json({
        success: false,
        message: 'Surveyor not found'
      });
    }

    // Check if user is creating survey for themselves unless admin/editor
    // if (req.user.id !== req.body.survey_done_by && 
    //     !req.user.roles.includes('admin') && 
    //     !req.user.roles.includes('editor')) {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'You can only create surveys for yourself'
    //   });
    // }

    const survey = await BoothSurvey.create(req.body);

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
// @access  Private (Surveyor, Admin, Editor)
exports.updateBoothSurvey = async (req, res, next) => {
  try {
    let survey = await BoothSurvey.findById(req.params.id);

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found'
      });
    }

    // Verify booth exists if being updated
    if (req.body.booth_id) {
      const booth = await Booth.findById(req.body.booth_id);
      if (!booth) {
        return res.status(400).json({
          success: false,
          message: 'Booth not found'
        });
      }
    }

    // Verify surveyor exists if being updated
    if (req.body.survey_done_by) {
      const surveyor = await User.findById(req.body.survey_done_by);
      if (!surveyor) {
        return res.status(400).json({
          success: false,
          message: 'Surveyor not found'
        });
      }
    }

    // Check if user is updating their own survey unless admin/editor
    if (survey.survey_done_by.toString() !== req.user.id && 
        !req.user.roles.includes('admin') && 
        !req.user.roles.includes('editor')) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own surveys'
      });
    }

    survey = await BoothSurvey.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('booth_id survey_done_by');

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
// @access  Private (Admin)
exports.deleteBoothSurvey = async (req, res, next) => {
  try {
    const survey = await BoothSurvey.findById(req.params.id);

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found'
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

// @desc    Get surveys by booth ID
// @route   GET /api/booth-surveys/booth/:boothId
// @access  Private
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
      .populate('survey_done_by', 'name email role')
      .sort({ survey_date: -1 });

    res.status(200).json({
      success: true,
      count: surveys.length,
      data: surveys
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get surveys by surveyor ID
// @route   GET /api/booth-surveys/surveyor/:surveyorId
// @access  Private
exports.getSurveysBySurveyor = async (req, res, next) => {
  try {
    // Verify surveyor exists
    const surveyor = await User.findById(req.params.surveyorId);
    if (!surveyor) {
      return res.status(404).json({
        success: false,
        message: 'Surveyor not found'
      });
    }

    const surveys = await BoothSurvey.find({ survey_done_by: req.params.surveyorId })
      .populate('booth_id', 'booth_number location')
      .sort({ survey_date: -1 });

    res.status(200).json({
      success: true,
      count: surveys.length,
      data: surveys
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get surveys by status
// @route   GET /api/booth-surveys/status/:status
// @access  Private
exports.getSurveysByStatus = async (req, res, next) => {
  try {
    const validStatuses = ['Pending', 'In Progress', 'Completed', 'Verified', 'Rejected'];
    if (!validStatuses.includes(req.params.status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const surveys = await BoothSurvey.find({ status: req.params.status })
      .populate('booth_id', 'booth_number location')
      .populate('survey_done_by', 'name email role')
      .sort({ survey_date: -1 });

    res.status(200).json({
      success: true,
      count: surveys.length,
      data: surveys
    });
  } catch (err) {
    next(err);
  }
};