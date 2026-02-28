const Government = require('../models/government');
const State = require('../models/state');
const Division = require('../models/Division');
const Parliament = require('../models/Parliament');
const Assembly = require('../models/Assembly');
const Block = require('../models/block');
const Booth = require('../models/booth');

// @desc    Get all government projects
// @route   GET /api/governments
// @access  Public
exports.getGovernments = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit);
    const skip = (page - 1) * limit;

    // Basic query
    let query = Government.find()
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name')
      .populate('block_id', 'name')
      .populate('booth_id', 'name booth_number')
      .populate('panchayat_id', 'panchayat_name')
      .populate('village_id', 'village_name')
      .populate('falliya_id', 'falliya_name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username')
      .sort({ name: 1 });

    // Apply optional user hierarchy filtering if middleware provided it and user is not superAdmin
    try {
      if (req.user && req.user.role !== 'superAdmin' && req.userHierarchy) {
        const h = req.userHierarchy;
        
        // Get the most specific access level (booth > block > assembly > parliament > division > state)
        const boothIds = h.booth_ids && h.booth_ids.length > 0 
            ? h.booth_ids.map(b => b._id || b) 
            : [];
        const blockIds = h.block_ids && h.block_ids.length > 0 
            ? h.block_ids.map(b => b._id || b) 
            : [];
        const assemblyIds = h.assembly_ids && h.assembly_ids.length > 0 
            ? h.assembly_ids.map(a => a._id || a) 
            : [];
        const parliamentIds = h.parliament_ids && h.parliament_ids.length > 0 
            ? h.parliament_ids.map(p => p._id || p) 
            : [];
        const divisionIds = h.division_ids && h.division_ids.length > 0 
            ? h.division_ids.map(d => d._id || d) 
            : [];
        const stateIds = h.state_ids && h.state_ids.length > 0 
            ? h.state_ids.map(s => s._id || s) 
            : [];

        if (boothIds.length > 0) {
          query = query.where('booth_id').in(boothIds);
        } else if (blockIds.length > 0) {
          query = query.where('block_id').in(blockIds);
        } else if (assemblyIds.length > 0) {
          query = query.where('assembly_id').in(assemblyIds);
        } else if (parliamentIds.length > 0) {
          query = query.where('parliament_id').in(parliamentIds);
        } else if (divisionIds.length > 0) {
          query = query.where('division_id').in(divisionIds);
        } else if (stateIds.length > 0) {
          query = query.where('state_id').in(stateIds);
        }
      }
    } catch (e) {
      // ignore malformed hierarchy
    }

    // Search functionality
    if (req.query.search) {
      query = query.find({
        $or: [
          { name: { $regex: req.query.search, $options: 'i' } }
        ]
      });
    }

    // Filter by type
    if (req.query.type) {
      query = query.where('type').equals(req.query.type);
    }

    // Filter by state
    if (req.query.state) {
      query = query.where('state_id').equals(req.query.state);
    }

    // Filter by division
    if (req.query.division) {
      query = query.where('division_id').equals(req.query.division);
    }

    // Filter by parliament
    if (req.query.parliament) {
      query = query.where('parliament_id').equals(req.query.parliament);
    }

    // Filter by assembly
    if (req.query.assembly) {
      query = query.where('assembly_id').equals(req.query.assembly);
    }

    // Filter by block
    if (req.query.block) {
      query = query.where('block_id').equals(req.query.block);
    }

    // Filter by booth
    if (req.query.booth) {
      query = query.where('booth_id').equals(req.query.booth);
    }

    // Filter by panchayat
    if (req.query.panchayat) {
      query = query.where('panchayat_id').equals(req.query.panchayat);
    }

    // Filter by village
    if (req.query.village) {
      query = query.where('village_id').equals(req.query.village);
    }

    // Filter by falliya
    if (req.query.falliya) {
      query = query.where('falliya_id').equals(req.query.falliya);
    }

    // Filter by year
    if (req.query.year) {
      query = query.where('year').equals(parseInt(req.query.year));
    }

    const governments = await query.skip(skip).limit(limit).exec();
    const total = await Government.countDocuments(query.getFilter());

    res.status(200).json({
      success: true,
      count: governments.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: governments
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single government project
// @route   GET /api/governments/:id
// @access  Public
exports.getGovernment = async (req, res, next) => {
  try {
    const government = await Government.findById(req.params.id)
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name')
      .populate('block_id', 'name')
      .populate('booth_id', 'name booth_number')
      .populate('panchayat_id', 'panchayat_name')
      .populate('village_id', 'village_name')
      .populate('falliya_id', 'falliya_name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    if (!government) {
      return res.status(404).json({
        success: false,
        message: 'Government project not found'
      });
    }

    // Enforce single-resource scope for non-superAdmin users if hierarchy present
    if (req.user && req.user.role !== 'superAdmin' && req.userHierarchy) {
      const h = req.userHierarchy;
      
      // Get the most specific access level (booth > block > assembly > parliament > division > state)
      const boothIds = h.booth_ids && h.booth_ids.length > 0 
          ? h.booth_ids.map(b => String(b._id || b)) 
          : [];
      const blockIds = h.block_ids && h.block_ids.length > 0 
          ? h.block_ids.map(b => String(b._id || b)) 
          : [];
      const assemblyIds = h.assembly_ids && h.assembly_ids.length > 0 
          ? h.assembly_ids.map(a => String(a._id || a)) 
          : [];
      const parliamentIds = h.parliament_ids && h.parliament_ids.length > 0 
          ? h.parliament_ids.map(p => String(p._id || p)) 
          : [];
      const divisionIds = h.division_ids && h.division_ids.length > 0 
          ? h.division_ids.map(d => String(d._id || d)) 
          : [];
      const stateIds = h.state_ids && h.state_ids.length > 0 
          ? h.state_ids.map(s => String(s._id || s)) 
          : [];

      // Check if government record is within user's scope
      let isInScope = false;
      
      if (boothIds.length > 0) {
        isInScope = government.booth_id && boothIds.includes(String(government.booth_id._id || government.booth_id));
      } else if (blockIds.length > 0) {
        isInScope = government.block_id && blockIds.includes(String(government.block_id._id || government.block_id));
      } else if (assemblyIds.length > 0) {
        isInScope = government.assembly_id && assemblyIds.includes(String(government.assembly_id._id || government.assembly_id));
      } else if (parliamentIds.length > 0) {
        isInScope = government.parliament_id && parliamentIds.includes(String(government.parliament_id._id || government.parliament_id));
      } else if (divisionIds.length > 0) {
        isInScope = government.division_id && divisionIds.includes(String(government.division_id._id || government.division_id));
      } else if (stateIds.length > 0) {
        isInScope = government.state_id && stateIds.includes(String(government.state_id._id || government.state_id));
      }

      if (!isInScope) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }
    }

    res.status(200).json({
      success: true,
      data: government
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create government project
// @route   POST /api/governments
// @access  Private (Admin only)
exports.createGovernment = async (req, res, next) => {
  try {
    // Sanitize optional fields: treat empty string as undefined
    ['panchayat_id', 'village_id', 'falliya_id', 'year'].forEach((k) => {
      if (req.body && (req.body[k] === '' || req.body[k] === null)) delete req.body[k];
    });

    // Verify all references exist
    const [
      state,
      division,
      parliament,
      assembly,
      block,
      booth
    ] = await Promise.all([
      State.findById(req.body.state_id),
      Division.findById(req.body.division_id),
      Parliament.findById(req.body.parliament_id),
      Assembly.findById(req.body.assembly_id)
      , Block.findById(req.body.block_id || req.body.blockId),
      Booth.findById(req.body.booth_id || req.body.boothId)
    ]);

    if (!state) {
      return res.status(400).json({ success: false, message: 'State not found' });
    }
    if (!division) {
      return res.status(400).json({ success: false, message: 'Division not found' });
    }
    if (!parliament) {
      return res.status(400).json({ success: false, message: 'Parliament not found' });
    }
    if (!assembly) {
      return res.status(400).json({ success: false, message: 'Assembly not found' });
    }
    if (req.body.block_id && !block) {
      return res.status(400).json({ success: false, message: 'Block not found' });
    }
    if (req.body.booth_id && !booth) {
      return res.status(400).json({ success: false, message: 'Booth not found' });
    }

    // Check if user exists in request
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }

    const governmentData = {
      ...req.body,
      created_by: req.user.id,
       description: req.body.description || '',
      updated_by: req.user.id
    };

    const government = await Government.create(governmentData);

    res.status(201).json({
      success: true,
      data: government
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update government project
// @route   PUT /api/governments/:id
// @access  Private (Admin only)
exports.updateGovernment = async (req, res, next) => {
  try {
    // Sanitize optional fields: treat empty string as undefined
    ['panchayat_id', 'village_id', 'falliya_id', 'year'].forEach((k) => {
      if (req.body && (req.body[k] === '' || req.body[k] === null)) delete req.body[k];
    });

    let government = await Government.findById(req.params.id);

    if (!government) {
      return res.status(404).json({
        success: false,
        message: 'Government project not found'
      });
    }

    // Verify all references exist if being updated
    const verificationPromises = [];
    if (req.body.state_id) verificationPromises.push(State.findById(req.body.state_id));
    if (req.body.division_id) verificationPromises.push(Division.findById(req.body.division_id));
    if (req.body.parliament_id) verificationPromises.push(Parliament.findById(req.body.parliament_id));
    if (req.body.assembly_id) verificationPromises.push(Assembly.findById(req.body.assembly_id));
  if (req.body.block_id) verificationPromises.push(Block.findById(req.body.block_id));
  if (req.body.booth_id) verificationPromises.push(Booth.findById(req.body.booth_id));

    const verificationResults = await Promise.all(verificationPromises);
    
    for (const result of verificationResults) {
      if (!result) {
        return res.status(400).json({
          success: false,
          message: 'Reference not found'
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
    req.body.description = req.body.description || '';
    req.body.updated_at = new Date();

    government = await Government.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    res.status(200).json({
      success: true,
      data: government
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete government project
// @route   DELETE /api/governments/:id
// @access  Private (Admin only)
exports.deleteGovernment = async (req, res, next) => {
  try {
    const government = await Government.findById(req.params.id);

    if (!government) {
      return res.status(404).json({
        success: false,
        message: 'Government project not found'
      });
    }

    await government.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get government projects by state
// @route   GET /api/governments/state/:stateId
// @access  Public
exports.getGovernmentsByState = async (req, res, next) => {
  try {
    const state = await State.findById(req.params.stateId);
    if (!state) {
      return res.status(404).json({
        success: false,
        message: 'State not found'
      });
    }

    const governments = await Government.find({ state_id: req.params.stateId })
      .sort({ name: 1 })
      .populate('division_id', 'name')
      .populate('created_by', 'username');

    res.status(200).json({
      success: true,
      count: governments.length,
      data: governments
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get government projects by assembly
// @route   GET /api/governments/assembly/:assemblyId
// @access  Public
exports.getGovernmentsByAssembly = async (req, res, next) => {
  try {
    const assembly = await Assembly.findById(req.params.assemblyId);
    if (!assembly) {
      return res.status(404).json({
        success: false,
        message: 'Assembly not found'
      });
    }

    const governments = await Government.find({ assembly_id: req.params.assemblyId })
      .sort({ name: 1 })
      .populate('created_by', 'username');

    res.status(200).json({
      success: true,
      count: governments.length,
      data: governments
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Import governments from Excel
// @route   POST /api/governments/import
// @access  Private/Admin
exports.importGovernments = async (req, res, next) => {
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

        // Validate required hierarchy fields
        const hierarchyErrors = validateHierarchy(geo, ['state']);
        if (hierarchyErrors.length > 0) {
          results.errors.push({
            row: i + 1,
            data: row,
            error: hierarchyErrors.join(', ')
          });
          continue;
        }

        // Validate required hierarchy fields - Government requires state, division, parliament, assembly
        const requiredHierarchy = validateHierarchy(geo, ['state', 'division', 'parliament', 'assembly']);
        if (requiredHierarchy.length > 0) {
          results.errors.push({
            row: i + 1,
            data: row,
            error: requiredHierarchy.join(', ')
          });
          continue;
        }

        // Check for required fields
        if (!row.name) {
          results.errors.push({
            row: i + 1,
            data: row,
            error: 'name is required'
          });
          continue;
        }

        if (!row.amount) {
          results.errors.push({
            row: i + 1,
            data: row,
            error: 'amount is required'
          });
          continue;
        }

        // Parse year if provided
        const year = row.year ? parseInt(row.year) : null;
        if (year && (year < 2020 || year > 2030)) {
          results.errors.push({
            row: i + 1,
            data: row,
            error: 'year must be between 2020 and 2030'
          });
          continue;
        }

        // Create government schema entry
        const governmentData = {
          name: row.name,
          type: row.type || 'new',
          amount: parseFloat(row.amount) || 0,
          project_complete_date: row.project_complete_date ? new Date(row.project_complete_date) : null,
          description: row.description || '',
          state_id: geo.state._id,
          division_id: geo.division._id,
          parliament_id: geo.parliament._id,
          assembly_id: geo.assembly._id,
          created_by: req.user._id,
          updated_by: req.user._id
        };

        // Optional year field
        if (year) {
          governmentData.year = year;
        }

        // Optional geographic fields
        if (geo.block) governmentData.block_id = geo.block._id;
        if (geo.booth) governmentData.booth_id = geo.booth._id;
        if (geo.panchayat) governmentData.panchayat_id = geo.panchayat._id;
        if (geo.village) governmentData.village_id = geo.village._id;
        if (geo.falliya) governmentData.falliya_id = geo.falliya._id;

        await Government.create(governmentData);
        results.imported++;

      } catch (err) {
        results.errors.push({
          row: i + 1,
          data: row,
          error: err.message || 'Failed to import government schema'
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