const Division = require('../models/Division');
const State = require('../models/state');
const User = require('../models/User'); // Make sure to import your User model
const ErrorResponse = require('../utils/errorResponse');
const { autoLinkDivisionData, autoLinkByHierarchy } = require('./divisionAutoLinkHelper');

// Helper function for consistent population
const populateDivision = (query) => {
  return query
    .populate({
      path: 'state_id',
      select: '_id name'
    })
    .populate({
      path: 'created_by',
      select: 'name username email', // Include all fields you want
      model: 'User' // Explicit model reference
    })
    .populate({
      path: 'updated_by',
      select: 'name username email',
      model: 'User'
    });
};

// @desc    Get all divisions
// @route   GET /api/divisions
// @access  Public
exports.getDivisions = async (req, res, next) => {
  try {
    // Pagination
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit);
    // If searching, ignore pagination and return all results (set high limit)
    const isSearching = !!req.query.search;
    if (isSearching) {
      limit = 10000;
      page = 1;
    } else {
      if (!limit || limit <= 0) {
        limit = 10000;
      }
    }
    const skip = (page - 1) * limit;

    // Basic query
    let filter = {};
    if (req.query.division) {
      filter.name = req.query.division;
    }
    let query = Division.find(filter);
    query = populateDivision(query);
    query = query.sort({ name: 1 });

    // Enhanced search functionality: only apply regex to string fields
    if (req.query.search) {
      const searchRegex = { $regex: req.query.search, $options: 'i' };
      query = query.find({
        $or: [
          { name: searchRegex },
          { division_code: searchRegex }
        ]
      });
    }

    // Filter by state (ObjectId or name, dash-to-space, case-insensitive)
    if (req.query.state) {
      let stateValue = req.query.state.replace(/-/g, ' ');
      const isObjectId = /^[a-f\d]{24}$/i.test(stateValue);
      let stateId = null;
      if (isObjectId) {
        stateId = stateValue;
      } else {
        const stateDoc = await State.findOne({ name: { $regex: stateValue, $options: 'i' } });
        stateId = stateDoc ? stateDoc._id : null;
      }
      if (stateId) {
        query = query.where('state_id').equals(stateId);
      } else {
        return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
      }
    }

    // Apply user hierarchy restriction when an authenticated user is present
    if (req.user && req.user.role !== 'superAdmin' && req.userHierarchy) {
      const h = req.userHierarchy;
      if (h.division_id) {
        query = query.where('_id').equals(h.division_id);
      } else if (h.state_id) {
        query = query.where('state_id').equals(h.state_id);
      }
    }

    const divisions = await query.skip(skip).limit(limit).exec();
    const total = await Division.countDocuments(query.getFilter());

    res.status(200).json({
      success: true,
      count: divisions.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: divisions
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single division
// @route   GET /api/divisions/:id
// @access  Public
exports.getDivision = async (req, res, next) => {
  try {
    let query = Division.findById(req.params.id);
    query = populateDivision(query);
    const division = await query.exec();

    if (!division) {
      return next(new ErrorResponse(`Division not found with id of ${req.params.id}`, 404));
    }

    // Enforce user hierarchy for single division
    if (req.user && req.user.role !== 'superAdmin' && req.userHierarchy) {
      const h = req.userHierarchy;
      if (h.division_id && h.division_id.toString() !== division._id.toString()) {
        return res.status(403).json({ success: false, message: 'Forbidden: resource outside your geographic scope' });
      }
      if (h.state_id && division.state_id && h.state_id.toString() !== division.state_id.toString()) {
        return res.status(403).json({ success: false, message: 'Forbidden: resource outside your geographic scope' });
      }
    }

    res.status(200).json({
      success: true,
      data: division
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create division
// @route   POST /api/divisions
// @access  Private (Admin only)
exports.createDivision = async (req, res, next) => {
  try {
    // Verify state exists
    const state = await State.findById(req.body.state_id);
    if (!state) {
      return next(new ErrorResponse('State not found', 404));
    }

    // Check if division code is already taken
    const isCodeTaken = await Division.isDivisionCodeTaken(req.body.division_code);
    if (isCodeTaken) {
      return next(new ErrorResponse('Division code already in use', 400));
    }

    // Check if user exists in request
    if (!req.user || !req.user.id) {
      return next(new ErrorResponse('Not authorized - user not identified', 401));
    }

    const divisionData = {
      ...req.body,
      description: req.body.description || '',
      created_by: req.user.id
    };

    const division = await Division.create(divisionData);
    const populatedDivision = await populateDivision(Division.findById(division._id));

    // Auto-link related data to this division
    await autoLinkDivisionData(division._id, division.name);
    await autoLinkByHierarchy(division._id);

    res.status(201).json({
      success: true,
      data: populatedDivision
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update division
// @route   PUT /api/divisions/:id
// @access  Private (Admin only)
exports.updateDivision = async (req, res, next) => {
  try {
    // Verify division exists
    let division = await Division.findById(req.params.id);
    if (!division) {
      return next(new ErrorResponse(`Division not found with id of ${req.params.id}`, 404));
    }

    // Verify state exists if being updated
    if (req.body.state_id) {
      const state = await State.findById(req.body.state_id);
      if (!state) {
        return next(new ErrorResponse('State not found', 404));
      }
    }

    // Check if division code is already taken (excluding current division)
    if (req.body.division_code) {
      const isCodeTaken = await Division.isDivisionCodeTaken(req.body.division_code, req.params.id);
      if (isCodeTaken) {
        return next(new ErrorResponse('Division code already in use', 400));
      }
    }

    // Set updated_by to current user
    if (req.user && req.user.id) {
      req.body.updated_by = req.user.id;
    }
    req.body.updated_at = new Date();

    const updateData = {
      ...req.body,
      description: req.body.description || '',
    };
    division = await Division.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    const populatedDivision = await populateDivision(Division.findById(division._id));

    // Auto-link related data to this division (in case name changed or new data was added)
    await autoLinkDivisionData(division._id, division.name);
    await autoLinkByHierarchy(division._id);

    res.status(200).json({
      success: true,
      data: populatedDivision
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete division
// @route   DELETE /api/divisions/:id
// @access  Private (Admin only)
exports.deleteDivision = async (req, res, next) => {
  try {
    const division = await Division.findById(req.params.id);

    if (!division) {
      return next(new ErrorResponse(`Division not found with id of ${req.params.id}`, 404));
    }

    await division.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get divisions by state
// @route   GET /api/divisions/state/:stateId
// @access  Public
exports.getDivisionsByState = async (req, res, next) => {
  try {
    // Verify state exists
    const state = await State.findById(req.params.stateId);
    if (!state) {
      return next(new ErrorResponse('State not found', 404));
    }

    let query = Division.find({ state_id: req.params.stateId }).sort({ name: 1 });
    query = populateDivision(query);
    // Enforce user hierarchy for divisions-by-state
    if (req.user && req.user.role !== 'superAdmin' && req.userHierarchy) {
      const h = req.userHierarchy;
      if (h.state_id && h.state_id.toString() !== req.params.stateId) {
        return res.status(403).json({ success: false, message: 'Forbidden: resource outside your geographic scope' });
      }
      if (h.division_id) {
        // If user is scoped to a division, ensure it belongs to this state
        const div = await Division.findById(h.division_id);
        if (!div || div.state_id.toString() !== req.params.stateId) {
          return res.status(403).json({ success: false, message: 'Forbidden: resource outside your geographic scope' });
        }
      }
    }
    const divisions = await query.exec();

    res.status(200).json({
      success: true,
      count: divisions.length,
      data: divisions
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Debug endpoint for population issues
// @route   GET /api/divisions/:id/debug
// @access  Private (Admin only)
exports.debugDivision = async (req, res, next) => {
  try {
    const division = await Division.findById(req.params.id);

    if (!division) {
      return next(new ErrorResponse('Division not found', 404));
    }

    // Check if referenced users exist
    const createdUser = await User.findById(division.created_by);
    const updatedUser = await User.findById(division.updated_by || division.created_by);

    // Test population
    const testPopulated = await populateDivision(Division.findById(req.params.id));

    res.status(200).json({
      success: true,
      division_exists: !!division,
      created_user_exists: !!createdUser,
      updated_user_exists: !!updatedUser,
      created_user: createdUser,
      updated_user: updatedUser,
      populated_data: testPopulated
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Import divisions from Excel
// @route   POST /api/divisions/import
// @access  Private/SuperAdmin
exports.importDivisions = async (req, res, next) => {
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
        if (!row.name || !row.division_code) {
          summary.skipped += 1;
          summary.errors.push({ row: i + 1, message: 'Missing name or division_code' });
          continue;
        }

        const geo = await resolveGeographicHierarchy(row);
        const missingFields = validateHierarchy(geo, ['state']);
        if (missingFields.length > 0) {
          summary.skipped += 1;
          summary.errors.push({ row: i + 1, message: `Missing: ${missingFields.join(', ')}` });
          continue;
        }

        // Check for duplicates
        const existing = await Division.findOne({ division_code: row.division_code });
        if (existing) {
          summary.skipped += 1;
          summary.errors.push({ row: i + 1, message: `Division code ${row.division_code} already exists` });
          continue;
        }

        const divisionData = {
          name: row.name,
          division_code: row.division_code,
          description: row.description || '',
          state_id: geo.state._id,
          created_by: req.user.id,
          updated_by: req.user.id
        };

        const division = await Division.create(divisionData);
        created.push(division._id);
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

// @desc    Upload division polygon (GeoJSON)
// @route   POST /api/divisions/upload-polygon
// @access  Private (Admin only)
exports.uploadDivisionPolygon = async (req, res, next) => {
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
      // Try to find division by name variants or code
      // Adjust these property names based on what standard GeoJSONs usually have for Divisions/Districts
      const divisionName = props.DIVNAME || props.DIVNAME_E || props.DIV_NAME || props.name || props.Name || props.NAME;
      // Also potentially look for code if available in properties
      // const divisionCode = props.DIVCODE || props.CODE; // optional logic

      if (!divisionName) {
        errors.push('Feature passed without a valid name property (DIVNAME, DIVNAME_E, name)');
        continue;
      }

      // Case-insensitive search
      // We might need to restrict by State if state info is inside the polygon properties?
      // For now, doing a global name search or name + state search if state provided in query???
      // The current requirement is likely just name matching.

      const division = await Division.findOne({
        name: { $regex: new RegExp(`^${divisionName}$`, 'i') }
      });

      if (division) {
        // Update division with polygon feature
        division.polygon = feature;
        // Optionally update other metadata if needed
        await division.save();
        updatedCount++;
      } else {
        errors.push(`Division not found for: ${divisionName}`);
      }
    }

    if (updatedCount === 0 && errors.length > 0) {
      return res.status(404).json({
        success: false,
        message: 'No divisions matched',
        errors
      });
    }

    res.status(200).json({
      success: true,
      message: `Successfully updated polygons for ${updatedCount} divisions`,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (err) {
    next(err);
  }
};


// @desc    Get all division-related data from all tables
// @route   GET /api/divisions/:id/related-data
// @access  Public
exports.getDivisionRelatedData = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid division ID'
      });
    }

    const division = await Division.findById(id)
      .populate('state_id', 'name')
      .populate('created_by', 'username');

    if (!division) {
      return res.status(404).json({
        success: false,
        message: 'Division not found'
      });
    }

    // Fetch all related data from tables with division_id
    const Assembly = require('../models/Assembly');
    const Block = require('../models/Block');
    const Booth = require('../models/booth');
    const Parliament = require('../models/Parliament');
    const District = require('../models/District');
    const BLO = require('../models/BLO');
    const AssemblyVotes = require('../models/assemblyVotes');
    const BlockVotes = require('../models/blockVotes');
    const BoothVotes = require('../models/boothVotes');
    const ParliamentVotes = require('../models/parliamentVotes');
    const ParliamentCandidate = require('../models/ParliamentCandidate');
    const ElectionType = require('../models/electionType');
    const WinningCandidate = require('../models/winningCandidate');
    const WinningParty = require('../models/WinningParty');
    const BoothDemographics = require('../models/boothDemographics');
    const BoothSurvey = require('../models/BoothSurvey');
    const BoothVolunteers = require('../models/boothVolunteers');
    const CasteList = require('../models/CasteList');
    const Gender = require('../models/gender');
    const BLA = require('../models/BLA');
    const Falliya = require('../models/Falliya');
    const Coding = require('../models/coding');
    const Influencer = require('../models/influencer');
    const Event = require('../models/Event');
    const PartyActivity = require('../models/partyActivity');
    const Visit = require('../models/Visit');
    const Panchayat = require('../models/Panchayat');
    const Village = require('../models/Village');
    const LocalIssue = require('../models/LocalIssue');
    const Samiti = require('../models/Samiti');
    const VotingTrends = require('../models/votingTrends');
    const WorkStatus = require('../models/WorkStatus');

    const [
      assemblies,
      blocks,
      booths,
      parliaments,
      districts,
      blos,
      assemblyVotes,
      blockVotes,
      boothVotes,
      parliamentVotes,
      electionTypes,
      winningCandidates,
      winningParties,
      boothDemographics,
      boothSurveys,
      boothVolunteers,
      casteLists,
      genders,
      blas,
      falliya,
      coding,
      influencers,
      events,
      partyActivities,
      visits,
      panchayats,
      villages,
      localIssues,
      samitis,
      votingTrends,
      workStatus
    ] = await Promise.all([
      Assembly.find({ division_id: id }).populate('division_id', 'name').limit(100),
      Block.find({ division_id: id }).populate('division_id', 'name').limit(100),
      Booth.find({ division_id: id }).populate('division_id', 'name').limit(100),
      Parliament.find({ division_id: id }).populate('division_id', 'name').limit(100),
      District.find({ division_id: id }).populate('division_id', 'name').limit(100),
      BLO.find({ division_id: id }).populate('division_id', 'name').limit(100),
      AssemblyVotes.find({ division_id: id }).populate('division_id', 'name').limit(100),
      BlockVotes.find({ division_id: id }).populate('division_id', 'name').limit(100),
      BoothVotes.find({ division_id: id }).populate('division_id', 'name').populate('parliament_id', 'name').limit(100),
      ParliamentVotes.find({ division_id: id }).populate('division_id', 'name').populate('parliament_id', 'name').limit(100),
      ElectionType.find({ division_id: id }).populate('division_id', 'name').limit(100),
      WinningCandidate.find({ division_id: id }).populate('division_id', 'name').limit(100),
      WinningParty.find({ division_id: id }).populate('division_id', 'name').limit(100),
      BoothDemographics.find({ division_id: id }).populate('division_id', 'name').limit(100),
      BoothSurvey.find({ division_id: id }).populate('division_id', 'name').limit(100),
      BoothVolunteers.find({ division_id: id }).populate('division_id', 'name').limit(100),
      CasteList.find({ division_id: id }).populate('division_id', 'name').limit(100),
      Gender.find({ division_id: id }).populate('division_id', 'name').limit(100),
      BLA.find({ division_id: id }).populate('division_id', 'name').limit(100),
      Falliya.find({ division_id: id }).populate('division_id', 'name').limit(100),
      Coding.find({ division_id: id }).populate('division_id', 'name').limit(100),
      Influencer.find({ division_id: id }).populate('division_id', 'name').limit(100),
      Event.find({ division_id: id }).populate('division_id', 'name').limit(100),
      PartyActivity.find({ division_id: id }).populate('division_id', 'name').limit(100),
      Visit.find({ division_id: id }).populate('division_id', 'name').limit(100),
      Panchayat.find({ division_id: id }).populate('division_id', 'name').limit(100),
      Village.find({ division_id: id }).populate('division_id', 'name').limit(100),
      LocalIssue.find({ division_id: id }).populate('division_id', 'name').limit(100),
      Samiti.find({ division_id: id }).populate('division_id', 'name').limit(100),
      VotingTrends.find({ division_id: id }).populate('division_id', 'name').limit(100),
      WorkStatus.find({ division_id: id }).populate('division_id', 'name').limit(100)
    ]);

    // If no parliament votes exist, aggregate from booth votes
    let aggregatedParliamentVotes = parliamentVotes;
    if (parliamentVotes.length === 0 && boothVotes.length > 0) {
      const votesByParliament = {};
      boothVotes.forEach(bv => {
        if (bv.parliament_id) {
          const key = bv.parliament_id._id || bv.parliament_id;
          if (!votesByParliament[key]) {
            votesByParliament[key] = {
              parliament_id: bv.parliament_id,
              total_votes: 0
            };
          }
          votesByParliament[key].total_votes += bv.total_votes || 0;
        }
      });
      aggregatedParliamentVotes = Object.values(votesByParliament);
    }

    // Fetch parliament candidates for all parliaments in this division
    let parliamentCandidatesData = [];
    if (parliaments.length > 0) {
      const parliamentIds = parliaments.map(p => p._id);
      parliamentCandidatesData = await ParliamentCandidate.find({
        parliament_id: { $in: parliamentIds }
      }).populate('parliament_id', 'name').populate('candidate_id', 'name').limit(200);
    }

    // Calculate division-level statistics from parliament candidates
    let divisionStats = {
      totalVotes: 0,
      totalMaleVoters: 0,
      totalFemaleVoters: 0,
      totalElectors: 0
    };

    parliamentCandidatesData.forEach(candidate => {
      divisionStats.totalVotes += candidate.total_votes_parliament || 0;
      divisionStats.totalMaleVoters += candidate.total_male_voters || 0;
      divisionStats.totalFemaleVoters += candidate.female_voters || 0;
      divisionStats.totalElectors += candidate.electors || 0;
    });

    res.status(200).json({
      success: true,
      data: {
        division,
        assemblies: { count: assemblies.length, data: assemblies },
        blocks: { count: blocks.length, data: blocks },
        booths: { count: booths.length, data: booths },
        parliaments: { count: parliaments.length, data: parliaments },
        districts: { count: districts.length, data: districts },
        blos: { count: blos.length, data: blos },
        assemblyVotes: { count: assemblyVotes.length, data: assemblyVotes },
        blockVotes: { count: blockVotes.length, data: blockVotes },
        boothVotes: { count: boothVotes.length, data: boothVotes },
        parliamentVotes: { count: aggregatedParliamentVotes.length, data: aggregatedParliamentVotes },
        parliamentCandidates: { count: parliamentCandidatesData.length, data: parliamentCandidatesData },
        divisionStats: divisionStats,
        electionTypes: { count: electionTypes.length, data: electionTypes },
        winningCandidates: { count: winningCandidates.length, data: winningCandidates },
        winningParties: { count: winningParties.length, data: winningParties },
        boothDemographics: { count: boothDemographics.length, data: boothDemographics },
        boothSurveys: { count: boothSurveys.length, data: boothSurveys },
        boothVolunteers: { count: boothVolunteers.length, data: boothVolunteers },
        casteLists: { count: casteLists.length, data: casteLists },
        genders: { count: genders.length, data: genders },
        blas: { count: blas.length, data: blas },
        falliya: { count: falliya.length, data: falliya },
        coding: { count: coding.length, data: coding },
        influencers: { count: influencers.length, data: influencers },
        events: { count: events.length, data: events },
        partyActivities: { count: partyActivities.length, data: partyActivities },
        visits: { count: visits.length, data: visits },
        panchayats: { count: panchayats.length, data: panchayats },
        villages: { count: villages.length, data: villages },
        localIssues: { count: localIssues.length, data: localIssues },
        samitis: { count: samitis.length, data: samitis },
        votingTrends: { count: votingTrends.length, data: votingTrends },
        workStatus: { count: workStatus.length, data: workStatus }
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get division polygons as GeoJSON
// @route   GET /api/divisions/polygons
// @access  Public
exports.getDivisionPolygons = async (req, res, next) => {
  try {
    const divisions = await Division.find({ polygon: { $ne: null } })
      .select('name division_code state_id polygon')
      .populate('state_id', 'name');
    
    if (!divisions || divisions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No division polygons found'
      });
    }

    // Transform to GeoJSON FeatureCollection
    const features = divisions.map(division => {
      if (division.polygon && division.polygon.type === 'Feature') {
        return {
          ...division.polygon,
          properties: {
            ...division.polygon.properties,
            _id: division._id,
            name: division.name,
            DIVISION_NAME: division.name,
            division_code: division.division_code,
            ST_NAME: division.state_id?.name || '',
            state_id: division.state_id?._id || division.state_id || ''
          }
        };
      } else if (division.polygon && division.polygon.geometry) {
        return {
          type: 'Feature',
          properties: {
            _id: division._id,
            name: division.name,
            DIVISION_NAME: division.name,
            division_code: division.division_code,
            ST_NAME: division.state_id?.name || '',
            state_id: division.state_id?._id || division.state_id || ''
          },
          geometry: division.polygon.geometry
        };
      }
      return null;
    }).filter(f => f !== null);

    res.status(200).json({
      type: 'FeatureCollection',
      features
    });
  } catch (err) {
    next(err);
  }
};
