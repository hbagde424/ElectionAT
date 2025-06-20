const RegionCommittee = require('../models/RegionCommittee');
const Division = require('../models/Division');
const Parliament = require('../models/parliament');
const Assembly = require('../models/assembly');
const Block = require('../models/block');

// Helper to get the appropriate model based on region type
const getRegionModel = (regionType) => {
  switch (regionType) {
    case 'Division': return Division;
    case 'Parliament': return Parliament;
    case 'Assembly': return Assembly;
    case 'Block': return Block;
    default: return null;
  }
};

// @desc    Get all region committees
// @route   GET /api/region-committees
// @access  Public
exports.getRegionCommittees = async (req, res, next) => {
  try {
    const { region_type, region_id } = req.query;
    let query = {};

    if (region_type) {
      query.region_type = region_type;
    }

    if (region_id) {
      query.region_ids = region_id;
    }

    const committees = await RegionCommittee.find(query)
      .populate('region_ids', 'name')
      .sort({ updated_at: -1 });

    res.status(200).json({
      success: true,
      count: committees.length,
      data: committees
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single region committee
// @route   GET /api/region-committees/:id
// @access  Public
exports.getRegionCommittee = async (req, res, next) => {
  try {
    const committee = await RegionCommittee.findById(req.params.id)
      .populate('region_ids', 'name');

    if (!committee) {
      return res.status(404).json({
        success: false,
        message: 'Region committee not found'
      });
    }

    res.status(200).json({
      success: true,
      data: committee
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create region committee
// @route   POST /api/region-committees
// @access  Private (Admin only)
exports.createRegionCommittee = async (req, res, next) => {
  try {
    const { region_type, region_ids, committee_name } = req.body;

    // Validate region IDs exist
    const RegionModel = getRegionModel(region_type);
    if (!RegionModel) {
      return res.status(400).json({
        success: false,
        message: 'Invalid region type'
      });
    }

    const regions = await RegionModel.find({ _id: { $in: region_ids } });
    if (regions.length !== region_ids.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more region IDs are invalid'
      });
    }

    const committee = await RegionCommittee.create({
      region_type,
      region_ids,
      committee_name
    });

    res.status(201).json({
      success: true,
      data: committee
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update region committee
// @route   PUT /api/region-committees/:id
// @access  Private (Admin only)
exports.updateRegionCommittee = async (req, res, next) => {
  try {
    let committee = await RegionCommittee.findById(req.params.id);

    if (!committee) {
      return res.status(404).json({
        success: false,
        message: 'Region committee not found'
      });
    }

    const { region_type, region_ids, committee_name } = req.body;

    // If updating region type or IDs, validate them
    if (region_type || region_ids) {
      const currentRegionType = region_type || committee.region_type;
      const currentRegionIds = region_ids || committee.region_ids;

      const RegionModel = getRegionModel(currentRegionType);
      if (!RegionModel) {
        return res.status(400).json({
          success: false,
          message: 'Invalid region type'
        });
      }

      const regions = await RegionModel.find({ _id: { $in: currentRegionIds } });
      if (regions.length !== currentRegionIds.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more region IDs are invalid'
        });
      }
    }

    committee = await RegionCommittee.findByIdAndUpdate(
      req.params.id,
      {
        region_type,
        region_ids,
        committee_name,
        updated_at: Date.now()
      },
      {
        new: true,
        runValidators: true
      }
    ).populate('region_ids', 'name');

    res.status(200).json({
      success: true,
      data: committee
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete region committee
// @route   DELETE /api/region-committees/:id
// @access  Private (Admin only)
exports.deleteRegionCommittee = async (req, res, next) => {
  try {
    const committee = await RegionCommittee.findById(req.params.id);

    if (!committee) {
      return res.status(404).json({
        success: false,
        message: 'Region committee not found'
      });
    }

    await committee.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};