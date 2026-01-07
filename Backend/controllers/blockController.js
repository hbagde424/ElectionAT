const mongoose = require('mongoose');
const Block = require('../models/block');
const Assembly = require('../models/Assembly');
const Parliament = require('../models/Parliament');
// const District = require('../models/District');
const Division = require('../models/Division');
const State = require('../models/state');

// Helper to validate ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// @desc    Get all blocks
// @route   GET /api/blocks
// @access  Public
exports.getBlocks = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit);
    const skip = (page - 1) * limit;

    // Basic query
    let query = Block.find()
      .populate('assembly_id', 'name')
      .populate('parliament_id', 'name')
      // .populate('district_id', 'name')
      .populate('division_id', 'name')
      .populate('state_id', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username')
      .populate('updated_by', 'username')
      .select('-polygon')
      .sort({ name: 1 });

    // Enhanced search functionality: search across all string fields in the model
    if (req.query.search) {
      const searchRegex = { $regex: req.query.search, $options: 'i' };
      query = query.find({
        $or: [
          { name: searchRegex },
          { description: searchRegex },
          { category: searchRegex }
        ]
      });
    }

    // Filter by category
    if (req.query.category) {
      query = query.where('category').equals(req.query.category);
    }

    // Filter by assembly
    if (req.query.assembly) {
      query = query.where('assembly_id').equals(req.query.assembly);
    }

    // Filter by parliament
    if (req.query.parliament) {
      query = query.where('parliament_id').equals(req.query.parliament);
    }

    // Filter by district
    // if (req.query.district) {
    //   query = query.where('district_id').equals(req.query.district);
    // }

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

    // Filter by state
    if (req.query.state) {
      query = query.where('state_id').equals(req.query.state);
    }

    // If userHierarchy exists, restrict by user's scope (most specific first) unless superAdmin
    if (req.userHierarchy && req.user && req.user.role !== 'superAdmin') {
      const uh = req.userHierarchy;
      if (uh.booth) query = query.where('booth_id').equals(uh.booth._id);
      else if (uh.block) query = query.where('_id').equals(uh.block._id);
      else if (uh.assembly) query = query.where('assembly_id').equals(uh.assembly._id);
      else if (uh.parliament) query = query.where('parliament_id').equals(uh.parliament._id);
      else if (uh.division) query = query.where('division_id').equals(uh.division._id);
      else if (uh.state) query = query.where('state_id').equals(uh.state._id);
    }

    // Filter by active status
    if (req.query.is_active !== undefined) {
      query = query.where('is_active').equals(req.query.is_active === 'true');
    }

    const blocks = await query.skip(skip).limit(limit).exec();
    const total = await Block.countDocuments(query.getFilter());

    // Add division_name as a top-level property for each block
    const blocksWithDivisionName = await Promise.all(blocks.map(async (block) => {
      const blockObj = block.toObject();
      if (blockObj.division_id && typeof blockObj.division_id === 'object') {
        blockObj.division_name = blockObj.division_id.name;
      } else if (blockObj.division_id) {
        // If not populated, fetch division
        const division = await Division.findById(blockObj.division_id);
        blockObj.division_name = division ? division.name : null;
      } else {
        blockObj.division_name = null;
      }
      return blockObj;
    }));
    res.status(200).json({
      success: true,
      count: blocksWithDivisionName.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: blocksWithDivisionName
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single block
// @route   GET /api/blocks/:id
// @access  Public
exports.getBlock = async (req, res, next) => {
  try {
    const block = await Block.findById(req.params.id)
      .populate('assembly_id', 'name')
      .populate('parliament_id', 'name')
      // .populate('district_id', 'name')
      .populate('division_id', 'name')
      .populate('state_id', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    if (!block) {
      return res.status(404).json({
        success: false,
        message: 'Block not found'
      });
    }

    // Enforce user hierarchy for single block resource
    if (req.userHierarchy && req.user && req.user.role !== 'superAdmin') {
      const uh = req.userHierarchy;
      const outside = (
        (uh.block && block._id.toString() !== uh.block._id.toString()) ||
        (uh.assembly && block.assembly_id?.toString() !== uh.assembly._id.toString()) ||
        (uh.parliament && block.parliament_id?.toString() !== uh.parliament._id.toString()) ||
        (uh.division && block.division_id?.toString() !== uh.division._id.toString()) ||
        (uh.state && block.state_id?.toString() !== uh.state._id.toString())
      );
      if (outside) {
        return res.status(403).json({ success: false, message: 'Access denied: geographic restriction' });
      }
    }

    res.status(200).json({
      success: true,
      data: block
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create block
// @route   POST /api/blocks
// @access  Private (Admin only)
exports.createBlock = async (req, res, next) => {
  try {
    // Verify all references exist
    const [
      assembly,
      parliament,
      // district,
      division,
      state
    ] = await Promise.all([
      Assembly.findById(req.body.assembly_id),
      Parliament.findById(req.body.parliament_id),
      // District.findById(req.body.district_id),
      Division.findById(req.body.division_id),
      State.findById(req.body.state_id)
    ]);

    if (!assembly) {
      return res.status(400).json({ success: false, message: 'Assembly not found' });
    }
    if (!parliament) {
      return res.status(400).json({ success: false, message: 'Parliament not found' });
    }
    // if (!district) {
    //   return res.status(400).json({ success: false, message: 'District not found' });
    // }
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

    const blockData = {
      ...req.body,
      created_by: req.user.id,
      description: req.body.description || '',
    };

    if (req.body.polygon) {
      blockData.polygon = req.body.polygon;
    }

    const block = await Block.create(blockData);

    res.status(201).json({
      success: true,
      data: block
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Block with this name already exists'
      });
    }
    next(err);
  }
};

// @desc    Update block
// @route   PUT /api/blocks/:id
// @access  Private (Admin only)
exports.updateBlock = async (req, res, next) => {
  try {
    let block = await Block.findById(req.params.id);

    if (!block) {
      return res.status(404).json({
        success: false,
        message: 'Block not found'
      });
    }

    // Verify all references exist if being updated
    const verificationPromises = [];
    if (req.body.assembly_id) verificationPromises.push(Assembly.findById(req.body.assembly_id));
    if (req.body.parliament_id) verificationPromises.push(Parliament.findById(req.body.parliament_id));
    // if (req.body.district_id) verificationPromises.push(District.findById(req.body.district_id));
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
      description: req.body.description || '',
    };

    if (req.body.polygon) {
      updateData.polygon = req.body.polygon;
    }
    req.body.updated_at = new Date();

    block = await Block.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    })
      .populate('assembly_id', 'name')
      .populate('parliament_id', 'name')
      // .populate('district_id', 'name')
      .populate('division_id', 'name')
      .populate('state_id', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    res.status(200).json({
      success: true,
      data: block
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Block with this name already exists'
      });
    }
    next(err);
  }
};

// @desc    Delete block
// @route   DELETE /api/blocks/:id
// @access  Private (Admin only)
exports.deleteBlock = async (req, res, next) => {
  try {
    const block = await Block.findById(req.params.id);

    if (!block) {
      return res.status(404).json({
        success: false,
        message: 'Block not found'
      });
    }

    await block.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get blocks by assembly
// @route   GET /api/blocks/assembly/:assemblyId
// @access  Public
exports.getBlocksByAssembly = async (req, res, next) => {
  try {
    // Verify assembly exists
    const assembly = await Assembly.findById(req.params.assemblyId);
    if (!assembly) {
      return res.status(404).json({
        success: false,
        message: 'Assembly not found'
      });
    }

    const blocks = await Block.find({ assembly_id: req.params.assemblyId })
      .sort({ name: 1 })
      .populate('parliament_id', 'name')
      .populate('created_by', 'username');

    res.status(200).json({
      success: true,
      count: blocks.length,
      data: blocks
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get blocks by parliament
// @route   GET /api/blocks/parliament/:parliamentId
// @access  Public
exports.getBlocksByParliament = async (req, res, next) => {
  try {
    // Verify parliament exists
    const parliament = await Parliament.findById(req.params.parliamentId);
    if (!parliament) {
      return res.status(404).json({
        success: false,
        message: 'Parliament not found'
      });
    }

    const blocks = await Block.find({ parliament_id: req.params.parliamentId })
      .sort({ name: 1 })
      .populate('assembly_id', 'name')
      .populate('created_by', 'username');

    res.status(200).json({
      success: true,
      count: blocks.length,
      data: blocks
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle block active status
// @route   PATCH /api/blocks/:id/toggle-active
// @access  Private (Admin only)
exports.toggleBlockActive = async (req, res, next) => {
  try {
    let block = await Block.findById(req.params.id);

    if (!block) {
      return res.status(404).json({
        success: false,
        message: 'Block not found'
      });
    }

    block.is_active = !block.is_active;
    block.updated_by = req.user.id;
    block.updated_at = Date.now();

    await block.save();

    res.status(200).json({
      success: true,
      data: block
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Import blocks from Excel
// @route   POST /api/blocks/import
// @access  Private/SuperAdmin
exports.importBlocks = async (req, res, next) => {
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
          summary.errors.push({ row: i + 1, message: 'Missing block name' });
          continue;
        }

        const geo = await resolveGeographicHierarchy(row);
        const missingFields = validateHierarchy(geo, ['state', 'division', 'parliament', 'assembly']);
        if (missingFields.length > 0) {
          summary.skipped += 1;
          summary.errors.push({ row: i + 1, message: `Missing: ${missingFields.join(', ')}` });
          continue;
        }

        // Check for duplicates
        const existing = await Block.findOne({ name: row.name });
        if (existing) {
          summary.skipped += 1;
          summary.errors.push({ row: i + 1, message: `Block ${row.name} already exists` });
          continue;
        }

        // Determine block number from common field variants
        const rawBlockNo = row.block_no ?? row.blockNo ?? row.blocknumber ?? row.blockNumber ?? row.block;
        const parsedBlockNo = rawBlockNo !== undefined && rawBlockNo !== null && String(rawBlockNo).trim() !== '' ? Number(String(rawBlockNo).trim()) : undefined;

        const blockData = {
          name: row.name,
          category: row.category || 'Urban',
          assembly_id: geo.assembly._id,
          parliament_id: geo.parliament._id,
          division_id: geo.division._id,
          state_id: geo.state._id,
          created_by: req.user.id,
          updated_by: req.user.id,
          ...(parsedBlockNo ? { block_no: parsedBlockNo } : {})
        };

        const block = await Block.create(blockData);
        created.push(block._id);
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


// @desc    Upload block polygon (GeoJSON)
// @route   POST /api/blocks/upload-polygon
// @access  Private (Admin only)
exports.uploadBlockPolygon = async (req, res, next) => {
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
      // Try to find block by different property names
      const blockNo = props.BLOCK_NO || props.block_no || props['Block No'] || props.Block_No;
      const blockName = props.BLOCK_NAME || props.block_name || props['Block Name'] || props.Name || props.NAME || props.name;

      if (!blockNo && !blockName) {
        errors.push('Feature passed without a valid match property (Block_No, Block_Name, or Name)');
        continue;
      }

      let block = null;

      // Try finding by Block No first if available
      if (blockNo) {
        block = await Block.findOne({ block_no: Number(blockNo) });
      }

      // If not found by No, try by Name
      if (!block && blockName) {
        block = await Block.findOne({
          name: { $regex: new RegExp(`^${blockName}$`, 'i') }
        });
      }

      if (block) {
        // Update block with polygon feature
        block.polygon = feature;
        await block.save();
        updatedCount++;
      } else {
        errors.push(`Block not found for: Block_No=${blockNo}, Name=${blockName}`);
      }
    }

    if (updatedCount === 0 && errors.length > 0) {
      return res.status(404).json({
        success: false,
        message: 'No blocks matched',
        errors
      });
    }

    res.status(200).json({
      success: true,
      message: `Successfully updated polygons for ${updatedCount} blocks`,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (err) {
    next(err);
  }
};