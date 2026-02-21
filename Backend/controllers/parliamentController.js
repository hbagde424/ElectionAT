const mongoose = require('mongoose');
const Parliament = require('../models/Parliament');
const Division = require('../models/Division');
const State = require('../models/state');

// Helper to validate ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// @desc    Get all parliaments
// @route   GET /api/parliaments
// @access  Public
exports.getParliaments = async (req, res, next) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit);

    if (!!req.query.search || !limit || limit <= 0) {
      limit = 10000;
    }
    const skip = (page - 1) * limit;

    let query = Parliament.find()
      .populate('division_id', 'name')
      .populate('state_id', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username')
      .sort({ parliament_no: 1 });

    // Enhanced search functionality
    if (req.query.search) {
      const searchRegex = { $regex: req.query.search, $options: 'i' };
      query = query.find({
        $or: [
          { name: searchRegex },
          { description: searchRegex },
          { category: searchRegex },
          { regional_type: searchRegex }
        ]
      });
    }

    // Filter by category
    if (req.query.category) {
      query = query.where('category').equals(req.query.category);
    }

    // Filter by regional_type
    if (req.query.regional_type) {
      query = query.where('regional_type').equals(req.query.regional_type);
    }

    // Filter by division
    if (req.query.division) {
      const isObjectId = /^[a-f\d]{24}$/i.test(req.query.division);
      if (isObjectId) {
        query = query.where('division_id').equals(req.query.division);
      } else {
        const divisionDoc = await Division.findOne({ name: req.query.division });
        if (divisionDoc) {
          query = query.where('division_id').equals(divisionDoc._id);
        } else {
          return res.status(200).json({
            success: true,
            count: 0,
            total: 0,
            page,
            pages: 0,
            data: []
          });
        }
      }
    }

    // Filter by state
    if (req.query.state) {
      const isObjectId = /^[a-f\d]{24}$/i.test(req.query.state);
      if (isObjectId) {
        query = query.where('state_id').equals(req.query.state);
      } else {
        const stateDoc = await State.findOne({ name: req.query.state });
        if (stateDoc) {
          query = query.where('state_id').equals(stateDoc._id);
        } else {
          return res.status(200).json({
            success: true,
            count: 0,
            total: 0,
            page,
            pages: 0,
            data: []
          });
        }
      }
    }

    // If userHierarchy exists, restrict by user's scope unless superAdmin
    if (req.userHierarchy && req.user && req.user.role !== 'superAdmin') {
      const uh = req.userHierarchy;
      if (uh.booth) query = query.where('booth_id').equals(uh.booth._id);
      else if (uh.block) query = query.where('block_id').equals(uh.block._id);
      else if (uh.assembly) query = query.where('assembly_id').equals(uh.assembly._id);
      else if (uh.parliament) query = query.where('_id').equals(uh.parliament._id);
      else if (uh.division) query = query.where('division_id').equals(uh.division._id);
      else if (uh.state) query = query.where('state_id').equals(uh.state._id);
    }

    // Filter by active status
    if (req.query.is_active !== undefined) {
      query = query.where('is_active').equals(req.query.is_active === 'true');
    }

    const parliaments = await query.skip(skip).limit(limit).exec();
    const total = await Parliament.countDocuments(query.getFilter());

    res.status(200).json({
      success: true,
      count: parliaments.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: parliaments
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single parliament
// @route   GET /api/parliaments/:id
// @access  Public
exports.getParliament = async (req, res, next) => {
  try {
    const parliament = await Parliament.findById(req.params.id)
      .populate('division_id', 'name')
      .populate('state_id', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    if (!parliament) {
      return res.status(404).json({
        success: false,
        message: 'Parliament not found'
      });
    }

    // Enforce user hierarchy for single parliament resource
    if (req.userHierarchy && req.user && req.user.role !== 'superAdmin') {
      const uh = req.userHierarchy;
      const outside = (
        (uh.parliament && parliament._id.toString() !== uh.parliament._id.toString()) ||
        (uh.division && parliament.division_id?.toString() !== uh.division._id.toString()) ||
        (uh.state && parliament.state_id?.toString() !== uh.state._id.toString())
      );
      if (outside) {
        return res.status(403).json({ success: false, message: 'Access denied: geographic restriction' });
      }
    }

    res.status(200).json({
      success: true,
      data: parliament
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create parliament
// @route   POST /api/parliaments
// @access  Private (Admin only)
exports.createParliament = async (req, res, next) => {
  try {
    // Verify all references exist
    const [division, state] = await Promise.all([
      Division.findById(req.body.division_id),
      State.findById(req.body.state_id)
    ]);

    if (!division) {
      return res.status(400).json({ success: false, message: 'Division not found' });
    }
    if (!state) {
      return res.status(400).json({ success: false, message: 'State not found' });
    }

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }

    const parliamentData = {
      ...req.body,
      created_by: req.user.id,
      description: req.body.description || ''
    };

    if (req.body.polygon) {
      parliamentData.polygon = req.body.polygon;
    }

    const parliament = await Parliament.create(parliamentData);

    res.status(201).json({
      success: true,
      data: parliament
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Parliament with this number already exists'
      });
    }
    next(err);
  }
};

// @desc    Update parliament
// @route   PUT /api/parliaments/:id
// @access  Private (Admin only)
exports.updateParliament = async (req, res, next) => {
  try {
    let parliament = await Parliament.findById(req.params.id);

    if (!parliament) {
      return res.status(404).json({
        success: false,
        message: 'Parliament not found'
      });
    }

    // Verify all references exist if being updated
    const verificationPromises = [];
    if (req.body.division_id) verificationPromises.push(Division.findById(req.body.division_id));
    if (req.body.state_id) verificationPromises.push(State.findById(req.body.state_id));

    const verificationResults = await Promise.all(verificationPromises);

    for (const result of verificationResults) {
      if (!result) {
        return res.status(400).json({
          success: false,
          message: `${result.modelName} not found`
        });
      }
    }

    const updateData = {
      ...req.body,
      updated_by: req.user.id,
      description: req.body.description || '',
      updated_at: Date.now()
    };

    if (req.body.polygon) {
      updateData.polygon = req.body.polygon;
    }

    parliament = await Parliament.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    })
      .populate('division_id', 'name')
      .populate('state_id', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    res.status(200).json({
      success: true,
      data: parliament
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Parliament with this number already exists'
      });
    }
    next(err);
  }
};

// @desc    Delete parliament
// @route   DELETE /api/parliaments/:id
// @access  Private (Admin only)
exports.deleteParliament = async (req, res, next) => {
  try {
    const parliament = await Parliament.findById(req.params.id);

    if (!parliament) {
      return res.status(404).json({
        success: false,
        message: 'Parliament not found'
      });
    }

    await parliament.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Import parliaments from Excel
// @route   POST /api/parliaments/import
// @access  Private/SuperAdmin
exports.importParliaments = async (req, res, next) => {
  try {
    const { rows } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'No data provided' });
    }

    const { resolveGeographicHierarchy, validateHierarchy } = require('./importHelpers');
    const summary = { total: rows.length, created: 0, skipped: 0, errors: [], ids: [] };
    const created = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        if (!row.name) {
          summary.skipped += 1;
          summary.errors.push({ row: i + 1, message: 'Missing parliament name' });
          continue;
        }

        const geo = await resolveGeographicHierarchy(row);
        const missingFields = validateHierarchy(geo, ['state', 'division']);
        if (missingFields.length > 0) {
          summary.skipped += 1;
          summary.errors.push({ row: i + 1, message: `Missing: ${missingFields.join(', ')}` });
          continue;
        }

        // Check for duplicates
        const existing = await Parliament.findOne({ parliament_no: row.parliament_no });
        if (existing) {
          summary.skipped += 1;
          summary.errors.push({ row: i + 1, message: `Parliament number ${row.parliament_no} already exists` });
          continue;
        }

        const parliamentData = {
          name: row.name,
          parliament_no: row.parliament_no,
          category: row.category || 'General',
          regional_type: row.regional_type || 'Urban',
          division_id: geo.division._id,
          state_id: geo.state._id,
          created_by: req.user.id,
          updated_by: req.user.id
        };

        const parliament = await Parliament.create(parliamentData);
        created.push(parliament._id);
        summary.created += 1;
      } catch (err) {
        summary.skipped += 1;
        summary.errors.push({ row: i + 1, message: err?.message || String(err) });
      }
    }

    return res.status(200).json({ success: true, ...summary, ids: created });
  } catch (err) {
    next(err);
  }
};

// @desc    Upload parliament polygon (GeoJSON)
// @route   POST /api/parliaments/upload-polygon
// @access  Private (Admin only)
exports.uploadParliamentPolygon = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const geoJsonData = req.body;

    if (!geoJsonData || !geoJsonData.type) {
      return res.status(400).json({
        success: false,
        message: 'Invalid GeoJSON data'
      });
    }

    let features = [];
    if (geoJsonData.type === 'FeatureCollection') {
      features = geoJsonData.features;
    } else if (geoJsonData.type === 'Feature') {
      features = [geoJsonData];
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid GeoJSON type. Must be FeatureCollection or Feature'
      });
    }

    let updatedCount = 0;
    let errors = [];

    for (const feature of features) {
      if (!feature.properties) continue;

      const props = feature.properties;
      const parliamentNo = props.parliament_no || props.PC_NO || props.OBJECTID;
      const parliamentName = props.STNAME || props.name || props.Name || props.NAME;

      if (!parliamentNo && !parliamentName) {
        errors.push('Feature passed without a valid match property (parliament_no or name)');
        continue;
      }

      let parliament = null;

      // Try finding by parliament_no first if available
      if (parliamentNo) {
        parliament = await Parliament.findOne({ parliament_no: Number(parliamentNo) });
      }

      // If not found by parliament_no, try by name
      if (!parliament && parliamentName) {
        parliament = await Parliament.findOne({
          name: { $regex: new RegExp(`^${parliamentName}$`, 'i') }
        });
      }

      if (parliament) {
        parliament.polygon = feature;
        await parliament.save();
        updatedCount++;
      } else {
        errors.push(`Parliament not found for: parliament_no=${parliamentNo}, name=${parliamentName}`);
      }
    }

    if (updatedCount === 0 && errors.length > 0) {
      return res.status(404).json({
        success: false,
        message: 'No parliaments matched',
        errors
      });
    }

    res.status(200).json({
      success: true,
      message: `Successfully updated polygons for ${updatedCount} parliaments`,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (err) {
    next(err);
  }
};

// @desc    Get total parliaments count
// @route   GET /api/total-parliaments
// @access  Public
exports.getTotalParliaments = async (req, res, next) => {
  try {
    const total = await Parliament.countDocuments();
    res.status(200).json({
      success: true,
      total
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all parliament-related data from all tables
// @route   GET /api/parliaments/:id/related-data
// @access  Public
exports.getParliamentRelatedData = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid parliament ID'
      });
    }

    const parliament = await Parliament.findById(id)
      .populate('division_id', 'name')
      .populate('state_id', 'name')
      .populate('created_by', 'username');

    if (!parliament) {
      return res.status(404).json({
        success: false,
        message: 'Parliament not found'
      });
    }

    // Fetch all related data from tables with parliament_id
    const Assembly = require('../models/Assembly');
    const District = require('../models/District');
    const Samiti = require('../models/Samiti');
    const Visit = require('../models/Visit');
    const WinningParty = require('../models/WinningParty');
    const WinningCandidate = require('../models/winningCandidate');
    const WorkStatus = require('../models/WorkStatus');
    const VotingTrends = require('../models/votingTrends');
    const Village = require('../models/Village');
    const PartyActivity = require('../models/partyActivity');
    const ParliamentCandidate = require('../models/ParliamentCandidate');
    const ParliamentVotes = require('../models/parliamentVotes');
    const Panchayat = require('../models/Panchayat');
    const LocalIssue = require('../models/LocalIssue');
    const Influencer = require('../models/influencer');
    const Government = require('../models/government');
    const Gender = require('../models/gender');
    const Falliya = require('../models/Falliya');
    const Event = require('../models/Event');
    const ElectionType = require('../models/electionType');
    const CasteList = require('../models/CasteList');

    const [
      assemblies,
      districts,
      samitis,
      visits,
      winningParties,
      winningCandidates,
      workStatus,
      votingTrends,
      villages,
      partyActivities,
      parliamentCandidates,
      parliamentVotes,
      panchayats,
      localIssues,
      influencers,
      governments,
      genders,
      falliya,
      events,
      electionTypes,
      casteLists
    ] = await Promise.all([
      Assembly.find({ parliament_id: id }).populate('parliament_id', 'name').limit(100),
      District.find({ parliament_id: id }).populate('parliament_id', 'name').limit(100),
      Samiti.find({ parliament_id: id }).populate('parliament_id', 'name').limit(100),
      Visit.find({ parliament_id: id }).populate('parliament_id', 'name').limit(100),
      WinningParty.find({ parliament_id: id }).populate('parliament_id', 'name').limit(100),
      WinningCandidate.find({ parliament_id: id }).populate('parliament_id', 'name').limit(100),
      WorkStatus.find({ parliament_id: id }).populate('parliament_id', 'name').limit(100),
      VotingTrends.find({ parliament_id: id }).populate('parliament_id', 'name').limit(100),
      Village.find({ parliament_id: id }).populate('parliament_id', 'name').limit(100),
      PartyActivity.find({ parliament_id: id }).populate('parliament_id', 'name').limit(100),
      ParliamentCandidate.find({ parliament_id: id }).populate('parliament_id', 'name').limit(100),
      ParliamentVotes.find({ parliament_id: id }).populate('parliament_id', 'name').limit(100),
      Panchayat.find({ parliament_id: id }).populate('parliament_id', 'name').limit(100),
      LocalIssue.find({ parliament_id: id }).populate('parliament_id', 'name').limit(100),
      Influencer.find({ parliament_id: id }).populate('parliament_id', 'name').limit(100),
      Government.find({ parliament_id: id }).populate('parliament_id', 'name').limit(100),
      Gender.find({ parliament_id: id }).populate('parliament_id', 'name').limit(100),
      Falliya.find({ parliament_id: id }).populate('parliament_id', 'name').limit(100),
      Event.find({ parliament_id: id }).populate('parliament_id', 'name').limit(100),
      ElectionType.find({ parliament_id: id }).populate('parliament_id', 'name').limit(100),
      CasteList.find({ parliament_id: id }).populate('parliament_id', 'name').limit(100)
    ]);

    res.status(200).json({
      success: true,
      data: {
        parliament,
        assemblies: { count: assemblies.length, data: assemblies },
        districts: { count: districts.length, data: districts },
        samitis: { count: samitis.length, data: samitis },
        visits: { count: visits.length, data: visits },
        winningParties: { count: winningParties.length, data: winningParties },
        winningCandidates: { count: winningCandidates.length, data: winningCandidates },
        workStatus: { count: workStatus.length, data: workStatus },
        votingTrends: { count: votingTrends.length, data: votingTrends },
        villages: { count: villages.length, data: villages },
        partyActivities: { count: partyActivities.length, data: partyActivities },
        parliamentCandidates: { count: parliamentCandidates.length, data: parliamentCandidates },
        parliamentVotes: { count: parliamentVotes.length, data: parliamentVotes },
        panchayats: { count: panchayats.length, data: panchayats },
        localIssues: { count: localIssues.length, data: localIssues },
        influencers: { count: influencers.length, data: influencers },
        governments: { count: governments.length, data: governments },
        genders: { count: genders.length, data: genders },
        falliya: { count: falliya.length, data: falliya },
        events: { count: events.length, data: events },
        electionTypes: { count: electionTypes.length, data: electionTypes },
        casteLists: { count: casteLists.length, data: casteLists }
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get parliament polygons as GeoJSON
// @route   GET /api/parliaments/polygons
// @access  Public
exports.getParliamentPolygons = async (req, res, next) => {
  try {
    const Parliament = require('../models/Parliament');
    const parliaments = await Parliament.find({ polygon: { $ne: null } })
      .select('name parliament_no division_id state_id polygon')
      .populate('division_id', 'name')
      .populate('state_id', 'name');
    
    if (!parliaments || parliaments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No parliament polygons found'
      });
    }

    // Transform to GeoJSON FeatureCollection
    const features = parliaments.map(parliament => {
      if (parliament.polygon && parliament.polygon.type === 'Feature') {
        return {
          ...parliament.polygon,
          properties: {
            ...parliament.polygon.properties,
            _id: parliament._id,
            PC_ID: parliament._id,
            name: parliament.name,
            PC_NAME: parliament.name,
            PC_NO: parliament.parliament_no,
            parliament_no: parliament.parliament_no,
            DIVISION_NAME: parliament.division_id?.name || '',
            ST_NAME: parliament.state_id?.name || ''
          }
        };
      } else if (parliament.polygon && parliament.polygon.geometry) {
        return {
          type: 'Feature',
          properties: {
            _id: parliament._id,
            PC_ID: parliament._id,
            name: parliament.name,
            PC_NAME: parliament.name,
            PC_NO: parliament.parliament_no,
            parliament_no: parliament.parliament_no,
            DIVISION_NAME: parliament.division_id?.name || '',
            ST_NAME: parliament.state_id?.name || ''
          },
          geometry: parliament.polygon.geometry
        };
      }
      return null;
    }).filter(f => f !== null);

    res.status(200).json([{
      type: 'FeatureCollection',
      features
    }]);
  } catch (err) {
    next(err);
  }
};

// @desc    Get parliament polygons by division name
// @route   GET /api/parliaments/polygons/division/:divisionName
// @access  Public
exports.getParliamentPolygonsByDivision = async (req, res, next) => {
  try {
    const Parliament = require('../models/Parliament');
    const Division = require('../models/Division');
    
    const divisionName = req.params.divisionName;
    const division = await Division.findOne({ 
      name: { $regex: new RegExp(`^${divisionName}$`, 'i') } 
    });
    
    if (!division) {
      return res.status(404).json({
        success: false,
        message: `Division not found: ${divisionName}`
      });
    }

    const parliaments = await Parliament.find({ 
      division_id: division._id,
      polygon: { $ne: null } 
    })
      .select('name parliament_no division_id state_id polygon')
      .populate('division_id', 'name')
      .populate('state_id', 'name');
    
    if (!parliaments || parliaments.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No parliament polygons found for division: ${divisionName}`
      });
    }

    // Transform to GeoJSON FeatureCollection
    const features = parliaments.map(parliament => {
      if (parliament.polygon && parliament.polygon.type === 'Feature') {
        return {
          ...parliament.polygon,
          properties: {
            ...parliament.polygon.properties,
            _id: parliament._id,
            PC_ID: parliament._id,
            name: parliament.name,
            PC_NAME: parliament.name,
            PC_NO: parliament.parliament_no,
            parliament_no: parliament.parliament_no,
            DIVISION_NAME: parliament.division_id?.name || '',
            ST_NAME: parliament.state_id?.name || '',
            ST_CODE: parliament.state_id?._id || ''
          }
        };
      } else if (parliament.polygon && parliament.polygon.geometry) {
        return {
          type: 'Feature',
          properties: {
            _id: parliament._id,
            PC_ID: parliament._id,
            name: parliament.name,
            PC_NAME: parliament.name,
            PC_NO: parliament.parliament_no,
            parliament_no: parliament.parliament_no,
            DIVISION_NAME: parliament.division_id?.name || '',
            ST_NAME: parliament.state_id?.name || '',
            ST_CODE: parliament.state_id?._id || ''
          },
          geometry: parliament.polygon.geometry
        };
      }
      return null;
    }).filter(f => f !== null);

    res.status(200).json([{
      type: 'FeatureCollection',
      features
    }]);
  } catch (err) {
    next(err);
  }
};
