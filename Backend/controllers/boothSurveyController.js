const BoothSurvey = require('../models/BoothSurvey');
const Booth = require('../models/booth');
const User = require('../models/User');
const State = require('../models/state');
const Division = require('../models/Division');
const Parliament = require('../models/Parliament');
const Assembly = require('../models/Assembly');
const Block = require('../models/block');

// @desc    Get all booth surveys
// @route   GET /api/booth-surveys
// @access  Private (Requires authentication via serviceToken)
exports.getBoothSurveys = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit);
    const skip = (page - 1) * limit;


    // Helper function for ObjectId or name lookup (normalize dashes to spaces)
    const handleIdOrName = async (param, model, nameField = 'name') => {
      if (!req.query[param]) return null;
      let value = req.query[param];
      value = value.replace(/-/g, ' ');
      const isObjectId = /^[a-f\d]{24}$/i.test(value);
      if (isObjectId) {
        return value;
      } else {
        const doc = await model.findOne({ [nameField]: { $regex: value, $options: 'i' } });
        return doc ? doc._id : null;
      }
    };

    // Build search filter
    let filter = {};
    if (req.query.search) {
      const search = req.query.search.replace(/-/g, ' ');
      const mongoose = require('mongoose');
      const [boothIds, stateIds, divisionIds, parliamentIds, assemblyIds, blockIds] = await Promise.all([
        Booth.find({
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { booth_number: { $regex: search, $options: 'i' } }
          ]
        }, '_id').then(docs => docs.map(d => mongoose.Types.ObjectId(d._id))),
        State.find({ name: { $regex: search, $options: 'i' } }, '_id').then(docs => docs.map(d => mongoose.Types.ObjectId(d._id))),
        State.find({ name: { $regex: search, $options: 'i' } }, '_id').then(docs => docs.map(d => mongoose.Types.ObjectId(d._id))),
        Division.find({ name: { $regex: search, $options: 'i' } }, '_id').then(docs => docs.map(d => mongoose.Types.ObjectId(d._id))),
        Parliament.find({ name: { $regex: search, $options: 'i' } }, '_id').then(docs => docs.map(d => mongoose.Types.ObjectId(d._id))),
        Assembly.find({ name: { $regex: search, $options: 'i' } }, '_id').then(docs => docs.map(d => mongoose.Types.ObjectId(d._id))),
        Block.find({ name: { $regex: search, $options: 'i' } }, '_id').then(docs => docs.map(d => mongoose.Types.ObjectId(d._id))),
      ]);
      const orArr = [
        { remark: { $regex: search, $options: 'i' } }
      ];
      if (boothIds.length) orArr.push({ booth_id: { $in: boothIds } });
      if (stateIds.length) orArr.push({ state_id: { $in: stateIds } });
      if (divisionIds.length) orArr.push({ division_id: { $in: divisionIds } });
      if (parliamentIds.length) orArr.push({ parliament_id: { $in: parliamentIds } });
      if (assemblyIds.length) orArr.push({ assembly_id: { $in: assemblyIds } });
      if (blockIds.length) orArr.push({ block_id: { $in: blockIds } });
      filter.$or = orArr;
    }

    // Add filters (support both ObjectId and name for all params)
    if (req.query.state_id || req.query.state) {
      const stateId = await handleIdOrName('state_id', State) || await handleIdOrName('state', State);
      if (stateId) filter.state_id = stateId;
      else if (req.query.state_id || req.query.state) return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
    }
    if (req.query.division) {
      const divisionId = await handleIdOrName('division', Division);
      if (divisionId) filter.division_id = divisionId;
      else return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
    }
    if (req.query.parliament_id || req.query.parliament) {
      const parliamentId = await handleIdOrName('parliament_id', Parliament) || await handleIdOrName('parliament', Parliament);
      if (parliamentId) filter.parliament_id = parliamentId;
      else if (req.query.parliament_id || req.query.parliament) return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
    }
    if (req.query.assembly_id || req.query.assembly) {
      const assemblyId = await handleIdOrName('assembly_id', Assembly) || await handleIdOrName('assembly', Assembly);
      if (assemblyId) filter.assembly_id = assemblyId;
      else if (req.query.assembly_id || req.query.assembly) return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
    }
    if (req.query.block_id || req.query.block) {
      const blockId = await handleIdOrName('block_id', Block) || await handleIdOrName('block', Block);
      if (blockId) filter.block_id = blockId;
      else if (req.query.block_id || req.query.block) return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
    }
    if (req.query.booth_id || req.query.booth) {
      const boothId = await handleIdOrName('booth_id', Booth) || await handleIdOrName('booth', Booth);
      if (boothId) filter.booth_id = boothId;
      else if (req.query.booth_id || req.query.booth) return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
    }
    // Note: surveyor, status and poll_result filters removed per new requirements
    if (req.query.startDate && req.query.endDate) {
      filter.survey_date = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    // If userHierarchy exists, restrict by user's scope (most specific first) unless superAdmin
    if (req.userHierarchy && req.user && req.user.role !== 'superAdmin') {
      if (req.userHierarchy.booth) {
        filter.booth_id = req.userHierarchy.booth._id;
      } else if (req.userHierarchy.block) {
        filter.block_id = req.userHierarchy.block._id;
      } else if (req.userHierarchy.assembly) {
        filter.assembly_id = req.userHierarchy.assembly._id;
      } else if (req.userHierarchy.parliament) {
        filter.parliament_id = req.userHierarchy.parliament._id;
      } else if (req.userHierarchy.division) {
        filter.division_id = req.userHierarchy.division._id;
      } else if (req.userHierarchy.state) {
        filter.state_id = req.userHierarchy.state._id;
      }
    }

    // If searching, ignore pagination and return all results
    let surveys, total;
    if (req.query.search) {
      surveys = await BoothSurvey.find(filter)
        .populate('booth_id', 'name booth_number')
        .populate('state_id', 'name')
        .populate('division_id', 'name')
        .populate('parliament_id', 'name')
        .populate('assembly_id', 'name')
        .populate('block_id', 'name')
        .populate('created_by', 'username')
        .populate('updated_by', 'username')
        .sort({ survey_date: -1 })
        .exec();
      total = surveys.length;
    } else {
      surveys = await BoothSurvey.find(filter)
        .populate('booth_id', 'name booth_number')
        .populate('state_id', 'name')
        .populate('division_id', 'name')
        .populate('parliament_id', 'name')
        .populate('assembly_id', 'name')
        .populate('block_id', 'name')
        .populate('created_by', 'username')
        .populate('updated_by', 'username')
        .sort({ survey_date: -1 })
        .skip(skip)
        .limit(limit)
        .exec();
      total = await BoothSurvey.countDocuments(filter);
    }

    res.status(200).json({
      success: true,
      count: surveys.length,
      total,
      page,
      pages: limit ? Math.ceil(total / limit) : 1,
      data: surveys
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single booth survey
// @route   GET /api/booth-surveys/:id
// @access  Private (Requires authentication via serviceToken)
exports.getBoothSurvey = async (req, res, next) => {
  try {
    const survey = await BoothSurvey.findById(req.params.id)
      .populate('booth_id')
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name')
      .populate('block_id', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Booth survey not found'
      });
    }

    // Enforce user hierarchy: ensure requested survey is within user's scope
    if (req.userHierarchy && req.user && req.user.role !== 'superAdmin') {
      const uh = req.userHierarchy;
      const outside = (
        (uh.booth && survey.booth_id.toString() !== uh.booth._id.toString()) ||
        (uh.block && survey.block_id.toString() !== uh.block._id.toString()) ||
        (uh.assembly && survey.assembly_id.toString() !== uh.assembly._id.toString()) ||
        (uh.parliament && survey.parliament_id.toString() !== uh.parliament._id.toString()) ||
        (uh.division && survey.division_id.toString() !== uh.division._id.toString()) ||
        (uh.state && survey.state_id.toString() !== uh.state._id.toString())
      );
      if (outside) {
        return res.status(403).json({ success: false, message: 'Access denied: geographic restriction' });
      }
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
// @access  Private (Admin/Surveyor)
exports.createBoothSurvey = async (req, res, next) => {
  try {
    // Verify references exist (surveyor and status removed per new requirements)
    const [
      booth,
      state,
      division,
      parliament,
      assembly,
      block
    ] = await Promise.all([
      Booth.findById(req.body.booth_id),
      State.findById(req.body.state_id),
      Division.findById(req.body.division_id),
      Parliament.findById(req.body.parliament_id),
      Assembly.findById(req.body.assembly_id),
      Block.findById(req.body.block_id)
    ]);

    if (!booth) return res.status(400).json({ success: false, message: 'Booth not found' });
    if (!state) return res.status(400).json({ success: false, message: 'State not found' });
    if (!division) return res.status(400).json({ success: false, message: 'Division not found' });
    if (!parliament) return res.status(400).json({ success: false, message: 'Parliament not found' });
    if (!assembly) return res.status(400).json({ success: false, message: 'Assembly not found' });
    if (!block) return res.status(400).json({ success: false, message: 'Block not found' });

    // Check if user exists in request
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized - user not identified' });
    }

    // Accept respondent fields (respondent_name, respondent_mobile) from req.body
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
// @access  Private (Admin/Surveyor)
exports.updateBoothSurvey = async (req, res, next) => {
  try {
    let survey = await BoothSurvey.findById(req.params.id);

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Booth survey not found'
      });
    }

  // Verify all references exist if being updated (surveyor/status removed)
  const verificationPromises = [];
  if (req.body.booth_id) verificationPromises.push(Booth.findById(req.body.booth_id));
  if (req.body.state_id) verificationPromises.push(State.findById(req.body.state_id));
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

    // Add updated_by info
    req.body.updated_by = req.user.id;
    req.body.updated_at = new Date();

    survey = await BoothSurvey.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('booth_id', 'name booth_number')
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name')
      .populate('block_id', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

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
// @access  Private (Requires authentication via serviceToken)
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
      .populate('created_by', 'username');

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
// @route   GET /api/booth-surveys/surveyor/:surveyorId
// @access  Private (Requires authentication via serviceToken)
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

    // getSurveysBySurveyor endpoint removed since surveyor field is no longer tracked
  } catch (err) {
    next(err);
  }
};

// @desc    Get surveys by state
// @route   GET /api/booth-surveys/state/:stateId
// @access  Private (Requires authentication via serviceToken)
exports.getSurveysByState = async (req, res, next) => {
  try {
    // Verify state exists
    const state = await State.findById(req.params.stateId);
    if (!state) {
      return res.status(404).json({
        success: false,
        message: 'State not found'
      });
    }

    const surveys = await BoothSurvey.find({ state_id: req.params.stateId })
      .sort({ survey_date: -1 })
      .populate('booth_id', 'name booth_number')
      .populate('created_by', 'username');

    res.status(200).json({
      success: true,
      count: surveys.length,
      data: surveys
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Import booth surveys from Excel
// @route   POST /api/booth-surveys/import
// @access  Private/Admin
exports.importBoothSurveys = async (req, res, next) => {
  try {
    const { rows } = req.body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No data provided. Expected array of rows.'
      });
    }

    const { resolveGeographicHierarchy, validateHierarchy } = require('./importHelpers');

    const results = { imported: 0, total: rows.length, errors: [] };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        // Resolve geographic hierarchy
        const geo = await resolveGeographicHierarchy(row);

        // Validate required hierarchy fields - booth survey requires booth
        const hierarchyCheck = validateHierarchy(geo, ['state', 'division', 'parliament', 'assembly', 'block', 'booth']);
        if (!hierarchyCheck.valid) {
          results.errors.push({
            row: i + 1,
            data: row,
            error: hierarchyCheck.errors.join(', ')
          });
          continue;
        }

        // Create booth survey entry
        const surveyData = {
          booth_id: geo.booth._id,
          state_id: geo.state._id,
          division_id: geo.division._id,
          parliament_id: geo.parliament._id,
          assembly_id: geo.assembly._id,
          block_id: geo.block._id,
          survey_date: row.survey_date ? new Date(row.survey_date) : new Date(),
          total_voters: parseInt(row.total_voters) || 0,
          surveyed_count: parseInt(row.surveyed_count) || 0,
          favorable_count: parseInt(row.favorable_count) || 0,
          unfavorable_count: parseInt(row.unfavorable_count) || 0,
          neutral_count: parseInt(row.neutral_count) || 0,
          remark: row.remark || '',
          created_by: req.user._id
        };

        await BoothSurvey.create(surveyData);
        results.imported++;

      } catch (err) {
        results.errors.push({
          row: i + 1,
          data: row,
          error: err.message || 'Failed to import booth survey'
        });
      }
    }

    res.status(200).json({
      success: true,
      imported: results.imported,
      total: results.total,
      errors: results.errors
    });

  } catch (err) {
    next(err);
  }
};