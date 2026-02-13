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
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit);

    // If searching or no limit provided, set a high limit
    if (!!req.query.search || !limit || limit <= 0) {
      limit = 10000;
    }
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
      const isObjectId = /^[a-f\d]{24}$/i.test(req.query.state_id);
      if (isObjectId) {
        filter.state_id = req.query.state_id;
      } else {
        const stateDoc = await State.findOne({ name: req.query.state_id });
        if (stateDoc) {
          filter.state_id = stateDoc._id;
        } else {
          // No such state, return empty result
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

    // Filter by district
    if (req.query.district) {
      const isObjectId = /^[a-f\d]{24}$/i.test(req.query.district);
      if (isObjectId) {
        filter.district_id = req.query.district;
      } else {
        const districtDoc = await District.findOne({ name: req.query.district });
        if (districtDoc) {
          filter.district_id = districtDoc._id;
        } else {
          // No such district, return empty result
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
        filter.division_id = req.query.division;
      } else {
        const divisionDoc = await Division.findOne({ name: req.query.division });
        if (divisionDoc) {
          filter.division_id = divisionDoc._id;
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

    // Filter by parliament
    if (req.query.parliament) {
      const isObjectId = /^[a-f\d]{24}$/i.test(req.query.parliament);
      if (isObjectId) {
        filter.parliament_id = req.query.parliament;
      } else {
        const parliamentDoc = await Parliament.findOne({ name: req.query.parliament });
        if (parliamentDoc) {
          filter.parliament_id = parliamentDoc._id;
        } else {
          // No such parliament, return empty result
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

    // If userHierarchy exists, restrict by user's scope (most specific first)
    if (req.userHierarchy) {
      if (req.userHierarchy.assembly) {
        filter._id = req.userHierarchy.assembly._id;
      } else if (req.userHierarchy.parliament) {
        filter.parliament_id = req.userHierarchy.parliament._id;
      } else if (req.userHierarchy.division) {
        filter.division_id = req.userHierarchy.division._id;
      } else if (req.userHierarchy.state) {
        filter.state_id = req.userHierarchy.state._id;
      }
    }

    let query = Assembly.find(filter)
      .populate('state_id', '_id name')
      .populate('district_id', '_id name')
      .populate('division_id', '_id name')
      .populate('parliament_id', '_id name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username')
      .select('-polygon')
      .sort({ name: 1 });

    const assemblies = await query.skip(skip).limit(limit).exec();
    const total = await Assembly.countDocuments(filter);

    // Diagnostic logging: show a trimmed sample of returned assemblies when search is provided
    try {
      if (req.query.search) {
        console.log('🔎 Assemblies search:', req.query.search, '=> returned', assemblies.length, 'candidates');
        console.log('🔎 Candidate sample:', assemblies.slice(0, 10).map(a => ({ _id: a._id, AC_NO: a.AC_NO, name: a.name })));
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
      if (req.userHierarchy.assembly && req.userHierarchy.assembly._id.toString() !== req.params.id) {
        return res.status(403).json({ success: false, message: 'Access denied: geographic restriction' });
      }
      if (req.userHierarchy.parliament) {
        const a = await Assembly.findById(req.params.id).select('parliament_id');
        if (!a || a.parliament_id.toString() !== req.userHierarchy.parliament._id.toString()) {
          return res.status(403).json({ success: false, message: 'Access denied: geographic restriction' });
        }
      }
      if (req.userHierarchy.division) {
        const a = await Assembly.findById(req.params.id).select('division_id');
        if (!a || a.division_id.toString() !== req.userHierarchy.division._id.toString()) {
          return res.status(403).json({ success: false, message: 'Access denied: geographic restriction' });
        }
      }
      if (req.userHierarchy.state) {
        const a = await Assembly.findById(req.params.id).select('state_id');
        if (!a || a.state_id.toString() !== req.userHierarchy.state._id.toString()) {
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

    if (req.body.polygon) {
      updateData.polygon = req.body.polygon;
    }

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
      if (req.userHierarchy.assembly) {
        const a = await Assembly.findById(req.userHierarchy.assembly._id);
        if (!a || a.parliament_id.toString() !== req.params.parliamentId) {
          return res.status(403).json({ success: false, message: 'Access denied: geographic restriction' });
        }
      }
      if (req.userHierarchy.parliament) {
        if (req.userHierarchy.parliament._id.toString() !== req.params.parliamentId) {
          return res.status(403).json({ success: false, message: 'Access denied: geographic restriction' });
        }
      }
      if (req.userHierarchy.division) {
        // ensure division belongs to the specified parliament (optional DB check)
        // We'll allow since assemblies under division are okay if division belongs to same state
      }
      if (req.userHierarchy.state) {
        // ensure state is same as requested parliament's state if necessary
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
      if (req.userHierarchy.assembly) {
        const a = await Assembly.findById(req.userHierarchy.assembly._id);
        if (!a || a.division_id.toString() !== req.params.divisionId) {
          return res.status(403).json({ success: false, message: 'Access denied: geographic restriction' });
        }
      }
      if (req.userHierarchy.parliament) {
        const a = await Assembly.findById(req.userHierarchy.assembly?._id || req.params.divisionId).select('parliament_id');
        // best-effort check skipped here
      }
      if (req.userHierarchy.division) {
        if (req.userHierarchy.division._id.toString() !== req.params.divisionId) {
          return res.status(403).json({ success: false, message: 'Access denied: geographic restriction' });
        }
      }
      if (req.userHierarchy.state) {
        if (division.state && division.state.toString() !== req.userHierarchy.state._id.toString()) {
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
      // Try to find assembly by different property names
      // Common keys: AC_NO, AC_NAME, AC_NAME_E, name, NAME, etc.
      const acNo = props.AC_NO || props.ac_no || props['AC NO'];
      const acName = props.AC_NAME || props.AC_NAME_E || props.ACNAME || props.Name || props.NAME || props.name;

      if (!acNo && !acName) {
        errors.push('Feature passed without a valid match property (AC_NO or Name)');
        continue;
      }

      let assembly = null;

      // Try finding by AC_NO first if available
      if (acNo) {
        assembly = await Assembly.findOne({ AC_NO: String(acNo).trim() });
      }

      // If not found by AC_NO, try by Name
      if (!assembly && acName) {
        assembly = await Assembly.findOne({
          name: { $regex: new RegExp(`^${acName}$`, 'i') }
        });
      }

      if (assembly) {
        // Update assembly with polygon feature
        assembly.polygon = feature;
        await assembly.save();
        updatedCount++;
      } else {
        errors.push(`Assembly not found for: AC_NO=${acNo}, Name=${acName}`);
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