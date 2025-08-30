const Visit = require('../models/Visit');
const Booth = require('../models/booth');
const Block = require('../models/block');
const Assembly = require('../models/Assembly');
const Parliament = require('../models/Parliament');
const Division = require('../models/Division');
const State = require('../models/state');
const Candidate = require('../models/Candidate');
const User = require('../models/User');

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

    // Basic query for main data fetch
    let query = Visit.find()
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('assembly_id', 'name')
      .populate('parliament_id', 'name')
      .populate('block_id', 'name')
      .populate('booth_id', 'name booth_number')
      .populate({
        path: 'candidate_id',
        select: 'name photo mobile caste education',
        options: { strictPopulate: false }  // <- ye ensure karega error na aaye agar document missing ho
      })
      .populate('created_by', 'username')
      .populate('updated_by', 'username')
      .sort({ date: -1 });

    // Search functionality
    if (req.query.search) {
      const searchRegex = { $regex: req.query.search, $options: 'i' };
      
      // First find candidates that match the search term
      const matchingCandidates = await Candidate.find({
        name: searchRegex
      }).select('_id');
      
      const candidateIds = matchingCandidates.map(c => c._id);
      
      const searchConditions = [
        { post: searchRegex },
        { locationName: searchRegex },
        { declaration: searchRegex },
        { remark: searchRegex }
      ];
      
      // Add candidate search if we found matching candidates
      if (candidateIds.length > 0) {
        searchConditions.push({ candidate_id: { $in: candidateIds } });
      }
      
      query = query.find({
        $or: searchConditions
      });
      
      filter.$or = searchConditions;
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

      res.status(200).json({
        success: true,
        count: visits.length,
        total,
        data: visits
      });
    } else {
      // Apply pagination
      const visits = await query.skip(skip).limit(limit).exec();
      const total = await Visit.countDocuments(filter);

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

    // Verify all references exist
    const [
      state,
      division,
      assembly,
      parliament,
      block,
      booth,
      candidate,
      user
    ] = await Promise.all([
      State.findById(req.body.state_id),
      Division.findById(req.body.division_id),
      Assembly.findById(req.body.assembly_id),
      Parliament.findById(req.body.parliament_id),
      req.body.block_id ? Block.findById(req.body.block_id) : Promise.resolve(null), // Optional
      req.body.booth_id ? Booth.findById(req.body.booth_id) : Promise.resolve(null), // Optional
      Candidate.findById(req.body.candidate_id),
      User.findById(req.user.id)
    ]);

    if (!state) return res.status(400).json({ success: false, message: 'State not found' });
    if (!division) return res.status(400).json({ success: false, message: 'Division not found' });
    if (!assembly) return res.status(400).json({ success: false, message: 'Assembly not found' });
    if (!parliament) return res.status(400).json({ success: false, message: 'Parliament not found' });
    // if (req.body.block_id && !block) return res.status(400).json({ success: false, message: 'Block not found' });
    // if (req.body.booth_id && !booth) return res.status(400).json({ success: false, message: 'Booth not found' });
    if (!candidate) return res.status(400).json({ success: false, message: 'Candidate not found' });
    if (!user) return res.status(400).json({ success: false, message: 'User not found' });

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
      created_by: req.user.id,
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
    if (req.body.state_id) verificationPromises.push(State.findById(req.body.state_id));
    if (req.body.division_id) verificationPromises.push(Division.findById(req.body.division_id));
    if (req.body.assembly_id) verificationPromises.push(Assembly.findById(req.body.assembly_id));
    if (req.body.parliament_id) verificationPromises.push(Parliament.findById(req.body.parliament_id));
    if (req.body.block_id) verificationPromises.push(Block.findById(req.body.block_id));
    if (req.body.booth_id) verificationPromises.push(Booth.findById(req.body.booth_id));
    if (req.body.candidate_id) verificationPromises.push(Candidate.findById(req.body.candidate_id));

    const verificationResults = await Promise.all(verificationPromises);

    // Check each verification result individually (block and booth are optional)
    let index = 0;
    if (req.body.state_id && !verificationResults[index++]) {
      return res.status(400).json({ success: false, message: 'State not found' });
    }
    if (req.body.division_id && !verificationResults[index++]) {
      return res.status(400).json({ success: false, message: 'Division not found' });
    }
    if (req.body.assembly_id && !verificationResults[index++]) {
      return res.status(400).json({ success: false, message: 'Assembly not found' });
    }
    if (req.body.parliament_id && !verificationResults[index++]) {
      return res.status(400).json({ success: false, message: 'Parliament not found' });
    }
    if (req.body.block_id && !verificationResults[index++]) {
      return res.status(400).json({ success: false, message: 'Block not found' });
    }
    if (req.body.booth_id && !verificationResults[index++]) {
      return res.status(400).json({ success: false, message: 'Booth not found' });
    }
    if (req.body.candidate_id && !verificationResults[index++]) {
      return res.status(400).json({ success: false, message: 'Candidate not found' });
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

    const visits = await Visit.find({ booth_id: req.params.boothId })
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

    const visits = await Visit.find({ work_status: req.params.status })
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

    const visits = await Visit.find({
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    })
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