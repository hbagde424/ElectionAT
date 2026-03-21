const Samiti = require('../models/Samiti');
const State = require('../models/state');
const Division = require('../models/Division');
const Parliament = require('../models/Parliament');
const Assembly = require('../models/Assembly');
const Block = require('../models/block');
const Booth = require('../models/booth');

// @desc    Get all samitis
// @route   GET /api/samitis
// @access  Private (Requires authentication via serviceToken)
exports.getSamitis = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};

    // Search functionality
    if (req.query.search) {
      const searchRegex = { $regex: req.query.search, $options: 'i' };
      filter.$or = [
        { samiti_name: searchRegex }
      ];
    }

    // Filter by hierarchical entities
    if (req.query.state_id) {
      filter.state_id = req.query.state_id;
    }
    if (req.query.division_id) {
      filter.division_id = req.query.division_id;
    }
    if (req.query.parliament_id) {
      filter.parliament_id = req.query.parliament_id;
    }
    if (req.query.assembly_id) {
      filter.assembly_id = req.query.assembly_id;
    }
    if (req.query.block_id) {
      filter.block_id = req.query.block_id;
    }
    if (req.query.booth_id) {
      filter.booth_id = req.query.booth_id;
    }

    // Filter by local administrative refs
    if (req.query.panchayat_id) filter.panchayat_id = req.query.panchayat_id;
    // Frontend may send either village_id (object id) or village (string). Support both.
    if (req.query.village_id) filter.village_id = req.query.village_id;
    if (req.query.village) filter.village = req.query.village;
    // Frontend may send either falliya_id (object id) or falia/falliya (string). Support both.
    if (req.query.falliya_id) filter.falliya_id = req.query.falliya_id;
    if (req.query.falia) filter.falia = req.query.falia;
    if (req.query.falliya) filter.falliya = req.query.falliya;

    // Year filter (supports numeric year e.g. 2024)
    if (req.query.year) {
      const y = parseInt(req.query.year, 10);
      if (!Number.isNaN(y)) {
        filter.year = y;
      } else {
        filter.year = req.query.year;
      }
    }

    // Apply user hierarchy restrictions if exists (array-based filtering)
    if (req.userHierarchy) {
      // Get the most specific access level (booth > block > assembly > parliament > division > state)
      const boothIds = req.userHierarchy.booth_ids && req.userHierarchy.booth_ids.length > 0
        ? req.userHierarchy.booth_ids.map(b => b._id || b)
        : [];
      const blockIds = req.userHierarchy.block_ids && req.userHierarchy.block_ids.length > 0
        ? req.userHierarchy.block_ids.map(b => b._id || b)
        : [];
      const assemblyIds = req.userHierarchy.assembly_ids && req.userHierarchy.assembly_ids.length > 0
        ? req.userHierarchy.assembly_ids.map(a => a._id || a)
        : [];
      const parliamentIds = req.userHierarchy.parliament_ids && req.userHierarchy.parliament_ids.length > 0
        ? req.userHierarchy.parliament_ids.map(p => p._id || p)
        : [];
      const divisionIds = req.userHierarchy.division_ids && req.userHierarchy.division_ids.length > 0
        ? req.userHierarchy.division_ids.map(d => d._id || d)
        : [];
      const stateIds = req.userHierarchy.state_ids && req.userHierarchy.state_ids.length > 0
        ? req.userHierarchy.state_ids.map(s => s._id || s)
        : [];

      if (boothIds.length > 0) {
        filter.booth_id = { $in: boothIds };
      } else if (blockIds.length > 0) {
        filter.block_id = { $in: blockIds };
      } else if (assemblyIds.length > 0) {
        filter.assembly_id = { $in: assemblyIds };
      } else if (parliamentIds.length > 0) {
        filter.parliament_id = { $in: parliamentIds };
      } else if (divisionIds.length > 0) {
        filter.division_id = { $in: divisionIds };
      } else if (stateIds.length > 0) {
        filter.state_id = { $in: stateIds };
      }
    }

    let query = Samiti.find(filter)
      .populate('state_id', '_id name')
      .populate('division_id', '_id name')
      .populate('parliament_id', '_id name')
      .populate('assembly_id', '_id name')
      .populate('block_id', '_id name')
      .populate('booth_id', '_id name')
      .populate('panchayat_id', '_id panchayat_name')
      .populate('village_id', '_id village_name')
      .populate('falliya_id', '_id falliya_name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username')
      .sort({ created_at: -1 });

    // If caller requested all results (no pagination), return full set
    if (req.query.all && String(req.query.all) === 'true') {
      const allSamitis = await query.exec();
      return res.status(200).json({
        success: true,
        count: allSamitis.length,
        total: allSamitis.length,
        page: 1,
        pages: 1,
        data: allSamitis
      });
    }

    const samitis = await query.skip(skip).limit(limit).exec();
    const total = await Samiti.countDocuments(query.getFilter());

    res.status(200).json({
      success: true,
      count: samitis.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: samitis
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single samiti
// @route   GET /api/samitis/:id
// @access  Private (Requires authentication via serviceToken)
exports.getSamiti = async (req, res, next) => {
  try {
    const samiti = await Samiti.findById(req.params.id)
      .populate('state_id', '_id name')
      .populate('division_id', '_id name')
      .populate('parliament_id', '_id name')
      .populate('assembly_id', '_id name')
      .populate('block_id', '_id name')
      .populate('booth_id', '_id name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    if (!samiti) {
      return res.status(404).json({
        success: false,
        message: 'Samiti not found'
      });
    }

    // Check if user has access to this samiti based on hierarchy
    if (req.userHierarchy && req.user && req.user.role !== 'superAdmin') {
      // Get the most specific access level (booth > block > assembly > parliament > division > state)
      const boothIds = req.userHierarchy.booth_ids && req.userHierarchy.booth_ids.length > 0
        ? req.userHierarchy.booth_ids.map(b => String(b._id || b))
        : [];
      const blockIds = req.userHierarchy.block_ids && req.userHierarchy.block_ids.length > 0
        ? req.userHierarchy.block_ids.map(b => String(b._id || b))
        : [];
      const assemblyIds = req.userHierarchy.assembly_ids && req.userHierarchy.assembly_ids.length > 0
        ? req.userHierarchy.assembly_ids.map(a => String(a._id || a))
        : [];
      const parliamentIds = req.userHierarchy.parliament_ids && req.userHierarchy.parliament_ids.length > 0
        ? req.userHierarchy.parliament_ids.map(p => String(p._id || p))
        : [];
      const divisionIds = req.userHierarchy.division_ids && req.userHierarchy.division_ids.length > 0
        ? req.userHierarchy.division_ids.map(d => String(d._id || d))
        : [];
      const stateIds = req.userHierarchy.state_ids && req.userHierarchy.state_ids.length > 0
        ? req.userHierarchy.state_ids.map(s => String(s._id || s))
        : [];

      // Check if samiti is within user's scope
      let hasAccess = false;

      if (boothIds.length > 0) {
        hasAccess = samiti.booth_id && boothIds.includes(String(samiti.booth_id._id || samiti.booth_id));
      } else if (blockIds.length > 0) {
        hasAccess = samiti.block_id && blockIds.includes(String(samiti.block_id._id || samiti.block_id));
      } else if (assemblyIds.length > 0) {
        hasAccess = samiti.assembly_id && assemblyIds.includes(String(samiti.assembly_id._id || samiti.assembly_id));
      } else if (parliamentIds.length > 0) {
        hasAccess = samiti.parliament_id && parliamentIds.includes(String(samiti.parliament_id._id || samiti.parliament_id));
      } else if (divisionIds.length > 0) {
        hasAccess = samiti.division_id && divisionIds.includes(String(samiti.division_id._id || samiti.division_id));
      } else if (stateIds.length > 0) {
        hasAccess = samiti.state_id && stateIds.includes(String(samiti.state_id._id || samiti.state_id));
      }

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You do not have permission to view this samiti'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: samiti
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create samiti
// @route   POST /api/samitis
// @access  Private
exports.createSamiti = async (req, res, next) => {
  try {
    // Sanitize optional refs: treat empty string as undefined
    ['panchayat_id', 'village_id', 'falliya_id', 'year'].forEach((k) => {
      if (req.body && (req.body[k] === '' || req.body[k] === null)) delete req.body[k];
    });
    // Verify all referenced entities exist
    const [state, division, parliament, assembly, block, booth] = await Promise.all([
      State.findById(req.body.state_id),
      Division.findById(req.body.division_id),
      Parliament.findById(req.body.parliament_id),
      Assembly.findById(req.body.assembly_id),
      Block.findById(req.body.block_id),
      Booth.findById(req.body.booth_id)
    ]);

    if (!state) {
      return res.status(400).json({
        success: false,
        message: 'State not found'
      });
    }
    if (!division) {
      return res.status(400).json({
        success: false,
        message: 'Division not found'
      });
    }
    if (!parliament) {
      return res.status(400).json({
        success: false,
        message: 'Parliament not found'
      });
    }
    if (!assembly) {
      return res.status(400).json({
        success: false,
        message: 'Assembly not found'
      });
    }
    if (!block) {
      return res.status(400).json({
        success: false,
        message: 'Block not found'
      });
    }
    if (!booth) {
      return res.status(400).json({
        success: false,
        message: 'Booth not found'
      });
    }

    // Check if user exists in request
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }

    const samitiData = {
      samiti_name: req.body.samiti_name,
      count: req.body.count || 0,
      state_id: req.body.state_id,
      division_id: req.body.division_id,
      parliament_id: req.body.parliament_id,
      assembly_id: req.body.assembly_id,
      block_id: req.body.block_id,
      booth_id: req.body.booth_id,
      // Optional local references
      panchayat_id: req.body.panchayat_id,
      village_id: req.body.village_id,
      falliya_id: req.body.falliya_id,
      year: req.body.year,
      created_by: req.user.id,
      updated_by: req.user.id
    };

    const samiti = await Samiti.create(samitiData);

    // Populate the response
    await samiti.populate([
      { path: 'state_id', select: '_id name' },
      { path: 'division_id', select: '_id name' },
      { path: 'parliament_id', select: '_id name' },
      { path: 'assembly_id', select: '_id name' },
      { path: 'block_id', select: '_id name' },
      { path: 'booth_id', select: '_id name' },
      { path: 'created_by', select: 'username' },
      { path: 'updated_by', select: 'username' }
    ]);

    res.status(201).json({
      success: true,
      data: samiti
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Samiti with this name already exists'
      });
    }
    next(err);
  }
};

// @desc    Update samiti
// @route   PUT /api/samitis/:id
// @access  Private
exports.updateSamiti = async (req, res, next) => {
  try {
    let samiti = await Samiti.findById(req.params.id);

    if (!samiti) {
      return res.status(404).json({
        success: false,
        message: 'Samiti not found'
      });
    }

  // Verify referenced entities exist if being updated
    if (req.body.state_id && req.body.state_id !== samiti.state_id.toString()) {
      const state = await State.findById(req.body.state_id);
      if (!state) {
        return res.status(400).json({
          success: false,
          message: 'State not found'
        });
      }
    }

    if (req.body.division_id && req.body.division_id !== samiti.division_id.toString()) {
      const division = await Division.findById(req.body.division_id);
      if (!division) {
        return res.status(400).json({
          success: false,
          message: 'Division not found'
        });
      }
    }

    if (req.body.parliament_id && req.body.parliament_id !== samiti.parliament_id.toString()) {
      const parliament = await Parliament.findById(req.body.parliament_id);
      if (!parliament) {
        return res.status(400).json({
          success: false,
          message: 'Parliament not found'
        });
      }
    }

    if (req.body.assembly_id && req.body.assembly_id !== samiti.assembly_id.toString()) {
      const assembly = await Assembly.findById(req.body.assembly_id);
      if (!assembly) {
        return res.status(400).json({
          success: false,
          message: 'Assembly not found'
        });
      }
    }

    if (req.body.block_id && req.body.block_id !== samiti.block_id.toString()) {
      const block = await Block.findById(req.body.block_id);
      if (!block) {
        return res.status(400).json({
          success: false,
          message: 'Block not found'
        });
      }
    }

    if (req.body.booth_id && req.body.booth_id !== samiti.booth_id.toString()) {
      const booth = await Booth.findById(req.body.booth_id);
      if (!booth) {
        return res.status(400).json({
          success: false,
          message: 'Booth not found'
        });
      }
    }

    // Sanitize optional refs: treat empty string as undefined
    ['panchayat_id', 'village_id', 'falliya_id', 'year'].forEach((k) => {
      if (req.body && (req.body[k] === '' || req.body[k] === null)) delete req.body[k];
    });

    // Verify panchayat/village/falliya refs if provided
    if (req.body.panchayat_id && (!samiti.panchayat_id || req.body.panchayat_id !== samiti.panchayat_id.toString())) {
      const Panchayat = require('../models/Panchayat');
      const p = await Panchayat.findById(req.body.panchayat_id);
      if (!p) return res.status(400).json({ success: false, message: 'Panchayat not found' });
    }

    if (req.body.village_id && (!samiti.village_id || req.body.village_id !== samiti.village_id.toString())) {
      const Village = require('../models/Village');
      const v = await Village.findById(req.body.village_id);
      if (!v) return res.status(400).json({ success: false, message: 'Village not found' });
    }

    if (req.body.falliya_id && (!samiti.falliya_id || req.body.falliya_id !== samiti.falliya_id.toString())) {
      const Falliya = require('../models/Falliya');
      const f = await Falliya.findById(req.body.falliya_id);
      if (!f) return res.status(400).json({ success: false, message: 'Falliya not found' });
    }

    // Set updated_by from authenticated user
  req.body.updated_by = req.user.id;
    req.body.updated_at = new Date();

    samiti = await Samiti.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('state_id', '_id name')
      .populate('division_id', '_id name')
      .populate('parliament_id', '_id name')
      .populate('assembly_id', '_id name')
      .populate('block_id', '_id name')
      .populate('booth_id', '_id name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    res.status(200).json({
      success: true,
      data: samiti
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete samiti
// @route   DELETE /api/samitis/:id
// @access  Private
exports.deleteSamiti = async (req, res, next) => {
  try {
    const samiti = await Samiti.findById(req.params.id);

    if (!samiti) {
      return res.status(404).json({
        success: false,
        message: 'Samiti not found'
      });
    }

    await samiti.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Import Samitis from Excel
// @route   POST /api/samitis/import
// @access  Private (SuperAdmin)
exports.importSamitis = async (req, res, next) => {
  try {
    const { rows } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'No data provided' });
    }

    const { resolveGeographicHierarchy } = require('./importHelpers');
    const summary = { total: rows.length, created: 0, skipped: 0, errors: [] };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        if (!row.samiti_name) {
          summary.skipped += 1;
          summary.errors.push({ row: i + 1, message: 'Missing samiti name' });
          continue;
        }

        // Resolve geographic hierarchy (name-first)
        const geo = await resolveGeographicHierarchy(row);

        // Fallback to numeric identifier lookups when resolver couldn't find entities
        const parseNum = (v) => {
          if (v === undefined || v === null || v === '') return null;
          const n = Number(v);
          return Number.isNaN(n) ? null : n;
        };

        let state = geo.state || null;
        let division = geo.division || null;
        let parliament = geo.parliament || null;
        let assembly = geo.assembly || null;
        let block = geo.block || null;
        let booth = geo.booth || null;

        // Try numeric lookups for each level if not found
        if (!state) {
          const sNo = parseNum(row.state_no) || parseNum(row.state_number) || parseNum(row.state);
          if (sNo != null) state = await State.findOne({ state_no: sNo });
        }
        if (!division) {
          const dCode = row.division_code || row.divisioncode || row.division_code || row.division_code_number;
          if (dCode) division = await Division.findOne({ code: String(dCode) });
        }
        if (!parliament) {
          const pNo = parseNum(row.parliament_no) || parseNum(row.parliament_number) || parseNum(row.parliament);
          if (pNo != null) parliament = await Parliament.findOne({ parliament_no: pNo });
        }
        if (!assembly) {
          const ac = parseNum(row.AC_NO) || parseNum(row.ac_no) || parseNum(row.constituency_no) || parseNum(row.AC) ;
          if (ac != null) assembly = await Assembly.findOne({ AC_NO: ac });
        }
        if (!block) {
          const bNo = parseNum(row.block_number) || parseNum(row.block_no) || parseNum(row.block);
          if (bNo != null) block = await Block.findOne({ block_number: bNo });
        }
        if (!booth) {
          const bo = parseNum(row.booth_number) || parseNum(row.booth_no) || parseNum(row.booth);
          if (bo != null) booth = await Booth.findOne({ booth_number: bo });
        }

        // Check for duplicates
        const existing = await Samiti.findOne({ samiti_name: row.samiti_name });
        if (existing) {
          summary.skipped += 1;
          summary.errors.push({ row: i + 1, message: 'Samiti already exists' });
          continue;
        }

        const samitiData = {
          samiti_name: row.samiti_name,
          count: row.count !== undefined && row.count !== null && row.count !== '' ? Number(row.count) : (row.count_value ? Number(row.count_value) : 0),
          village_name: row.village_name || row.village || '',
          falia_name: row.falia_name || row.falia || row.falliya || '',
          // Prefer resolved objects from resolver but fall back to numeric-lookups above
          state_id: (state && state._id) || (geo.state ? geo.state._id : null),
          division_id: (division && division._id) || (geo.division ? geo.division._id : null),
          parliament_id: (parliament && parliament._id) || (geo.parliament ? geo.parliament._id : null),
          assembly_id: (assembly && assembly._id) || (geo.assembly ? geo.assembly._id : null),
          block_id: (block && block._id) || (geo.block ? geo.block._id : null),
          booth_id: (booth && booth._id) || (geo.booth ? geo.booth._id : null),
          // Local refs: accept either explicit ids or names
          panchayat_id: row.panchayat_id || null,
          village_id: row.village_id || null,
          falliya_id: row.falliya_id || null,
          year: row.year ? (Number.isNaN(Number(row.year)) ? row.year : Number(row.year)) : undefined,
          created_by: req.user.id,
          updated_by: req.user.id
        };

        // Resolve panchayat/village/falliya by name when IDs are not provided
        const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        try {
          if (!samitiData.panchayat_id) {
            const pname = row.panchayat_name || row.panchayat || null;
            if (pname) {
              const Panchayat = require('../models/Panchayat');
              const query = { panchayat_name: { $regex: `^${escapeRegex(pname)}$`, $options: 'i' } };
              // Narrow by block if available
              if (samitiData.block_id) query.block_id = samitiData.block_id;
              const p = await Panchayat.findOne(query).select('_id');
              if (p) samitiData.panchayat_id = p._id;
            }
          }

          if (!samitiData.village_id) {
            const vname = row.village_name || row.village || null;
            if (vname) {
              const Village = require('../models/Village');
              const qv = { village_name: { $regex: `^${escapeRegex(vname)}$`, $options: 'i' } };
              // Narrow by panchayat or block if available
              if (samitiData.panchayat_id) qv.panchayat_id = samitiData.panchayat_id;
              else if (samitiData.block_id) qv.block_id = samitiData.block_id;
              const v = await Village.findOne(qv).select('_id');
              if (v) samitiData.village_id = v._id;
            }
          }

          if (!samitiData.falliya_id) {
            const fname = row.falliya_name || row.falia || row.falliya || null;
            if (fname) {
              const Falliya = require('../models/Falliya');
              const qf = { falliya_name: { $regex: `^${escapeRegex(fname)}$`, $options: 'i' } };
              // Narrow by village/panchayat/block if available
              if (samitiData.village_id) qf.village_id = samitiData.village_id;
              else if (samitiData.panchayat_id) qf.panchayat_id = samitiData.panchayat_id;
              else if (samitiData.block_id) qf.block_id = samitiData.block_id;
              const f = await Falliya.findOne(qf).select('_id');
              if (f) samitiData.falliya_id = f._id;
            }
          }
        } catch (e) {
          // non-fatal: continue with whatever we have
        }

        await Samiti.create(samitiData);
        summary.created += 1;
      } catch (err) {
        summary.skipped += 1;
        summary.errors.push({ row: i + 1, message: err.message || String(err) });
      }
    }

    return res.status(200).json({ success: true, ...summary });
  } catch (err) {
    next(err);
  }
};