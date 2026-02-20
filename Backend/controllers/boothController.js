const mongoose = require('mongoose');
const Booth = require('../models/booth');
const Block = require('../models/block');
const Assembly = require('../models/Assembly');
const Parliament = require('../models/Parliament');
const Division = require('../models/Division');
const State = require('../models/state');

// Helper to validate ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// @desc    Get all booths
// @route   GET /api/booths
// @access  Public
exports.getBooths = async (req, res, next) => {
  try {
    // Pagination
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit);

    // If searching or no limit provided, set a high limit
    if (!!req.query.search || !limit || limit <= 0) {
      limit = 10000;
    }
    const skip = (page - 1) * limit;

    // Basic query
    let query = Booth.find()
      .populate('block_id', 'name')
      .populate('assembly_id', 'name')
      .populate('parliament_id', 'name')
      .populate('division_id', 'name')
      .populate('state_id', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username')
      .sort({ booth_number: 1 });

    // Enhanced search functionality
    if (req.query.search) {
      const searchRegex = { $regex: req.query.search, $options: 'i' };
      query = query.find({
        $or: [
          { name: searchRegex },
          { full_address: searchRegex },
          { booth_number: searchRegex }
        ]
      });
    }

    // Filter by block
    if (req.query.block) {
      const isObjectId = /^[a-f\d]{24}$/i.test(req.query.block);
      if (isObjectId) {
        query = query.where('block_id').equals(req.query.block);
      } else {
        const blockDoc = await Block.findOne({ name: req.query.block });
        if (blockDoc) {
          query = query.where('block_id').equals(blockDoc._id);
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

    // Filter by assembly
    if (req.query.assembly) {
      const isObjectId = /^[a-f\d]{24}$/i.test(req.query.assembly);
      if (isObjectId) {
        query = query.where('assembly_id').equals(req.query.assembly);
      } else {
        const assemblyDoc = await Assembly.findOne({ name: req.query.assembly });
        if (assemblyDoc) {
          query = query.where('assembly_id').equals(assemblyDoc._id);
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

    // Filter by parliament
    if (req.query.parliament) {
      const isObjectId = /^[a-f\d]{24}$/i.test(req.query.parliament);
      if (isObjectId) {
        query = query.where('parliament_id').equals(req.query.parliament);
      } else {
        const parliamentDoc = await Parliament.findOne({ name: req.query.parliament });
        if (parliamentDoc) {
          query = query.where('parliament_id').equals(parliamentDoc._id);
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
      if (uh.booth) query = query.where('_id').equals(uh.booth._id);
      else if (uh.block) query = query.where('block_id').equals(uh.block._id);
      else if (uh.assembly) query = query.where('assembly_id').equals(uh.assembly._id);
      else if (uh.parliament) query = query.where('parliament_id').equals(uh.parliament._id);
      else if (uh.division) query = query.where('division_id').equals(uh.division._id);
      else if (uh.state) query = query.where('state_id').equals(uh.state._id);
    }

    const booths = await query.skip(skip).limit(limit).exec();
    const total = await Booth.countDocuments(query.getFilter());

    res.status(200).json({
      success: true,
      count: booths.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: booths
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single booth
// @route   GET /api/booths/:id
// @access  Public
exports.getBooth = async (req, res, next) => {
  try {
    const booth = await Booth.findById(req.params.id)
      .populate('block_id', 'name')
      .populate('assembly_id', 'name')
      .populate('parliament_id', 'name')
      .populate('division_id', 'name')
      .populate('state_id', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    if (!booth) {
      return res.status(404).json({
        success: false,
        message: 'Booth not found'
      });
    }

    // Enforce user hierarchy for single booth resource
    if (req.userHierarchy && req.user && req.user.role !== 'superAdmin') {
      const uh = req.userHierarchy;
      const outside = (
        (uh.booth && booth._id.toString() !== uh.booth._id.toString()) ||
        (uh.block && booth.block_id?.toString() !== uh.block._id.toString()) ||
        (uh.assembly && booth.assembly_id?.toString() !== uh.assembly._id.toString()) ||
        (uh.parliament && booth.parliament_id?.toString() !== uh.parliament._id.toString()) ||
        (uh.division && booth.division_id?.toString() !== uh.division._id.toString()) ||
        (uh.state && booth.state_id?.toString() !== uh.state._id.toString())
      );
      if (outside) {
        return res.status(403).json({ success: false, message: 'Access denied: geographic restriction' });
      }
    }

    res.status(200).json({
      success: true,
      data: booth
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create booth
// @route   POST /api/booths
// @access  Private (Admin only)
exports.createBooth = async (req, res, next) => {
  try {
    // Verify all references exist
    const [block, assembly, parliament, division, state] = await Promise.all([
      Block.findById(req.body.block_id),
      Assembly.findById(req.body.assembly_id),
      Parliament.findById(req.body.parliament_id),
      Division.findById(req.body.division_id),
      State.findById(req.body.state_id)
    ]);

    if (!block) {
      return res.status(400).json({ success: false, message: 'Block not found' });
    }
    if (!assembly) {
      return res.status(400).json({ success: false, message: 'Assembly not found' });
    }
    if (!parliament) {
      return res.status(400).json({ success: false, message: 'Parliament not found' });
    }
    if (!division) {
      return res.status(400).json({ success: false, message: 'Division not found' });
    }
    if (!state) {
      return res.status(400).json({ success: false, message: 'State not found' });
    }

    // Check if user exists in request
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }

    const boothData = {
      ...req.body,
      created_by: req.user.id
    };

    if (req.body.polygon) {
      boothData.polygon = req.body.polygon;
    }

    const booth = await Booth.create(boothData);

    res.status(201).json({
      success: true,
      data: booth
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Booth with this number already exists'
      });
    }
    next(err);
  }
};

// @desc    Update booth
// @route   PUT /api/booths/:id
// @access  Private (Admin only)
exports.updateBooth = async (req, res, next) => {
  try {
    let booth = await Booth.findById(req.params.id);

    if (!booth) {
      return res.status(404).json({
        success: false,
        message: 'Booth not found'
      });
    }

    // Verify all references exist if being updated
    const verificationPromises = [];
    if (req.body.block_id) verificationPromises.push(Block.findById(req.body.block_id));
    if (req.body.assembly_id) verificationPromises.push(Assembly.findById(req.body.assembly_id));
    if (req.body.parliament_id) verificationPromises.push(Parliament.findById(req.body.parliament_id));
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

    // Set updated_by
    const updateData = {
      ...req.body,
      updated_by: req.user.id,
      updated_at: Date.now()
    };

    if (req.body.polygon) {
      updateData.polygon = req.body.polygon;
    }

    booth = await Booth.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    })
      .populate('block_id', 'name')
      .populate('assembly_id', 'name')
      .populate('parliament_id', 'name')
      .populate('division_id', 'name')
      .populate('state_id', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    res.status(200).json({
      success: true,
      data: booth
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Booth with this number already exists'
      });
    }
    next(err);
  }
};

// @desc    Delete booth
// @route   DELETE /api/booths/:id
// @access  Private (Admin only)
exports.deleteBooth = async (req, res, next) => {
  try {
    const booth = await Booth.findById(req.params.id);

    if (!booth) {
      return res.status(404).json({
        success: false,
        message: 'Booth not found'
      });
    }

    await booth.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Import booths from Excel
// @route   POST /api/booths/import
// @access  Private/SuperAdmin
exports.importBooths = async (req, res, next) => {
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
        if (!row.name && !row.booth_number) {
          summary.skipped += 1;
          summary.errors.push({ row: i + 1, message: 'Missing booth name or number' });
          continue;
        }

        const geo = await resolveGeographicHierarchy(row);
        const missingFields = validateHierarchy(geo, ['state', 'division', 'parliament', 'assembly', 'block']);
        if (missingFields.length > 0) {
          summary.skipped += 1;
          summary.errors.push({ row: i + 1, message: `Missing: ${missingFields.join(', ')}` });
          continue;
        }

        // Check for duplicates
        const existing = await Booth.findOne({ booth_number: row.booth_number });
        if (existing) {
          summary.skipped += 1;
          summary.errors.push({ row: i + 1, message: `Booth ${row.booth_number} already exists` });
          continue;
        }

        const boothData = {
          name: row.name || `Booth ${row.booth_number}`,
          booth_number: row.booth_number,
          full_address: row.full_address || '',
          latitude: row.latitude || 0,
          longitude: row.longitude || 0,
          block_id: geo.block._id,
          assembly_id: geo.assembly._id,
          parliament_id: geo.parliament._id,
          division_id: geo.division._id,
          state_id: geo.state._id,
          created_by: req.user.id,
          updated_by: req.user.id
        };

        const booth = await Booth.create(boothData);
        created.push(booth._id);
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

// @desc    Upload booth polygon (GeoJSON)
// @route   POST /api/booths/upload-polygon
// @access  Private (Admin only)
exports.uploadBoothPolygon = async (req, res, next) => {
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
      const boothNumber = props.booth_number || props.BOOTH_NUMBER || props['Booth Number'] || props.BoothNumber;
      const boothName = props.name || props.NAME || props.Name || props.booth_name || props.BOOTH_NAME;

      if (!boothNumber && !boothName) {
        errors.push('Feature passed without a valid match property (booth_number or name)');
        continue;
      }

      let booth = null;

      // Try finding by booth number first if available
      if (boothNumber) {
        booth = await Booth.findOne({ booth_number: Number(boothNumber) });
      }

      // If not found by number, try by name
      if (!booth && boothName) {
        booth = await Booth.findOne({
          name: { $regex: new RegExp(`^${boothName}$`, 'i') }
        });
      }

      if (booth) {
        // Update booth with polygon feature - only keep booth_id in properties
        booth.polygon = {
          type: feature.type,
          geometry: feature.geometry,
          properties: {
            booth_id: booth._id
          }
        };
        await booth.save();
        updatedCount++;
      } else {
        errors.push(`Booth not found for: booth_number=${boothNumber}, name=${boothName}`);
      }
    }

    if (updatedCount === 0 && errors.length > 0) {
      return res.status(404).json({
        success: false,
        message: 'No booths matched',
        errors
      });
    }

    res.status(200).json({
      success: true,
      message: `Successfully updated polygons for ${updatedCount} booths`,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (err) {
    next(err);
  }
};


// @desc    Get total booths count
// @route   GET /api/total-booths
// @access  Public
exports.getTotalBooths = async (req, res, next) => {
  try {
    const total = await Booth.countDocuments();
    res.status(200).json({
      success: true,
      total
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all booth-related data from all tables
// @route   GET /api/booths/:id/related-data
// @access  Public
exports.getBoothRelatedData = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booth ID'
      });
    }

    const booth = await Booth.findById(id)
      .populate('block_id', 'name')
      .populate('assembly_id', 'name')
      .populate('parliament_id', 'name')
      .populate('division_id', 'name')
      .populate('state_id', 'name')
      .populate('created_by', 'username');

    if (!booth) {
      return res.status(404).json({
        success: false,
        message: 'Booth not found'
      });
    }

    // Fetch all related data from all tables with booth_id
    const BoothDemographics = require('../models/boothDemographics');
    const BoothElectionStats = require('../models/boothElectionStats');
    const BoothInfrastructure = require('../models/boothInfrastructure');
    const BoothPartyPresence = require('../models/boothPartyPresence');
    const BoothPartyVoteShare = require('../models/boothPartyVoteShare');
    const BoothSurvey = require('../models/BoothSurvey');
    const BoothVolunteers = require('../models/boothVolunteers');
    const BoothVotes = require('../models/boothVotes');
    const BoothAdmin = require('../models/boothAdmin');
    const ActiveParty = require('../models/ActiveParty');
    const ElectionType = require('../models/electionType');
    const Coding = require('../models/coding');
    const CasteList = require('../models/CasteList');
    const Event = require('../models/Event');
    const Gender = require('../models/gender');
    const Falliya = require('../models/Falliya');
    const BLA = require('../models/BLA');
    const BLO = require('../models/BLO');
    const LocalIssue = require('../models/LocalIssue');
    const LocalNews = require('../models/LocalNews');
    const LocalDynamics = require('../models/localDynamics');
    const Influencer = require('../models/influencer');
    const Government = require('../models/government');
    const PartyActivity = require('../models/partyActivity');
    const Panchayat = require('../models/Panchayat');
    const Village = require('../models/Village');
    const Samiti = require('../models/Samiti');
    const Visit = require('../models/Visit');
    const VotingTrends = require('../models/votingTrends');
    const WinningParty = require('../models/WinningParty');
    const WorkStatus = require('../models/WorkStatus');
    const ParliamentVotes = require('../models/parliamentVotes');
    const BlockVotes = require('../models/blockVotes');
    const AssemblyVotes = require('../models/assemblyVotes');

    const [
      demographics,
      electionStats,
      infrastructure,
      partyPresence,
      partyVoteShare,
      surveys,
      volunteers,
      votes,
      admins,
      activeParties,
      electionTypes,
      coding,
      casteLists,
      events,
      genders,
      falliya,
      bla,
      blo,
      localIssues,
      localNews,
      localDynamics,
      influencers,
      governments,
      partyActivities,
      panchayats,
      villages,
      samitis,
      visits,
      votingTrends,
      winningParties,
      workStatus,
      parliamentVotes,
      blockVotes,
      assemblyVotes
    ] = await Promise.all([
      BoothDemographics.find({ booth_id: id }).populate('booth_id', 'name').limit(100),
      BoothElectionStats.find({ booth_id: id }).populate('booth_id', 'name').limit(100),
      BoothInfrastructure.find({ booth_id: id }).populate('booth_id', 'name').limit(100),
      BoothPartyPresence.find({ booth_id: id }).populate('booth_id', 'name').limit(100),
      BoothPartyVoteShare.find({ booth_id: id }).populate('booth_id', 'name').limit(100),
      BoothSurvey.find({ booth_id: id }).populate('booth_id', 'name').limit(100),
      BoothVolunteers.find({ booth_id: id }).populate('booth_id', 'name').limit(100),
      BoothVotes.find({ booth_id: id }).populate('booth_id', 'name').limit(100),
      BoothAdmin.find({ booth_id: id }).populate('booth_id', 'name').limit(100),
      ActiveParty.find({ booth_id: id }).populate('booth_id', 'name').limit(100),
      ElectionType.find({ booth_id: id }).populate('booth_id', 'name').limit(100),
      Coding.find({ booth_id: id }).populate('booth_id', 'name').limit(100),
      CasteList.find({ booth_id: id }).populate('booth_id', 'name').limit(100),
      Event.find({ booth_id: id }).populate('booth_id', 'name').limit(100),
      Gender.find({ booth_id: id }).populate('booth_id', 'name').limit(100),
      Falliya.find({ booth_id: id }).populate('booth_id', 'name').limit(100),
      BLA.find({ booth_id: id }).populate('booth_id', 'name').limit(100),
      BLO.find({ booth_id: id }).populate('booth_id', 'name').limit(100),
      LocalIssue.find({ booth_id: id }).populate('booth_id', 'name').limit(100),
      LocalNews.find({ booth_id: id }).populate('booth_id', 'name').limit(100),
      LocalDynamics.find({ booth_id: id }).populate('booth_id', 'name').limit(100),
      Influencer.find({ booth_id: id }).populate('booth_id', 'name').limit(100),
      Government.find({ booth_id: id }).populate('booth_id', 'name').limit(100),
      PartyActivity.find({ booth_id: id }).populate('booth_id', 'name').limit(100),
      Panchayat.find({ booth_id: id }).populate('booth_id', 'name').limit(100),
      Village.find({ booth_id: id }).populate('booth_id', 'name').limit(100),
      Samiti.find({ booth_id: id }).populate('booth_id', 'name').limit(100),
      Visit.find({ booth_id: id }).populate('booth_id', 'name').limit(100),
      VotingTrends.find({ booth_id: id }).populate('booth_id', 'name').limit(100),
      WinningParty.find({ booth_id: id }).populate('booth_id', 'name').limit(100),
      WorkStatus.find({ booth_id: id }).populate('booth_id', 'name').limit(100),
      ParliamentVotes.find({ booth_id: id }).populate('booth_id', 'name').limit(100),
      BlockVotes.find({ booth_id: id }).populate('booth_id', 'name').limit(100),
      AssemblyVotes.find({ booth_id: id }).populate('booth_id', 'name').limit(100)
    ]);

    res.status(200).json({
      success: true,
      data: {
        booth,
        demographics: { count: demographics.length, data: demographics },
        electionStats: { count: electionStats.length, data: electionStats },
        infrastructure: { count: infrastructure.length, data: infrastructure },
        partyPresence: { count: partyPresence.length, data: partyPresence },
        partyVoteShare: { count: partyVoteShare.length, data: partyVoteShare },
        surveys: { count: surveys.length, data: surveys },
        volunteers: { count: volunteers.length, data: volunteers },
        votes: { count: votes.length, data: votes },
        admins: { count: admins.length, data: admins },
        activeParties: { count: activeParties.length, data: activeParties },
        electionTypes: { count: electionTypes.length, data: electionTypes },
        coding: { count: coding.length, data: coding },
        casteLists: { count: casteLists.length, data: casteLists },
        events: { count: events.length, data: events },
        genders: { count: genders.length, data: genders },
        falliya: { count: falliya.length, data: falliya },
        bla: { count: bla.length, data: bla },
        blo: { count: blo.length, data: blo },
        localIssues: { count: localIssues.length, data: localIssues },
        localNews: { count: localNews.length, data: localNews },
        localDynamics: { count: localDynamics.length, data: localDynamics },
        influencers: { count: influencers.length, data: influencers },
        governments: { count: governments.length, data: governments },
        partyActivities: { count: partyActivities.length, data: partyActivities },
        panchayats: { count: panchayats.length, data: panchayats },
        villages: { count: villages.length, data: villages },
        samitis: { count: samitis.length, data: samitis },
        visits: { count: visits.length, data: visits },
        votingTrends: { count: votingTrends.length, data: votingTrends },
        winningParties: { count: winningParties.length, data: winningParties },
        workStatus: { count: workStatus.length, data: workStatus },
        parliamentVotes: { count: parliamentVotes.length, data: parliamentVotes },
        blockVotes: { count: blockVotes.length, data: blockVotes },
        assemblyVotes: { count: assemblyVotes.length, data: assemblyVotes }
      }
    });
  } catch (err) {
    next(err);
  }
};
