const mongoose = require('mongoose');
const Assembly = require('../models/Assembly');
const Parliament = require('../models/Parliament');
const Division = require('../models/Division');
const State = require('../models/state');

// Helper to validate ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// @desc    Get all assemblies
// @route   GET /api/assemblies
// @access  Public
exports.getAssemblies = async (req, res, next) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit);

    if (!!req.query.search || !limit || limit <= 0) {
      limit = 10000;
    }
    const skip = (page - 1) * limit;

    let query = Assembly.find()
      .populate('parliament_id', 'name')
      .populate('division_id', 'name')
      .populate('state_id', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username')
      .sort({ AC_NO: 1 });

    // Enhanced search functionality
    if (req.query.search) {
      const searchRegex = { $regex: req.query.search, $options: 'i' };
      query = query.find({
        $or: [
          { name: searchRegex },
          { description: searchRegex },
          { type: searchRegex },
          { category: searchRegex }
        ]
      });
    }

    // Filter by type
    if (req.query.type) {
      query = query.where('type').equals(req.query.type);
    }

    // Filter by category
    if (req.query.category) {
      query = query.where('category').equals(req.query.category);
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
      if (uh.booth) query = query.where('booth_id').equals(uh.booth._id);
      else if (uh.block) query = query.where('block_id').equals(uh.block._id);
      else if (uh.assembly) query = query.where('_id').equals(uh.assembly._id);
      else if (uh.parliament) query = query.where('parliament_id').equals(uh.parliament._id);
      else if (uh.division) query = query.where('division_id').equals(uh.division._id);
      else if (uh.state) query = query.where('state_id').equals(uh.state._id);
    }

    // Filter by active status
    if (req.query.is_active !== undefined) {
      query = query.where('is_active').equals(req.query.is_active === 'true');
    }

    const assemblies = await query.skip(skip).limit(limit).exec();
    const total = await Assembly.countDocuments(query.getFilter());

    res.status(200).json({
      success: true,
      count: assemblies.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: assemblies
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single assembly
// @route   GET /api/assemblies/:id
// @access  Public
exports.getAssembly = async (req, res, next) => {
  try {
    const assembly = await Assembly.findById(req.params.id)
      .populate('parliament_id', 'name')
      .populate('division_id', 'name')
      .populate('state_id', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    if (!assembly) {
      return res.status(404).json({
        success: false,
        message: 'Assembly not found'
      });
    }

    // Enforce user hierarchy for single assembly resource
    if (req.userHierarchy && req.user && req.user.role !== 'superAdmin') {
      const uh = req.userHierarchy;
      const outside = (
        (uh.assembly && assembly._id.toString() !== uh.assembly._id.toString()) ||
        (uh.parliament && assembly.parliament_id?.toString() !== uh.parliament._id.toString()) ||
        (uh.division && assembly.division_id?.toString() !== uh.division._id.toString()) ||
        (uh.state && assembly.state_id?.toString() !== uh.state._id.toString())
      );
      if (outside) {
        return res.status(403).json({ success: false, message: 'Access denied: geographic restriction' });
      }
    }

    res.status(200).json({
      success: true,
      data: assembly
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create assembly
// @route   POST /api/assemblies
// @access  Private (Admin only)
exports.createAssembly = async (req, res, next) => {
  try {
    // Verify all references exist
    const [parliament, division, state] = await Promise.all([
      Parliament.findById(req.body.parliament_id),
      Division.findById(req.body.division_id),
      State.findById(req.body.state_id)
    ]);

    if (!parliament) {
      return res.status(400).json({ success: false, message: 'Parliament not found' });
    }
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

    const assemblyData = {
      ...req.body,
      created_by: req.user.id,
      description: req.body.description || ''
    };

    if (req.body.polygon) {
      assemblyData.polygon = req.body.polygon;
    }

    const assembly = await Assembly.create(assemblyData);

    res.status(201).json({
      success: true,
      data: assembly
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Assembly with this AC number already exists'
      });
    }
    next(err);
  }
};

// @desc    Update assembly
// @route   PUT /api/assemblies/:id
// @access  Private (Admin only)
exports.updateAssembly = async (req, res, next) => {
  try {
    let assembly = await Assembly.findById(req.params.id);

    if (!assembly) {
      return res.status(404).json({
        success: false,
        message: 'Assembly not found'
      });
    }

    // Verify all references exist if being updated
    const verificationPromises = [];
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

    const updateData = {
      ...req.body,
      updated_by: req.user.id,
      description: req.body.description || '',
      updated_at: Date.now()
    };

    if (req.body.polygon) {
      updateData.polygon = req.body.polygon;
    }

    assembly = await Assembly.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    })
      .populate('parliament_id', 'name')
      .populate('division_id', 'name')
      .populate('state_id', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    res.status(200).json({
      success: true,
      data: assembly
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Assembly with this AC number already exists'
      });
    }
    next(err);
  }
};

// @desc    Delete assembly
// @route   DELETE /api/assemblies/:id
// @access  Private (Admin only)
exports.deleteAssembly = async (req, res, next) => {
  try {
    const assembly = await Assembly.findById(req.params.id);

    if (!assembly) {
      return res.status(404).json({
        success: false,
        message: 'Assembly not found'
      });
    }

    await assembly.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Import assemblies from Excel
// @route   POST /api/assemblies/import
// @access  Private/SuperAdmin
exports.importAssemblies = async (req, res, next) => {
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
          summary.errors.push({ row: i + 1, message: 'Missing assembly name' });
          continue;
        }

        const geo = await resolveGeographicHierarchy(row);
        const missingFields = validateHierarchy(geo, ['state', 'division', 'parliament']);
        if (missingFields.length > 0) {
          summary.skipped += 1;
          summary.errors.push({ row: i + 1, message: `Missing: ${missingFields.join(', ')}` });
          continue;
        }

        // Check for duplicates
        const existing = await Assembly.findOne({ AC_NO: row.AC_NO || row.ac_no });
        if (existing) {
          summary.skipped += 1;
          summary.errors.push({ row: i + 1, message: `Assembly AC_NO ${row.AC_NO || row.ac_no} already exists` });
          continue;
        }

        const assemblyData = {
          name: row.name,
          AC_NO: row.AC_NO || row.ac_no,
          type: row.type || 'Urban',
          category: row.category || 'General',
          parliament_id: geo.parliament._id,
          division_id: geo.division._id,
          state_id: geo.state._id,
          created_by: req.user.id,
          updated_by: req.user.id
        };

        const assembly = await Assembly.create(assemblyData);
        created.push(assembly._id);
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

// @desc    Upload assembly polygon (GeoJSON)
// @route   POST /api/assemblies/upload-polygon
// @access  Private (Admin only)
exports.uploadAssemblyPolygon = async (req, res, next) => {
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
      const acNo = props.AC_NO || props.ac_no || props.OBJECTID;
      const assemblyName = props.STNAME || props.name || props.Name || props.NAME;

      if (!acNo && !assemblyName) {
        errors.push('Feature passed without a valid match property (AC_NO or name)');
        continue;
      }

      let assembly = null;

      // Try finding by AC_NO first if available
      if (acNo) {
        assembly = await Assembly.findOne({ AC_NO: Number(acNo) });
      }

      // If not found by AC_NO, try by name
      if (!assembly && assemblyName) {
        assembly = await Assembly.findOne({
          name: { $regex: new RegExp(`^${assemblyName}$`, 'i') }
        });
      }

      if (assembly) {
        // Update assembly with polygon feature - only keep assembly_id in properties
        assembly.polygon = {
          type: feature.type,
          geometry: feature.geometry,
          properties: {
            assembly_id: assembly._id
          }
        };
        await assembly.save();
        updatedCount++;
      } else {
        errors.push(`Assembly not found for: AC_NO=${acNo}, name=${assemblyName}`);
      }
    }

    if (updatedCount === 0 && errors.length > 0) {
      return res.status(404).json({
        success: false,
        message: 'No assemblies matched',
        errors
      });
    }

    res.status(200).json({
      success: true,
      message: `Successfully updated polygons for ${updatedCount} assemblies`,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (err) {
    next(err);
  }
};

// @desc    Get total assemblies count
// @route   GET /api/total-assemblies
// @access  Public
exports.getTotalAssemblies = async (req, res, next) => {
  try {
    const total = await Assembly.countDocuments();
    res.status(200).json({
      success: true,
      total
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all assembly-related data from all tables
// @route   GET /api/assemblies/:id/related-data
// @access  Public
exports.getAssemblyRelatedData = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid assembly ID'
      });
    }

    const assembly = await Assembly.findById(id)
      .populate('parliament_id', 'name')
      .populate('division_id', 'name')
      .populate('state_id', 'name')
      .populate('created_by', 'username');

    if (!assembly) {
      return res.status(404).json({
        success: false,
        message: 'Assembly not found'
      });
    }

    // Fetch all related data from tables with assembly_id
    const Booth = require('../models/booth');
    const AssemblyVotes = require('../models/assemblyVotes');
    const BoothDemographics = require('../models/boothDemographics');
    const BoothElectionStats = require('../models/boothElectionStats');
    const BoothInfrastructure = require('../models/boothInfrastructure');
    const BoothPartyPresence = require('../models/boothPartyPresence');
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
    const WinningCandidate = require('../models/winningCandidate');
    const WorkStatus = require('../models/WorkStatus');
    const ParliamentVotes = require('../models/parliamentVotes');
    const BlockVotes = require('../models/blockVotes');
    const District = require('../models/District');

    const [
      booths,
      assemblyVotes,
      boothDemographics,
      boothElectionStats,
      boothInfrastructure,
      boothPartyPresence,
      boothVolunteers,
      boothVotes,
      boothAdmins,
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
      winningCandidates,
      workStatus,
      parliamentVotes,
      blockVotes,
      districts
    ] = await Promise.all([
      Booth.find({ assembly_id: id }).populate('assembly_id', 'name').limit(100),
      AssemblyVotes.find({ assembly_id: id }).populate('assembly_id', 'name').limit(100),
      BoothDemographics.find({ assembly_id: id }).populate('assembly_id', 'name').limit(100),
      BoothElectionStats.find({ assembly_id: id }).populate('assembly_id', 'name').limit(100),
      BoothInfrastructure.find({ assembly_id: id }).populate('assembly_id', 'name').limit(100),
      BoothPartyPresence.find({ assembly_id: id }).populate('assembly_id', 'name').limit(100),
      BoothVolunteers.find({ assembly_id: id }).populate('assembly_id', 'name').limit(100),
      BoothVotes.find({ assembly_id: id }).populate('assembly_id', 'name').limit(100),
      BoothAdmin.find({ assembly_id: id }).populate('assembly_id', 'name').limit(100),
      ActiveParty.find({ assembly_id: id }).populate('assembly_id', 'name').limit(100),
      ElectionType.find({ assembly_id: id }).populate('assembly_id', 'name').limit(100),
      Coding.find({ assembly_id: id }).populate('assembly_id', 'name').limit(100),
      CasteList.find({ assembly_id: id }).populate('assembly_id', 'name').limit(100),
      Event.find({ assembly_id: id }).populate('assembly_id', 'name').limit(100),
      Gender.find({ assembly_id: id }).populate('assembly_id', 'name').limit(100),
      Falliya.find({ assembly_id: id }).populate('assembly_id', 'name').limit(100),
      BLA.find({ assembly_id: id }).populate('assembly_id', 'name').limit(100),
      BLO.find({ assembly_id: id }).populate('assembly_id', 'name').limit(100),
      LocalIssue.find({ assembly_id: id }).populate('assembly_id', 'name').limit(100),
      LocalNews.find({ assembly_id: id }).populate('assembly_id', 'name').limit(100),
      LocalDynamics.find({ assembly_id: id }).populate('assembly_id', 'name').limit(100),
      Influencer.find({ assembly_id: id }).populate('assembly_id', 'name').limit(100),
      Government.find({ assembly_id: id }).populate('assembly_id', 'name').limit(100),
      PartyActivity.find({ assembly_id: id }).populate('assembly_id', 'name').limit(100),
      Panchayat.find({ assembly_id: id }).populate('assembly_id', 'name').limit(100),
      Village.find({ assembly_id: id }).populate('assembly_id', 'name').limit(100),
      Samiti.find({ assembly_id: id }).populate('assembly_id', 'name').limit(100),
      Visit.find({ assembly_id: id }).populate('assembly_id', 'name').limit(100),
      VotingTrends.find({ assembly_id: id }).populate('assembly_id', 'name').limit(100),
      WinningParty.find({ assembly_id: id }).populate('assembly_id', 'name').limit(100),
      WinningCandidate.find({ assembly_id: id }).populate('assembly_id', 'name').limit(100),
      WorkStatus.find({ assembly_id: id }).populate('assembly_id', 'name').limit(100),
      ParliamentVotes.find({ assembly_id: id }).populate('assembly_id', 'name').limit(100),
      BlockVotes.find({ assembly_id: id }).populate('assembly_id', 'name').limit(100),
      District.find({ assembly_id: id }).populate('assembly_id', 'name').limit(100)
    ]);

    res.status(200).json({
      success: true,
      data: {
        assembly,
        booths: { count: booths.length, data: booths },
        assemblyVotes: { count: assemblyVotes.length, data: assemblyVotes },
        boothDemographics: { count: boothDemographics.length, data: boothDemographics },
        boothElectionStats: { count: boothElectionStats.length, data: boothElectionStats },
        boothInfrastructure: { count: boothInfrastructure.length, data: boothInfrastructure },
        boothPartyPresence: { count: boothPartyPresence.length, data: boothPartyPresence },
        boothVolunteers: { count: boothVolunteers.length, data: boothVolunteers },
        boothVotes: { count: boothVotes.length, data: boothVotes },
        boothAdmins: { count: boothAdmins.length, data: boothAdmins },
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
        winningCandidates: { count: winningCandidates.length, data: winningCandidates },
        workStatus: { count: workStatus.length, data: workStatus },
        parliamentVotes: { count: parliamentVotes.length, data: parliamentVotes },
        blockVotes: { count: blockVotes.length, data: blockVotes },
        districts: { count: districts.length, data: districts }
      }
    });
  } catch (err) {
    next(err);
  }
};
