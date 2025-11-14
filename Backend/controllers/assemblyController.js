const Assembly = require('../models/Assembly');
const State = require('../models/state');
const District = require('../models/District');
const Division = require('../models/Division');
const Parliament = require('../models/Parliament');

// @desc    Get all assemblies
// @route   GET /api/assemblies
// @access  Public
exports.getAssemblies = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit);
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};

    // Enhanced search functionality: prefer exact matches when appropriate
    if (req.query.search) {
      const raw = String(req.query.search).trim();

      // If search looks like a Mongo ObjectId (24 hex chars), try exact _id match first
      const isObjectIdLike = /^[a-fA-F0-9]{24}$/.test(raw);

      // If search is numeric only (e.g., AC_NO like '197'), prefer exact AC_NO match
      const isNumeric = /^\d+$/.test(raw);

      if (isObjectIdLike) {
        filter._id = raw;
      } else if (isNumeric) {
        // exact AC_NO equality first
        filter.AC_NO = raw;
      } else {
        // Fuzzy search across useful string fields
        const searchRegex = { $regex: raw, $options: 'i' };
        filter.$or = [
          { name: searchRegex },
          { description: searchRegex },
          { AC_NO: searchRegex },
          { type: searchRegex },
          { category: searchRegex }
        ];
      }
      console.log('🔎 Assembly search filter applied:', JSON.stringify(filter));
    }

    // Filter by type (case-insensitive)
    if (req.query.type) {
      filter.type = { $regex: `^${req.query.type}$`, $options: 'i' };
    }

    // Filter by category (case-insensitive)
    if (req.query.category) {
      filter.category = { $regex: `^${req.query.category}$`, $options: 'i' };
    }

    // Filter by state
    if (req.query.state_id) {
      filter.state_id = req.query.state_id;
    }

    // Filter by district
    if (req.query.district) {
      filter.district_id = req.query.district;
    }

    // Filter by division
    if (req.query.division) {
      filter.division_id = req.query.division;
    }

    // Filter by parliament
    if (req.query.parliament) {
      filter.parliament_id = req.query.parliament;
    }

    // If userHierarchy exists, restrict by user's scope (most specific first)
    if (req.userHierarchy) {
      if (req.userHierarchy.assembly_ids && req.userHierarchy.assembly_ids.length > 0) {
        filter._id = { $in: req.userHierarchy.assembly_ids };
      } else if (req.userHierarchy.parliament_ids && req.userHierarchy.parliament_ids.length > 0) {
        filter.parliament_id = { $in: req.userHierarchy.parliament_ids };
      } else if (req.userHierarchy.division_ids && req.userHierarchy.division_ids.length > 0) {
        filter.division_id = { $in: req.userHierarchy.division_ids };
      } else if (req.userHierarchy.state_ids && req.userHierarchy.state_ids.length > 0) {
        filter.state_id = { $in: req.userHierarchy.state_ids };
      }
    }

    let query = Assembly.find(filter)
      .populate('state_id', '_id name')
      .populate('district_id', '_id name')
      .populate('division_id', '_id name')
      .populate('parliament_id', '_id name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username')
      .sort({ name: 1 });

    const assemblies = await query.skip(skip).limit(limit).exec();
    const total = await Assembly.countDocuments(filter);

    // Diagnostic logging: show a trimmed sample of returned assemblies when search is provided
    try {
      if (req.query.search) {
        console.log('🔎 Assemblies search:', req.query.search, '=> returned', assemblies.length, 'candidates');
        console.log('🔎 Candidate sample:', assemblies.slice(0,10).map(a => ({ _id: a._id, AC_NO: a.AC_NO, name: a.name })));
      }
    } catch (e) {
      console.warn('Could not log assembly candidates:', e && e.message);
    }

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
    // If userHierarchy exists, ensure user can access this assembly
    if (req.userHierarchy) {
      const assemblyIds = req.userHierarchy.assembly_ids || [];
      const parliamentIds = req.userHierarchy.parliament_ids || [];
      const divisionIds = req.userHierarchy.division_ids || [];
      const stateIds = req.userHierarchy.state_ids || [];

      // Check if any restriction is in place
      const hasRestrictions = assemblyIds.length > 0 || parliamentIds.length > 0 || 
                             divisionIds.length > 0 || stateIds.length > 0;

      if (hasRestrictions) {
        const a = await Assembly.findById(req.params.id).select('parliament_id division_id state_id');
        if (!a) {
          return res.status(404).json({ success: false, message: 'Assembly not found' });
        }

        const hasAccess = (assemblyIds.length === 0 || assemblyIds.some(id => id.toString() === req.params.id)) &&
                         (parliamentIds.length === 0 || parliamentIds.some(id => id.toString() === a.parliament_id.toString())) &&
                         (divisionIds.length === 0 || divisionIds.some(id => id.toString() === a.division_id.toString())) &&
                         (stateIds.length === 0 || stateIds.some(id => id.toString() === a.state_id.toString()));

        if (!hasAccess) {
          return res.status(403).json({ success: false, message: 'Access denied: geographic restriction' });
        }
      }
    }

    const assembly = await Assembly.findById(req.params.id)
      .populate('state_id', '_id name')
      .populate('district_id', '_id name')
      .populate('division_id', '_id name')
      .populate('parliament_id', '_id name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username'); // Add population of updated_by


    if (!assembly) {
      return res.status(404).json({
        success: false,
        message: 'Assembly not found'
      });
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
    // Verify state exists
    const state = await State.findById(req.body.state_id);
    if (!state) {
      return res.status(400).json({
        success: false,
        message: 'State not found'
      });
    }

    // Verify district exists
    // const district = await District.findById(req.body.district_id);
    // if (!district) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'District not found'
    //   });
    // }

    // Verify division exists
    const division = await Division.findById(req.body.division_id);
    if (!division) {
      return res.status(400).json({
        success: false,
        message: 'Division not found'
      });
    }

    // Verify parliament exists
    const parliament = await Parliament.findById(req.body.parliament_id);
    if (!parliament) {
      return res.status(400).json({
        success: false,
        message: 'Parliament not found'
      });
    }

    // Check if user exists in request
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }


    // Only allow fields that are in the schema
    const assemblyData = {
      name: req.body.name,
      description: req.body.description || '',
      AC_NO: req.body.AC_NO,
      type: req.body.type,
      category: req.body.category,
      state_id: req.body.state_id,
      district_id: req.body.district_id,
      division_id: req.body.division_id,
      parliament_id: req.body.parliament_id,
      created_by: req.user.id,
      updated_by: req.user.id
    };

    const assembly = await Assembly.create(assemblyData);

    res.status(201).json({
      success: true,
      data: assembly
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Assembly with this name already exists'
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

    // Verify district exists if being updated
    if (req.body.district_id) {
      const district = await District.findById(req.body.district_id);
      if (!district) {
        return res.status(400).json({
          success: false,
          message: 'District not found'
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

    // Set updated_by from authenticated user
    req.body.updated_by = req.user.id;


    // Only allow fields that are in the schema
    const updateData = {
      name: req.body.name,
      description: req.body.description || '',
      AC_NO: req.body.AC_NO,
      type: req.body.type,
      category: req.body.category,
      state_id: req.body.state_id,
      district_id: req.body.district_id,
      division_id: req.body.division_id,
      parliament_id: req.body.parliament_id,
      updated_by: req.user.id,
      updated_at: new Date()
    };

    assembly = await Assembly.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    })
      .populate('state_id', 'name')
      .populate('district_id', 'name')
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username'); // Add population of updated_by

    res.status(200).json({
      success: true,
      data: assembly
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Assembly with this name already exists'
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

// @desc    Get assemblies by parliament
// @route   GET /api/assemblies/parliament/:parliamentId
// @access  Public
exports.getAssembliesByParliament = async (req, res, next) => {
  try {
    // Verify parliament exists
    const parliament = await Parliament.findById(req.params.parliamentId);
    if (!parliament) {
      return res.status(404).json({
        success: false,
        message: 'Parliament not found'
      });
    }

    // If userHierarchy exists, restrict by user's scope
    if (req.userHierarchy) {
      const parliamentIds = req.userHierarchy.parliament_ids || [];
      const divisionIds = req.userHierarchy.division_ids || [];
      const stateIds = req.userHierarchy.state_ids || [];

      const hasRestrictions = parliamentIds.length > 0 || divisionIds.length > 0 || stateIds.length > 0;

      if (hasRestrictions) {
        const hasAccess = (parliamentIds.length === 0 || parliamentIds.some(id => id.toString() === req.params.parliamentId)) &&
                         (divisionIds.length === 0 || parliament.division_id && divisionIds.some(id => id.toString() === parliament.division_id.toString())) &&
                         (stateIds.length === 0 || parliament.state_id && stateIds.some(id => id.toString() === parliament.state_id.toString()));

        if (!hasAccess) {
          return res.status(403).json({ success: false, message: 'Access denied: geographic restriction' });
        }
      }
    }

    const assemblies = await Assembly.find({ parliament_id: req.params.parliamentId })
      .sort({ name: 1 })
      .populate('state_id', 'name')
      .populate('district_id', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username'); // Add population of updated_by


    res.status(200).json({
      success: true,
      count: assemblies.length,
      data: assemblies
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get assemblies by division
// @route   GET /api/assemblies/division/:divisionId
// @access  Public
exports.getAssembliesByDivision = async (req, res, next) => {
  try {
    // Verify division exists
    const division = await Division.findById(req.params.divisionId);
    if (!division) {
      return res.status(404).json({
        success: false,
        message: 'Division not found'
      });
    }

    // If userHierarchy exists, restrict by user's scope
    if (req.userHierarchy) {
      const divisionIds = req.userHierarchy.division_ids || [];
      const stateIds = req.userHierarchy.state_ids || [];

      const hasRestrictions = divisionIds.length > 0 || stateIds.length > 0;

      if (hasRestrictions) {
        const hasAccess = (divisionIds.length === 0 || divisionIds.some(id => id.toString() === req.params.divisionId)) &&
                         (stateIds.length === 0 || division.state && stateIds.some(id => id.toString() === division.state.toString()));

        if (!hasAccess) {
          return res.status(403).json({ success: false, message: 'Access denied: geographic restriction' });
        }
      }
    }

    const assemblies = await Assembly.find({ division_id: req.params.divisionId })
      .sort({ name: 1 })
      .populate('state_id', 'name')
      .populate('district_id', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username'); // Add population of updated_by


    res.status(200).json({
      success: true,
      count: assemblies.length,
      data: assemblies
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Bulk import assemblies (client sends parsed rows)
// @route   POST /api/assemblies/import
// @access  Private (Admin only)
exports.importAssemblies = async (req, res, next) => {
  try {
    const rows = Array.isArray(req.body?.rows) ? req.body.rows : null;
    if (!rows) {
      return res.status(400).json({ success: false, message: 'rows array is required in body' });
    }

    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    // Normalize headers and collect lookup keys
    const toKey = (s) => String(s || '').trim();
    const toUpper = (s) => String(s || '').trim().toUpperCase();
    const toTitle = (s) => {
      const x = String(s || '').trim().toLowerCase();
      if (x === 'urban' || x === 'rural' || x === 'mixed') return x.charAt(0).toUpperCase() + x.slice(1);
      if (x === 'general' || x === 'reserved' || x === 'special') return x.charAt(0).toUpperCase() + x.slice(1);
      return s;
    };

    const divisionCodes = new Set();
    const parliamentNos = new Set();
    for (const r of rows) {
      const dc = toUpper(r.division_code || r.Division_Code || r.DIVISION_CODE || r.division || r.Division);
      if (dc) divisionCodes.add(dc);
      const pnRaw = r.parliament_no ?? r.Parliament_No ?? r.PARLIAMENT_NO ?? r.parliament ?? r.Parliament;
      if (pnRaw !== undefined && pnRaw !== null && pnRaw !== '') {
        const pn = Number(String(pnRaw).trim());
        if (!Number.isNaN(pn)) parliamentNos.add(pn);
      }
    }

    // Preload lookups
    const [divisions, parliaments] = await Promise.all([
      divisionCodes.size ? Division.find({ division_code: { $in: Array.from(divisionCodes) } }) : [],
      parliamentNos.size ? Parliament.find({ parliament_no: { $in: Array.from(parliamentNos) } }) : []
    ]);
    const divisionByCode = new Map(divisions.map(d => [toUpper(d.division_code), d]));
    const parliamentByNo = new Map(parliaments.map(p => [Number(p.parliament_no), p]));

    const summary = { total: rows.length, created: 0, skipped: 0, errors: [] };
    const created = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i] || {};
      try {
        const name = toKey(r.name ?? r.Name);
        const AC_NO = toKey(r.AC_NO ?? r.ac_no ?? r.Ac_No);
        const description = String(r.description ?? r.Description ?? '').trim();
        const type = toTitle(r.type ?? r.Type);
        const category = toTitle(r.category ?? r.Category);
        const division_code = toUpper(r.division_code ?? r.Division_Code ?? r.DIVISION_CODE ?? r.division ?? r.Division);
        const pnRaw = r.parliament_no ?? r.Parliament_No ?? r.PARLIAMENT_NO ?? r.parliament ?? r.Parliament;
        const parliament_no = pnRaw !== undefined && pnRaw !== null && pnRaw !== '' ? Number(String(pnRaw).trim()) : NaN;

        if (!name || !AC_NO) {
          throw new Error('name and AC_NO are required');
        }
        if (!type || !['Urban', 'Rural', 'Mixed'].includes(type)) {
          throw new Error('type must be one of Urban, Rural, Mixed');
        }
        if (!category || !['General', 'Reserved', 'Special'].includes(category)) {
          throw new Error('category must be one of General, Reserved, Special');
        }
        if (Number.isNaN(parliament_no)) {
          throw new Error('parliament_no is required and must be a number');
        }

        // Resolve division: prefer code match, fallback to name match
        let division = division_code ? divisionByCode.get(division_code) : null;
        if (!division && division_code) {
          // try matching division by name when code lookup fails
          const divName = division_code;
          const divDoc = await Division.findOne({ name: { $regex: `^${divName}$`, $options: 'i' } });
          if (divDoc) division = divDoc;
        }

        // Resolve parliament: prefer numeric match, fallback to name match
        let parliament = parliamentByNo.get(parliament_no);
        if (!parliament) {
          const pNameCandidate = toKey(r.parliament ?? r.Parliament ?? r.parliament_name ?? r.Parliament_Name);
          if (pNameCandidate) {
            const pDoc = await Parliament.findOne({ name: { $regex: `^${pNameCandidate}$`, $options: 'i' } });
            if (pDoc) parliament = pDoc;
          }
        }

        if (!parliament) {
          // If division is known, try a smart fallback: if exactly one parliament exists in that division, use it
          if (division) {
            const ps = await Parliament.find({ division_id: division._id }).select('_id name parliament_no division_id');
            if (Array.isArray(ps) && ps.length === 1) {
              parliament = ps[0];
            } else {
              const nums = (ps || []).map(p => p.parliament_no).filter(v => v !== undefined && v !== null);
              throw new Error(`Parliament not found for parliament_no=${parliament_no}. In division ${division_code || division.name}, available parliament_no: ${nums.join(', ') || 'none'}`);
            }
          } else {
            throw new Error(`Parliament not found for parliament_no=${parliament_no}. Provide a valid parliament_no or a parliament name in column 'parliament'.`);
          }
        }

        // If division provided, ensure it matches parliament's division
        if (division && String(parliament.division_id) !== String(division._id)) {
          throw new Error(`Parliament(${parliament.parliament_no || parliament_no}) does not belong to Division(${division_code})`);
        }

        // Check duplicates on name or AC_NO
        const existing = await Assembly.findOne({ $or: [{ name }, { AC_NO }] });
        if (existing) {
          summary.skipped += 1;
          summary.errors.push({ row: i + 1, message: `Duplicate assembly (name or AC_NO): ${name} / ${AC_NO}` });
          continue;
        }

        const assemblyData = {
          name,
          description,
          AC_NO,
          type,
          category,
          state_id: division ? division.state_id : parliament.state_id,
          district_id: undefined,
          division_id: division ? division._id : parliament.division_id,
          parliament_id: parliament._id,
          created_by: req.user.id,
          updated_by: req.user.id
        };

        const createdOne = await Assembly.create(assemblyData);
        created.push(createdOne._id);
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