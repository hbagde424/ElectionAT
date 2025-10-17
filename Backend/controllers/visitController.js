const mongoose = require('mongoose');
const Visit = require('../models/Visit');
const Booth = require('../models/booth');
const Block = require('../models/block');
const Assembly = require('../models/Assembly');
const Parliament = require('../models/Parliament');
const Division = require('../models/Division');
const State = require('../models/state');
const Candidate = require('../models/Candidate');
const User = require('../models/User');
const ElectionYear = require('../models/electionYear');
const UserHierarchy = require('../models/UserHierarchy');

/**
 * Build hierarchy filter based on user's geographic scope
 * @param {Object} userHierarchy - User's hierarchy data
 * @returns {Object} MongoDB filter object
 */
const buildHierarchyFilter = (userHierarchy) => {
  const filter = {};

  // Apply filters based on user's hierarchy
  if (userHierarchy.state) {
    filter.state_id = userHierarchy.state;
  }
  if (userHierarchy.division) {
    filter.division_id = userHierarchy.division;
  }
  if (userHierarchy.parliament) {
    filter.parliament_id = userHierarchy.parliament;
  }
  if (userHierarchy.assembly) {
    filter.assembly_id = userHierarchy.assembly;
  }
  if (userHierarchy.block) {
    filter.block_id = userHierarchy.block;
  }
  if (userHierarchy.booth) {
    filter.booth_id = userHierarchy.booth;
  }

  return filter;
};

// @desc    Get all visits
// @route   GET /api/visits
// @access  Public
exports.getVisits = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const skip = (page - 1) * limit;

    // Build filter object for counting
    let filter = {};

    // Handle all query parameter for fetching all data without pagination
    const fetchAll = req.query.all === 'true';

    // Apply permission-based filtering if user is authenticated
    if (req.user) {
      console.log('🔍 User data in visits API:', {
        id: req.user._id,
        email: req.user.email,
        role: req.user.role,
        state_ids: req.user.state_ids,
        division_ids: req.user.division_ids
      });

      // Super admin has access to everything - check both email and role
      const isSuperAdmin = req.user.email === 'superadmin@example.com' ||
        req.user.role === 'superAdmin' ||
        req.user.role === 'SuperAdmin';

      console.log('🔍 Is SuperAdmin:', isSuperAdmin);

      if (!isSuperAdmin) {
        try {
          // First check UserHierarchy model
          let userHierarchy = await UserHierarchy.findOne({ user: req.user._id });

          // If no UserHierarchy found, check User model for hierarchical IDs
          if (!userHierarchy) {
            const user = await User.findById(req.user._id);
            if (user && (user.state_ids?.length > 0 || user.division_ids?.length > 0 ||
              user.parliament_ids?.length > 0 || user.assembly_ids?.length > 0 ||
              user.block_ids?.length > 0 || user.booth_ids?.length > 0)) {

              // Create a hierarchy filter from User model data
              const userHierarchyFilter = {};
              if (user.state_ids?.length > 0) userHierarchyFilter.state_id = { $in: user.state_ids };
              if (user.division_ids?.length > 0) userHierarchyFilter.division_id = { $in: user.division_ids };
              if (user.parliament_ids?.length > 0) userHierarchyFilter.parliament_id = { $in: user.parliament_ids };
              if (user.assembly_ids?.length > 0) userHierarchyFilter.assembly_id = { $in: user.assembly_ids };
              if (user.block_ids?.length > 0) userHierarchyFilter.block_id = { $in: user.block_ids };
              if (user.booth_ids?.length > 0) userHierarchyFilter.booth_id = { $in: user.booth_ids };

              // Merge user hierarchy filter with existing filter
              filter = { ...filter, ...userHierarchyFilter };
            }
          } else {
            // Use UserHierarchy model data
            const hierarchyFilter = buildHierarchyFilter(userHierarchy);
            // Merge hierarchy filter with existing filter
            filter = { ...filter, ...hierarchyFilter };
          }
        } catch (error) {
          console.error('Error fetching user hierarchy:', error);
          // Continue without hierarchy filtering if there's an error
        }
      }
    }
    // If no user is authenticated (public access), show all data without filtering

    console.log('🔍 Final filter applied:', filter);

    // Check total visits in database
    const totalVisitsInDB = await Visit.countDocuments();
    console.log('🔍 Total visits in database:', totalVisitsInDB);

    // Basic query for main data fetch
    let query = Visit.find(filter)
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('assembly_id', 'name')
      .populate('parliament_id', 'name')
      .populate('block_id', 'name')
      .populate('booth_id', 'name booth_number')
      .populate({
        path: 'candidate_id',
        select: 'name photo mobile caste education',
        options: { strictPopulate: false }
      })
      .populate('election_year_id', 'year election_type')
      .populate('created_by', 'username')
      .populate('updated_by', 'username')
      .sort({ date: -1 });

    // Enhanced search functionality - search across all fields including populated references
    if (req.query.search) {
      const searchTerm = req.query.search.trim();
      const searchRegex = { $regex: searchTerm, $options: 'i' };

      console.log('🔍 Search term received:', searchTerm);
      console.log('🔍 Search regex:', searchRegex);

      // Debug: Let's also test if we can find "indore" in divisions
      if (searchTerm.toLowerCase() === 'bagh') {
        const indoreDivisions = await Division.find({ name: { $regex: 'indore', $options: 'i' } }).select('_id name');
        console.log('🔍 Found Indore divisions:', indoreDivisions);

        const indoreVisits = await Visit.find({ division_id: { $in: indoreDivisions.map(d => d._id) } }).select('_id division_id');
        console.log('🔍 Visits in Indore divisions:', indoreVisits.length);
      }

      // Find matching IDs from all related collections
      const [
        matchingCandidates,
        matchingStates,
        matchingDivisions,
        matchingAssemblies,
        matchingParliaments,
        matchingBlocks,
        matchingBooths,
        matchingElectionYears
      ] = await Promise.all([
        Candidate.find({ name: searchRegex }).select('_id'),
        State.find({ name: searchRegex }).select('_id'),
        Division.find({ name: searchRegex }).select('_id'),
        Assembly.find({ name: searchRegex }).select('_id'),
        Parliament.find({ name: searchRegex }).select('_id'),
        Block.find({ name: searchRegex }).select('_id'),
        Booth.find({
          $or: [
            { name: searchRegex },
            { booth_number: searchRegex }
          ]
        }).select('_id'),
        ElectionYear.find({
          election_type: searchRegex
        }).select('_id')
      ]);

      console.log('🔍 Matching candidates found:', matchingCandidates.length);
      console.log('🔍 Matching states found:', matchingStates.length);
      console.log('🔍 Matching divisions found:', matchingDivisions.length);
      console.log('🔍 Matching assemblies found:', matchingAssemblies.length);
      console.log('🔍 Matching parliaments found:', matchingParliaments.length);
      console.log('🔍 Matching blocks found:', matchingBlocks.length);
      console.log('🔍 Matching booths found:', matchingBooths.length);
      console.log('🔍 Matching election years found:', matchingElectionYears.length);

      const searchConditions = [
        // Direct string fields
        { post: searchRegex },
        { locationName: searchRegex },
        { visitAgenda: searchRegex },
        { speechFiveLines: searchRegex },
        { speechIssue: searchRegex },
        { remark: searchRegex },
        { workName: searchRegex },
        { work_status: searchRegex },
        { description: searchRegex }
      ];

      // Collect matched ids for each referenced collection so the API can surface them
      const matchedIds = {
        candidateIds: matchingCandidates.map(c => c._id),
        stateIds: matchingStates.map(s => s._id),
        divisionIds: matchingDivisions.map(d => d._id),
        assemblyIds: matchingAssemblies.map(a => a._id),
        parliamentIds: matchingParliaments.map(p => p._id),
        blockIds: matchingBlocks.map(b => b._id),
        boothIds: matchingBooths.map(b => b._id),
        electionYearIds: matchingElectionYears.map(e => e._id)
      };

      // Add reference field searches
      if (matchingCandidates.length > 0) {
        searchConditions.push({ candidate_id: { $in: matchedIds.candidateIds } });
      }
      if (matchingStates.length > 0) {
        searchConditions.push({ state_id: { $in: matchedIds.stateIds } });
      }
      if (matchingDivisions.length > 0) {
        searchConditions.push({ division_id: { $in: matchedIds.divisionIds } });
      }
      if (matchingAssemblies.length > 0) {
        searchConditions.push({ assembly_id: { $in: matchedIds.assemblyIds } });
      }
      if (matchingParliaments.length > 0) {
        searchConditions.push({ parliament_id: { $in: matchedIds.parliamentIds } });
      }
      if (matchingBlocks.length > 0) {
        searchConditions.push({ block_id: { $in: matchedIds.blockIds } });
      }
      if (matchingBooths.length > 0) {
        searchConditions.push({ booth_id: { $in: matchedIds.boothIds } });
      }
      if (matchingElectionYears.length > 0) {
        searchConditions.push({ election_year_id: { $in: matchedIds.electionYearIds } });
      }

      // Search by date (if search term looks like a date)
      const dateRegex = /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/;
      if (dateRegex.test(searchTerm)) {
        try {
          // Try to parse the date in different formats
          const dateFormats = [
            'DD/MM/YYYY', 'MM/DD/YYYY', 'DD-MM-YYYY', 'MM-DD-YYYY'
          ];

          for (const format of dateFormats) {
            try {
              let date;
              if (format.includes('/')) {
                const parts = searchTerm.split('/');
                if (format === 'DD/MM/YYYY') {
                  date = new Date(parts[2], parts[1] - 1, parts[0]);
                } else {
                  date = new Date(parts[2], parts[0] - 1, parts[1]);
                }
              } else {
                const parts = searchTerm.split('-');
                if (format === 'DD-MM-YYYY') {
                  date = new Date(parts[2], parts[1] - 1, parts[0]);
                } else {
                  date = new Date(parts[2], parts[0] - 1, parts[1]);
                }
              }

              if (!isNaN(date.getTime())) {
                const startOfDay = new Date(date);
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date(date);
                endOfDay.setHours(23, 59, 59, 999);

                searchConditions.push({
                  date: { $gte: startOfDay, $lte: endOfDay }
                });
                break;
              }
            } catch (e) {
              // Continue to next format
            }
          }
        } catch (e) {
          // Ignore date parsing errors
        }
      }

      console.log('🔍 Search conditions count:', searchConditions.length);
      console.log('🔍 Search conditions:', JSON.stringify(searchConditions, null, 2));

      // Always apply search conditions if we have any
      if (searchConditions.length > 0) {
        query = query.find({
          $or: searchConditions
        });

        filter.$or = searchConditions;
        console.log('🔍 Applied search filter with', searchConditions.length, 'conditions');
      } else {
        console.log('🔍 No search conditions found, applying fallback search');
        // Fallback: if no conditions were created, try a basic text search
        const fallbackConditions = [
          { post: searchRegex },
          { locationName: searchRegex },
          { visitAgenda: searchRegex },
          { speechFiveLines: searchRegex },
          { speechIssue: searchRegex },
          { remark: searchRegex },
          { workName: searchRegex },
          { work_status: searchRegex },
          { description: searchRegex }
        ];

        query = query.find({
          $or: fallbackConditions
        });

        filter.$or = fallbackConditions;
        console.log('🔍 Applied fallback search filter');
      }

      // If caller only wants the matched ids (for global search box etc.), short-circuit here
      if (req.query.idsOnly === 'true') {
        return res.status(200).json({
          success: true,
          matches: matchedIds
        });
      }

      console.log('🔍 Search filter applied, continuing with query execution...');

      // Debug: Let's also check what visits exist without any search
      const allVisitsCount = await Visit.countDocuments();
      console.log('🔍 Total visits in database (before search filter):', allVisitsCount);

      // Debug: Check visits with the search filter
      const searchFilterCount = await Visit.countDocuments(filter);
      console.log('🔍 Visits matching search filter:', searchFilterCount);
    }

    // Filter by work status
    if (req.query.work_status || req.query.status) {
      const statusValue = req.query.work_status || req.query.status;
      query = query.where('work_status').equals(statusValue);
      filter.work_status = statusValue;
    }

    // Filter by candidate
    if (req.query.candidate) {
      query = query.where('candidate_id').equals(req.query.candidate);
      filter.candidate_id = req.query.candidate;
    }

    // Region-based filters
    // Handle both ID and name-based filtering for state
    if (req.query.state_id || req.query.state) {
      if (req.query.state) {
        // Check if it's a valid ObjectId first
        if (req.query.state.match(/^[0-9a-fA-F]{24}$/)) {
          // It's an ObjectId, use it directly
          query = query.where('state_id').equals(req.query.state);
          filter.state_id = req.query.state;
        } else {
          // It's a name, search by name
          // Remove hyphens from the state name and convert to normal space
          const stateName = req.query.state.replace(/-/g, ' ');
          const state = await State.findOne({
            name: { $regex: new RegExp('^' + stateName + '$', 'i') }
          });
          if (state) {
            query = query.where('state_id').equals(state._id);
            filter.state_id = state._id;
          }
        }
      } else {
        query = query.where('state_id').equals(req.query.state_id);
        filter.state_id = req.query.state_id;
      }
    }

    // Handle both ID and name-based filtering for division
    if (req.query.division_id || req.query.division) {
      if (req.query.division) {
        // Check if it's a valid ObjectId first
        if (req.query.division.match(/^[0-9a-fA-F]{24}$/)) {
          // It's an ObjectId, use it directly
          query = query.where('division_id').equals(req.query.division);
          filter.division_id = req.query.division;
        } else {
          // It's a name, search by name
          const division = await Division.findOne({
            name: { $regex: new RegExp('^' + req.query.division.replace(/-/g, ' ') + '$', 'i') }
          });
          if (division) {
            query = query.where('division_id').equals(division._id);
            filter.division_id = division._id;
          }
        }
      } else {
        query = query.where('division_id').equals(req.query.division_id);
        filter.division_id = req.query.division_id;
      }
    }

    // Handle both ID and name-based filtering for parliament
    if (req.query.parliament_id || req.query.parliament) {
      if (req.query.parliament) {
        // Check if it's a valid ObjectId first
        if (req.query.parliament.match(/^[0-9a-fA-F]{24}$/)) {
          // It's an ObjectId, use it directly
          query = query.where('parliament_id').equals(req.query.parliament);
          filter.parliament_id = req.query.parliament;
        } else {
          // It's a name, search by name
          const parliament = await Parliament.findOne({
            name: { $regex: new RegExp('^' + req.query.parliament.replace(/-/g, ' ') + '$', 'i') }
          });
          if (parliament) {
            query = query.where('parliament_id').equals(parliament._id);
            filter.parliament_id = parliament._id;
          }
        }
      } else {
        query = query.where('parliament_id').equals(req.query.parliament_id);
        filter.parliament_id = req.query.parliament_id;
      }
    }

    // Handle assembly filtering by number or id
    if (req.query.assembly_id || req.query.assembly) {
      if (req.query.assembly) {
        // Check if it's a valid ObjectId first
        if (req.query.assembly.match(/^[0-9a-fA-F]{24}$/)) {
          // It's an ObjectId, use it directly
          query = query.where('assembly_id').equals(req.query.assembly);
          filter.assembly_id = req.query.assembly;
        } else if (!isNaN(req.query.assembly)) {
          // It's a number, search by assembly number
          const assembly = await Assembly.findOne({
            assembly_number: req.query.assembly
          });
          if (assembly) {
            query = query.where('assembly_id').equals(assembly._id);
            filter.assembly_id = assembly._id;
          }
        } else {
          // It's a name, search by name
          const assembly = await Assembly.findOne({
            name: { $regex: new RegExp('^' + req.query.assembly.replace(/-/g, ' ') + '$', 'i') }
          });
          if (assembly) {
            query = query.where('assembly_id').equals(assembly._id);
            filter.assembly_id = assembly._id;
          }
        }
      } else {
        query = query.where('assembly_id').equals(req.query.assembly_id);
        filter.assembly_id = req.query.assembly_id;
      }
    }

    // Handle block filtering
    if (req.query.block_id || req.query.block) {
      if (req.query.block) {
        // Check if it's a valid ObjectId first
        if (req.query.block.match(/^[0-9a-fA-F]{24}$/)) {
          // It's an ObjectId, use it directly
          query = query.where('block_id').equals(req.query.block);
          filter.block_id = req.query.block;
        } else {
          // It's a name, search by name
          // Convert query to proper case and clean up
          const blockName = req.query.block
            .replace(/-/g, ' ')
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

          const block = await Block.findOne({
            $or: [
              { name: blockName }, // Exact match with proper case
              { name: { $regex: new RegExp('^' + req.query.block + '$', 'i') } } // Case-insensitive match
            ]
          });
          if (block) {
            query = query.where('block_id').equals(block._id);
            filter.block_id = block._id;
          }
        }
      } else {
        query = query.where('block_id').equals(req.query.block_id);
        filter.block_id = req.query.block_id;
      }
    }

    // Handle booth filtering
    if (req.query.booth_id || req.query.booth) {
      if (req.query.booth) {
        query = query.where('booth_id').equals(req.query.booth);
        filter.booth_id = req.query.booth;
      } else {
        query = query.where('booth_id').equals(req.query.booth_id);
        filter.booth_id = req.query.booth_id;
      }
    }

    // Filter by date range
    if (req.query.startDate && req.query.endDate) {
      const startDate = new Date(req.query.startDate);
      const endDate = new Date(req.query.endDate);
      // Set end date to end of day
      endDate.setHours(23, 59, 59, 999);

      query = query.where('date').gte(startDate).lte(endDate);
      filter.date = { $gte: startDate, $lte: endDate };
    } else if (req.query.startDate) {
      const startDate = new Date(req.query.startDate);
      query = query.where('date').gte(startDate);
      filter.date = { $gte: startDate };
    } else if (req.query.endDate) {
      const endDate = new Date(req.query.endDate);
      endDate.setHours(23, 59, 59, 999);
      query = query.where('date').lte(endDate);
      filter.date = { $lte: endDate };
    }

    // Filter by location proximity if lat/lng and radius provided
    if (req.query.latitude && req.query.longitude && req.query.radius) {
      const lat = parseFloat(req.query.latitude);
      const lng = parseFloat(req.query.longitude);
      const radius = parseFloat(req.query.radius) / 6378.1; // Convert km to radians

      query = query.where('location').near({
        center: [lng, lat],
        spherical: true,
        maxDistance: radius
      });

      filter.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: radius * 6378100 // Convert back to meters for count query
        }
      };
    }

    // If fetchAll is true, skip pagination
    if (fetchAll) {
      const visits = await query.exec();
      const total = await Visit.countDocuments(filter);

      console.log('🔍 FetchAll - Found visits:', visits.length, 'Total:', total);

      res.status(200).json({
        success: true,
        count: visits.length,
        total,
        data: visits
      });
    } else {
      // Apply pagination
      console.log('🔍 Executing paginated query...');
      const visits = await query.skip(skip).limit(limit).exec();
      const total = await Visit.countDocuments(filter);

      console.log('🔍 Paginated - Found visits:', visits.length, 'Total:', total, 'Page:', page, 'Pages:', Math.ceil(total / limit));

      res.status(200).json({
        success: true,
        count: visits.length,
        total,
        page,
        pages: Math.ceil(total / limit),
        data: visits
      });
    }
  } catch (err) {
    console.error('🔍 Error in getVisits:', err);
    next(err);
  }
};

// @desc    Get single visit
// @route   GET /api/visits/:id
// @access  Public
exports.getVisit = async (req, res, next) => {
  try {
    const visit = await Visit.findById(req.params.id)
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('assembly_id', 'name')
      .populate('parliament_id', 'name')
      .populate('block_id', 'name')
      .populate('booth_id', 'name booth_number')
      .populate('candidate_id', 'name')
      .populate('election_year_id', 'year election_type')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Visit not found'
      });
    }

    res.status(200).json({
      success: true,
      data: visit
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create visit
// @route   POST /api/visits
// @access  Private (Admin/SuperAdmin)
exports.createVisit = async (req, res, next) => {
  try {
    // Clean up empty strings for ObjectId fields
    if (req.body.block_id === '' || req.body.block_id === null) {
      delete req.body.block_id;
    }
    if (req.body.booth_id === '' || req.body.booth_id === null) {
      delete req.body.booth_id;
    }

    // Verify all references exist (only for provided fields)
    const verificationPromises = [];
    const verificationChecks = [];

    // If frontend sent a plain year string (e.g., '2024') in election_year_id, convert it to an ElectionYear _id
    if (req.body.election_year_id && typeof req.body.election_year_id === 'string' && /^\d{4}$/.test(req.body.election_year_id)) {
      const yearNum = parseInt(req.body.election_year_id, 10);
      // Try to find existing ElectionYear
      let ey = await ElectionYear.findOne({ year: yearNum });
      if (!ey) {
        // Create a minimal ElectionYear record. We must have a created_by user; use req.user if available.
        const createdBy = req.user ? req.user.id : null;
        try {
          ey = await ElectionYear.create({ year: yearNum, election_type: 'Assembly', created_by: createdBy });
        } catch (e) {
          // If creation failed due to validation or missing created_by, try to find again and otherwise remove the field
          ey = await ElectionYear.findOne({ year: yearNum }).catch(() => null);
        }
      }
      if (ey) req.body.election_year_id = ey._id;
    }

    if (req.body.state_id) {
      verificationPromises.push(State.findById(req.body.state_id));
      verificationChecks.push('state');
    } else {
      verificationPromises.push(Promise.resolve(null));
      verificationChecks.push(null);
    }

    if (req.body.division_id) {
      verificationPromises.push(Division.findById(req.body.division_id));
      verificationChecks.push('division');
    } else {
      verificationPromises.push(Promise.resolve(null));
      verificationChecks.push(null);
    }

    if (req.body.assembly_id) {
      verificationPromises.push(Assembly.findById(req.body.assembly_id));
      verificationChecks.push('assembly');
    } else {
      verificationPromises.push(Promise.resolve(null));
      verificationChecks.push(null);
    }

    if (req.body.parliament_id) {
      verificationPromises.push(Parliament.findById(req.body.parliament_id));
      verificationChecks.push('parliament');
    } else {
      verificationPromises.push(Promise.resolve(null));
      verificationChecks.push(null);
    }

    if (req.body.block_id) verificationPromises.push(req.body.block_id ? Block.findById(req.body.block_id) : Promise.resolve(null));
    if (req.body.booth_id) verificationPromises.push(req.body.booth_id ? Booth.findById(req.body.booth_id) : Promise.resolve(null));

    if (req.body.candidate_id) {
      verificationPromises.push(Candidate.findById(req.body.candidate_id));
      verificationChecks.push('candidate');
    } else {
      verificationPromises.push(Promise.resolve(null));
      verificationChecks.push(null);
    }

    if (req.body.election_year_id) {
      verificationPromises.push(ElectionYear.findById(req.body.election_year_id));
      verificationChecks.push('electionYear');
    } else {
      verificationPromises.push(Promise.resolve(null));
      verificationChecks.push(null);
    }

    verificationPromises.push(req.user ? User.findById(req.user.id) : Promise.resolve(null));

    const verificationResults = await Promise.all(verificationPromises);

    // Check verification results only for provided fields
    let resultIndex = 0;
    verificationChecks.forEach(check => {
      if (check) {
        const result = verificationResults[resultIndex];
        if (!result) {
          throw new Error(`${check.charAt(0).toUpperCase() + check.slice(1)} not found`);
        }
      }
      resultIndex++;
    });

    // Check block and booth if provided
    const blockIndex = verificationPromises.length - 4;
    const boothIndex = verificationPromises.length - 3;
    if (req.body.block_id && !verificationResults[blockIndex]) {
      return res.status(400).json({ success: false, message: 'Block not found' });
    }
    if (req.body.booth_id && !verificationResults[boothIndex]) {
      return res.status(400).json({ success: false, message: 'Booth not found' });
    }

    // Check user exists (optional)
    const user = verificationResults[verificationResults.length - 1];
    // if (!user) return res.status(400).json({ success: false, message: 'User not found' });

    // Set default work_status if not provided
    if (!req.body.work_status) {
      req.body.work_status = 'announced';
    }

    // Create location object if coordinates are provided
    if (req.body.latitude && req.body.longitude) {
      req.body.location = {
        type: 'Point',
        coordinates: [req.body.longitude, req.body.latitude]
      };
    }

    const visitData = {
      ...req.body,
      created_by: req.user ? req.user.id : null,
      description: req.body.description || '',
    };

    const visit = await Visit.create(visitData);

    res.status(201).json({
      success: true,
      data: visit
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update visit
// @route   PUT /api/visits/:id
// @access  Private (Admin/SuperAdmin)
exports.updateVisit = async (req, res, next) => {
  try {
    let visit = await Visit.findById(req.params.id);

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Visit not found'
      });
    }

    // Clean up empty strings for ObjectId fields
    if (req.body.block_id === '' || req.body.block_id === null) {
      delete req.body.block_id;
    }
    if (req.body.booth_id === '' || req.body.booth_id === null) {
      delete req.body.booth_id;
    }

    // Verify all references exist if being updated
    const verificationPromises = [];
    const verificationChecks = [];

    // Normalize election_year_id if frontend provided a year string (e.g., '2024')
    if (req.body.election_year_id && typeof req.body.election_year_id === 'string' && /^\d{4}$/.test(req.body.election_year_id)) {
      const yearNum = parseInt(req.body.election_year_id, 10);
      let ey = await ElectionYear.findOne({ year: yearNum });
      if (!ey) {
        const createdBy = req.user ? req.user.id : null;
        try {
          ey = await ElectionYear.create({ year: yearNum, election_type: 'Assembly', created_by: createdBy });
        } catch (e) {
          ey = await ElectionYear.findOne({ year: yearNum }).catch(() => null);
        }
      }
      if (ey) req.body.election_year_id = ey._id;
    }

    if (req.body.state_id) {
      verificationPromises.push(State.findById(req.body.state_id));
      verificationChecks.push('State');
    }
    if (req.body.division_id) {
      verificationPromises.push(Division.findById(req.body.division_id));
      verificationChecks.push('Division');
    }
    if (req.body.assembly_id) {
      verificationPromises.push(Assembly.findById(req.body.assembly_id));
      verificationChecks.push('Assembly');
    }
    if (req.body.parliament_id) {
      verificationPromises.push(Parliament.findById(req.body.parliament_id));
      verificationChecks.push('Parliament');
    }
    if (req.body.block_id) verificationPromises.push(Block.findById(req.body.block_id));
    if (req.body.booth_id) verificationPromises.push(Booth.findById(req.body.booth_id));
    if (req.body.candidate_id) {
      verificationPromises.push(Candidate.findById(req.body.candidate_id));
      verificationChecks.push('Candidate');
    }
    if (req.body.election_year_id) {
      verificationPromises.push(ElectionYear.findById(req.body.election_year_id));
      verificationChecks.push('Election year');
    }

    const verificationResults = await Promise.all(verificationPromises);

    // Check each verification result individually
    verificationChecks.forEach((check, index) => {
      if (!verificationResults[index]) {
        throw new Error(`${check} not found`);
      }
    });

    // Check block and booth if provided
    const blockIndex = verificationPromises.findIndex(p => p === Block.findById(req.body.block_id));
    const boothIndex = verificationPromises.findIndex(p => p === Booth.findById(req.body.booth_id));
    if (req.body.block_id && blockIndex >= 0 && !verificationResults[blockIndex]) {
      return res.status(400).json({ success: false, message: 'Block not found' });
    }
    if (req.body.booth_id && boothIndex >= 0 && !verificationResults[boothIndex]) {
      return res.status(400).json({ success: false, message: 'Booth not found' });
    }

    // Update location object if coordinates are provided
    if (req.body.latitude && req.body.longitude) {
      req.body.location = {
        type: 'Point',
        coordinates: [req.body.longitude, req.body.latitude]
      };
    } else if (req.body.latitude === null || req.body.longitude === null) {
      // Remove location if coordinates are explicitly set to null
      req.body.location = undefined;
    }

    // Set updated_by to current user
    req.body.updated_by = req.user.id;
    req.body.description = req.body.description || '';
    req.body.updated_at = new Date();

    visit = await Visit.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('assembly_id', 'name')
      .populate('parliament_id', 'name')
      .populate('block_id', 'name')
      .populate('booth_id', 'name booth_number')
      .populate('candidate_id', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    res.status(200).json({
      success: true,
      data: visit
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete visit
// @route   DELETE /api/visits/:id
// @access  Private (Admin/SuperAdmin)
exports.deleteVisit = async (req, res, next) => {
  try {
    const visit = await Visit.findById(req.params.id);

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Visit not found'
      });
    }

    await visit.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get visits by booth
// @route   GET /api/visits/booth/:boothId
// @access  Public
exports.getVisitsByBooth = async (req, res, next) => {
  try {
    // Verify booth exists
    const booth = await Booth.findById(req.params.boothId);
    if (!booth) {
      return res.status(404).json({
        success: false,
        message: 'Booth not found'
      });
    }

    // Build filter with booth ID
    let filter = { booth_id: req.params.boothId };

    // Apply permission-based filtering if user is authenticated
    if (req.user) {
      const isSuperAdmin = req.user.email === 'superadmin@example.com' ||
        req.user.role === 'superAdmin' ||
        req.user.role === 'SuperAdmin';

      if (!isSuperAdmin) {
        try {
          // First check UserHierarchy model
          let userHierarchy = await UserHierarchy.findOne({ user: req.user._id });

          // If no UserHierarchy found, check User model for hierarchical IDs
          if (!userHierarchy) {
            const user = await User.findById(req.user._id);
            if (user && (user.state_ids?.length > 0 || user.division_ids?.length > 0 ||
              user.parliament_ids?.length > 0 || user.assembly_ids?.length > 0 ||
              user.block_ids?.length > 0 || user.booth_ids?.length > 0)) {

              // Create a hierarchy filter from User model data
              const userHierarchyFilter = {};
              if (user.state_ids?.length > 0) userHierarchyFilter.state_id = { $in: user.state_ids };
              if (user.division_ids?.length > 0) userHierarchyFilter.division_id = { $in: user.division_ids };
              if (user.parliament_ids?.length > 0) userHierarchyFilter.parliament_id = { $in: user.parliament_ids };
              if (user.assembly_ids?.length > 0) userHierarchyFilter.assembly_id = { $in: user.assembly_ids };
              if (user.block_ids?.length > 0) userHierarchyFilter.block_id = { $in: user.block_ids };
              if (user.booth_ids?.length > 0) userHierarchyFilter.booth_id = { $in: user.booth_ids };

              // Merge user hierarchy filter with booth filter
              filter = { ...filter, ...userHierarchyFilter };
            }
          } else {
            // Use UserHierarchy model data
            const hierarchyFilter = buildHierarchyFilter(userHierarchy);
            // Merge hierarchy filter with booth filter
            filter = { ...filter, ...hierarchyFilter };
          }
        } catch (error) {
          console.error('Error fetching user hierarchy:', error);
          // Continue without hierarchy filtering if there's an error
        }
      }
    }

    const visits = await Visit.find(filter)
      .sort({ date: -1 })
      .populate('candidate_id', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    res.status(200).json({
      success: true,
      count: visits.length,
      data: visits
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get visits by work status
// @route   GET /api/visits/status/:status
// @access  Public
exports.getVisitsByStatus = async (req, res, next) => {
  try {
    const validStatuses = ['announced', 'approved', 'in progress', 'complete'];
    if (!validStatuses.includes(req.params.status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid work status'
      });
    }

    // Build filter with status
    let filter = { work_status: req.params.status };

    // Apply permission-based filtering if user is authenticated
    if (req.user) {
      const isSuperAdmin = req.user.email === 'superadmin@example.com' ||
        req.user.role === 'superAdmin' ||
        req.user.role === 'SuperAdmin';

      if (!isSuperAdmin) {
        try {
          // First check UserHierarchy model
          let userHierarchy = await UserHierarchy.findOne({ user: req.user._id });

          // If no UserHierarchy found, check User model for hierarchical IDs
          if (!userHierarchy) {
            const user = await User.findById(req.user._id);
            if (user && (user.state_ids?.length > 0 || user.division_ids?.length > 0 ||
              user.parliament_ids?.length > 0 || user.assembly_ids?.length > 0 ||
              user.block_ids?.length > 0 || user.booth_ids?.length > 0)) {

              // Create a hierarchy filter from User model data
              const userHierarchyFilter = {};
              if (user.state_ids?.length > 0) userHierarchyFilter.state_id = { $in: user.state_ids };
              if (user.division_ids?.length > 0) userHierarchyFilter.division_id = { $in: user.division_ids };
              if (user.parliament_ids?.length > 0) userHierarchyFilter.parliament_id = { $in: user.parliament_ids };
              if (user.assembly_ids?.length > 0) userHierarchyFilter.assembly_id = { $in: user.assembly_ids };
              if (user.block_ids?.length > 0) userHierarchyFilter.block_id = { $in: user.block_ids };
              if (user.booth_ids?.length > 0) userHierarchyFilter.booth_id = { $in: user.booth_ids };

              // Merge user hierarchy filter with status filter
              filter = { ...filter, ...userHierarchyFilter };
            }
          } else {
            // Use UserHierarchy model data
            const hierarchyFilter = buildHierarchyFilter(userHierarchy);
            // Merge hierarchy filter with status filter
            filter = { ...filter, ...hierarchyFilter };
          }
        } catch (error) {
          console.error('Error fetching user hierarchy:', error);
          // Continue without hierarchy filtering if there's an error
        }
      }
    }

    const visits = await Visit.find(filter)
      .sort({ date: -1 })
      .populate('booth_id', 'name booth_number')
      .populate('candidate_id', 'name')
      .populate('created_by', 'username');

    res.status(200).json({
      success: true,
      count: visits.length,
      data: visits
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get visits by date range
// @route   GET /api/visits/date-range
// @access  Public
exports.getVisitsByDateRange = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Both startDate and endDate query parameters are required'
      });
    }

    // Build filter with date range
    let filter = {
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    // Apply permission-based filtering if user is authenticated
    if (req.user) {
      const isSuperAdmin = req.user.email === 'superadmin@example.com' ||
        req.user.role === 'superAdmin' ||
        req.user.role === 'SuperAdmin';

      if (!isSuperAdmin) {
        try {
          // First check UserHierarchy model
          let userHierarchy = await UserHierarchy.findOne({ user: req.user._id });

          // If no UserHierarchy found, check User model for hierarchical IDs
          if (!userHierarchy) {
            const user = await User.findById(req.user._id);
            if (user && (user.state_ids?.length > 0 || user.division_ids?.length > 0 ||
              user.parliament_ids?.length > 0 || user.assembly_ids?.length > 0 ||
              user.block_ids?.length > 0 || user.booth_ids?.length > 0)) {

              // Create a hierarchy filter from User model data
              const userHierarchyFilter = {};
              if (user.state_ids?.length > 0) userHierarchyFilter.state_id = { $in: user.state_ids };
              if (user.division_ids?.length > 0) userHierarchyFilter.division_id = { $in: user.division_ids };
              if (user.parliament_ids?.length > 0) userHierarchyFilter.parliament_id = { $in: user.parliament_ids };
              if (user.assembly_ids?.length > 0) userHierarchyFilter.assembly_id = { $in: user.assembly_ids };
              if (user.block_ids?.length > 0) userHierarchyFilter.block_id = { $in: user.block_ids };
              if (user.booth_ids?.length > 0) userHierarchyFilter.booth_id = { $in: user.booth_ids };

              // Merge user hierarchy filter with date filter
              filter = { ...filter, ...userHierarchyFilter };
            }
          } else {
            // Use UserHierarchy model data
            const hierarchyFilter = buildHierarchyFilter(userHierarchy);
            // Merge hierarchy filter with date filter
            filter = { ...filter, ...hierarchyFilter };
          }
        } catch (error) {
          console.error('Error fetching user hierarchy:', error);
          // Continue without hierarchy filtering if there's an error
        }
      }
    }

    const visits = await Visit.find(filter)
      .sort({ date: -1 })
      .populate('booth_id', 'name booth_number')
      .populate('candidate_id', 'name')
      .populate('created_by', 'username');

    res.status(200).json({
      success: true,
      count: visits.length,
      data: visits
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get visits near a location
// @route   GET /api/visits/nearby
// @access  Public
exports.getNearbyVisits = async (req, res, next) => {
  try {
    const { longitude, latitude, maxDistance = 10 } = req.query;

    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        message: 'Both longitude and latitude are required'
      });
    }

    const visits = await Visit.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseFloat(maxDistance) * 1000 // Convert km to meters
        }
      }
    })
      .populate('booth_id', 'name booth_number')
      .populate('candidate_id', 'name')
      .populate('created_by', 'username');

    res.status(200).json({
      success: true,
      count: visits.length,
      data: visits
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get visits by candidate with path
// @route   GET /api/visits/candidate/:candidateId/path
// @access  Public
exports.getCandidatePath = async (req, res, next) => {
  try {
    const visits = await Visit.find({ candidate_id: req.params.candidateId })
      .populate('booth_id', 'name booth_number')
      .sort({ date: 1 }); // Sort by date to show chronological path

    // Filter visits with coordinates
    const visitsWithCoords = visits.filter(v => v.latitude && v.longitude);

    // Create GeoJSON LineString for the path
    const lineString = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: visitsWithCoords.map(v => [v.longitude, v.latitude])
      }
    };

    res.status(200).json({
      success: true,
      data: {
        visits: visitsWithCoords,
        path: lineString
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Upload a document for a visit (slot 0..2)
// @route   POST /api/visits/:id/documents
// @access  Private
exports.uploadVisitDocument = async (req, res, next) => {
  try {
    const visitId = req.params.id;
    const slot = parseInt(req.body.slot);

    if (isNaN(slot) || slot < 0 || slot > 2) {
      return res.status(400).json({ success: false, message: 'Invalid slot. Use 0,1,2.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const visit = await Visit.findById(visitId);
    if (!visit) {
      return res.status(404).json({ success: false, message: 'Visit not found' });
    }

    // Ensure documents array exists
    if (!Array.isArray(visit.documents)) visit.documents = [];

    // Prepare document object
    const docName = req.body.name || req.file.originalname;
    const docPath = `/uploads/visit-docs/${req.file.filename}`;

    // Insert or replace at slot
    visit.documents[slot] = { name: docName, filePath: docPath };

    await visit.save();

    res.status(200).json({ success: true, data: visit.documents[slot] });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a document from a visit (slot 0..2)
// @route   DELETE /api/visits/:id/documents/:slot
// @access  Private
exports.deleteVisitDocument = async (req, res, next) => {
  try {
    const visitId = req.params.id;
    const slot = parseInt(req.params.slot);

    if (isNaN(slot) || slot < 0 || slot > 2) {
      return res.status(400).json({ success: false, message: 'Invalid slot. Use 0,1,2.' });
    }

    const visit = await Visit.findById(visitId);
    if (!visit) {
      return res.status(404).json({ success: false, message: 'Visit not found' });
    }

    if (!Array.isArray(visit.documents) || !visit.documents[slot]) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    // Remove file from disk if exists
    const fs = require('fs');
    const path = require('path');
    const doc = visit.documents[slot];
    if (doc && doc.filePath) {
      const fileOnDisk = path.join(__dirname, '..', doc.filePath);
      try {
        if (fs.existsSync(fileOnDisk)) fs.unlinkSync(fileOnDisk);
      } catch (e) {
        // ignore file deletion errors
      }
    }

    // Remove slot
    visit.documents[slot] = undefined;
    // Compact array to keep indexes consistent
    visit.documents = visit.documents.filter(d => d);

    await visit.save();

    res.status(200).json({ success: true, message: 'Document removed' });
  } catch (err) {
    next(err);
  }
};