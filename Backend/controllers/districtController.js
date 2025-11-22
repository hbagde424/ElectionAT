const District = require('../models/District');
const State = require('../models/state');
const Assembly = require('../models/Assembly');
const Parliament = require('../models/Parliament');
const Division = require('../models/Division');

// @desc    Get all districts
// @route   GET /api/districts
// @access  Private (Requires authentication via serviceToken)
exports.getDistricts = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit);
    const skip = (page - 1) * limit;

    // Basic query
    let query = District.find()
      .populate('state_id', 'name')
      .populate('assembly_id', 'name')
      .populate('parliament_id', 'name')
      .populate('division_id', 'name')
      .populate('created_by', 'username')
      // In getDistricts and getDistrict methods, update the populate calls:
      .populate('updated_by', 'username')
      .sort({ name: 1 });

    // Search functionality
    if (req.query.search) {
      query = query.find({ name: { $regex: req.query.search, $options: 'i' } });
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

    // Filter by assembly
    if (req.query.assembly) {
      query = query.where('assembly_id').equals(req.query.assembly);
    }

    // Filter by parliament
    if (req.query.parliament) {
      query = query.where('parliament_id').equals(req.query.parliament);
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
          // No such division, return empty result
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

    // Apply user hierarchy restriction when an authenticated user is present
    // Precedence: booth -> block -> assembly -> parliament -> division -> state
    if (req.user && req.user.role !== 'superAdmin' && req.userHierarchy) {
      const h = req.userHierarchy;
      // Extract IDs from populated objects or direct ID values
      const boothId = h.booth?._id || h.booth;
      const blockId = h.block?._id || h.block;
      const assemblyId = h.assembly?._id || h.assembly;
      const parliamentId = h.parliament?._id || h.parliament;
      const divisionId = h.division?._id || h.division;
      const stateId = h.state?._id || h.state;

      if (assemblyId) {
        query = query.where('assembly_id').equals(assemblyId);
      } else if (parliamentId) {
        query = query.where('parliament_id').equals(parliamentId);
      } else if (divisionId) {
        query = query.where('division_id').equals(divisionId);
      } else if (stateId) {
        query = query.where('state_id').equals(stateId);
      }
    }

    const districts = await query.skip(skip).limit(limit).exec();
    const total = await District.countDocuments(query.getFilter());

    // Add division_name as a top-level property for each district
    const districtsWithDivisionName = await Promise.all(districts.map(async (district) => {
      const districtObj = district.toObject();
      if (districtObj.division_id && typeof districtObj.division_id === 'object') {
        districtObj.division_name = districtObj.division_id.name;
      } else if (districtObj.division_id) {
        // If not populated, fetch division
        const division = await Division.findById(districtObj.division_id);
        districtObj.division_name = division ? division.name : null;
      } else {
        districtObj.division_name = null;
      }
      return districtObj;
    }));
    res.status(200).json({
      success: true,
      count: districtsWithDivisionName.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: districtsWithDivisionName
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single district
// @route   GET /api/districts/:id
// @access  Private (Requires authentication via serviceToken)
exports.getDistrict = async (req, res, next) => {
  try {
    const district = await District.findById(req.params.id)
      .populate('state_id', 'name')
      .populate('assembly_id', 'name')
      .populate('parliament_id', 'name')
      .populate('division_id', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username')


    if (!district) {
      return res.status(404).json({
        success: false,
        message: 'District not found'
      });
    }

    // Enforce user hierarchy: only allow access if district is within user's scope
    if (req.user && req.user.role !== 'superAdmin' && req.userHierarchy) {
      const h = req.userHierarchy;
      // Extract IDs from populated objects or direct ID values
      const boothId = h.booth?._id || h.booth;
      const blockId = h.block?._id || h.block;
      const assemblyId = h.assembly?._id || h.assembly;
      const parliamentId = h.parliament?._id || h.parliament;
      const divisionId = h.division?._id || h.division;
      const stateId = h.state?._id || h.state;

      const outOfScope = (assemblyId && district.assembly_id && district.assembly_id.toString() !== assemblyId.toString()) ||
        (parliamentId && district.parliament_id && district.parliament_id.toString() !== parliamentId.toString()) ||
        (divisionId && district.division_id && district.division_id.toString() !== divisionId.toString()) ||
        (stateId && district.state_id && district.state_id.toString() !== stateId.toString());

      if (outOfScope) {
        return res.status(403).json({ success: false, message: 'Forbidden: resource outside your geographic scope' });
      }
    }

    res.status(200).json({
      success: true,
      data: district
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create district
// @route   POST /api/districts
// @access  Private (Admin only)
exports.createDistrict = async (req, res, next) => {
  try {
    // Verify state exists
    const state = await State.findById(req.body.state_id);
    if (!state) {
      return res.status(400).json({
        success: false,
        message: 'State not found'
      });
    }

    // Verify division exists
    const division = await Division.findById(req.body.division_id);
    if (!division) {
      return res.status(400).json({
        success: false,
        message: 'Division not found'
      });
    }

    // Verify assembly exists if provided
    if (req.body.assembly_id) {
      const assembly = await Assembly.findById(req.body.assembly_id);
      if (!assembly) {
        return res.status(400).json({
          success: false,
          message: 'Assembly not found'
        });
      }
    }

    // Verify parliament exists if provided
    if (req.body.parliament_id) {
      const parliament = await Parliament.findById(req.body.parliament_id);
      if (!parliament) {
        return res.status(400).json({
          success: false,
          message: 'Parliament not found'
        });
      }
    }

    // Check if user exists in request
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }

    const districtData = {
      ...req.body,
      created_by: req.user.id,
      updated_by: req.user.id
    };

    const district = await District.create(districtData);

    res.status(201).json({
      success: true,
      data: district
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update district
// @route   PUT /api/districts/:id
// @access  Private (Admin only)
exports.updateDistrict = async (req, res, next) => {
  try {
    let district = await District.findById(req.params.id);

    if (!district) {
      return res.status(404).json({
        success: false,
        message: 'District not found'
      });
    }

    // Verify state exists if being updated
    if (req.body.state_id) {
      const state = await State.findById(req.body.state_id);
      if (!state) {
        return res.status(400).json({
          success: false,
          message: 'State not found'
        });
      }
    }

    // Verify division exists if being updated
    if (req.body.division_id) {
      const division = await Division.findById(req.body.division_id);
      if (!division) {
        return res.status(400).json({
          success: false,
          message: 'Division not found'
        });
      }
    }

    // Verify assembly exists if being updated
    if (req.body.assembly_id) {
      const assembly = await Assembly.findById(req.body.assembly_id);
      if (!assembly) {
        return res.status(400).json({
          success: false,
          message: 'Assembly not found'
        });
      }
    }

    // Verify parliament exists if being updated
    if (req.body.parliament_id) {
      const parliament = await Parliament.findById(req.body.parliament_id);
      if (!parliament) {
        return res.status(400).json({
          success: false,
          message: 'Parliament not found'
        });
      }
    }

    req.body.updated_by = req.user.id;

    // Set user in locals for pre-save hook
    district._locals = { user: req.user };
    req.body.updated_at = new Date();

    district = await District.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('state_id', 'name')
      .populate('assembly_id', 'name')
      .populate('parliament_id', 'name')
      .populate('division_id', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username'); // Add population of updated_by

    res.status(200).json({
      success: true,
      data: district
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete district
// @route   DELETE /api/districts/:id
// @access  Private (Admin only)
exports.deleteDistrict = async (req, res, next) => {
  try {
    const district = await District.findById(req.params.id);

    if (!district) {
      return res.status(404).json({
        success: false,
        message: 'District not found'
      });
    }

    await district.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get districts by state
// @route   GET /api/districts/state/:stateId
// @access  Private (Requires authentication via serviceToken)
exports.getDistrictsByState = async (req, res, next) => {
  try {
    // Verify state exists
    const state = await State.findById(req.params.stateId);
    if (!state) {
      return res.status(404).json({
        success: false,
        message: 'State not found'
      });
    }

    const districts = await District.find({ state_id: req.params.stateId })
      .sort({ name: 1 })
      .populate('division_id', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username')

    // Enforce user hierarchy for state-scoped listing
    if (req.user && req.user.role !== 'superAdmin' && req.userHierarchy) {
      const h = req.userHierarchy;
      // Extract IDs from populated objects or direct ID values
      const divisionId = h.division?._id || h.division;
      const stateId = h.state?._id || h.state;

      if (stateId && stateId.toString() !== req.params.stateId) {
        return res.status(403).json({ success: false, message: 'Forbidden: resource outside your geographic scope' });
      }
      if (divisionId) {
        const division = await Division.findById(divisionId);
        if (!division || division.state_id.toString() !== req.params.stateId) {
          return res.status(403).json({ success: false, message: 'Forbidden: resource outside your geographic scope' });
        }
      }
    }

    res.status(200).json({
      success: true,
      count: districts.length,
      data: districts
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get districts by division
// @route   GET /api/districts/division/:divisionId
// @access  Private (Requires authentication via serviceToken)
exports.getDistrictsByDivision = async (req, res, next) => {
  try {
    // Verify division exists
    const division = await Division.findById(req.params.divisionId);
    if (!division) {
      return res.status(404).json({
        success: false,
        message: 'Division not found'
      });
    }

    const districts = await District.find({ division_id: req.params.divisionId })
      .sort({ name: 1 })
      .populate('state_id', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username')

    // Enforce user hierarchy for division-scoped listing
    if (req.user && req.user.role !== 'superAdmin' && req.userHierarchy) {
      const h = req.userHierarchy;
      // Extract IDs from populated objects or direct ID values
      const divisionId = h.division?._id || h.division;
      const stateId = h.state?._id || h.state;

      if (divisionId && divisionId.toString() !== req.params.divisionId) {
        return res.status(403).json({ success: false, message: 'Forbidden: resource outside your geographic scope' });
      }
      if (stateId && stateId.toString() !== (districts[0]?.state_id?.toString())) {
        // If user's scope is a different state, forbid
        return res.status(403).json({ success: false, message: 'Forbidden: resource outside your geographic scope' });
      }
    }

    res.status(200).json({
      success: true,
      count: districts.length,
      data: districts
    });
  } catch (err) {
    next(err);
  }
};