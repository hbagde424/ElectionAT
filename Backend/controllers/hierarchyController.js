const mongoose = require('mongoose');
const Division = require('../models/division');
const Parliament = require('../models/parliament');
const Assembly = require('../models/assembly');
const Block = require('../models/block');
const Booth = require('../models/booth');

// Helper function for the common aggregation pipeline
function getFullHierarchyPipeline() {
  return [
    {
      $lookup: {
        from: "parliaments",
        localField: "_id",
        foreignField: "division_id",
        as: "parliaments"
      }
    },
    { $unwind: { path: "$parliaments", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "assemblies",
        localField: "parliaments._id",
        foreignField: "parliament_id",
        as: "parliaments.assemblies"
      }
    },
    { $unwind: { path: "$parliaments.assemblies", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "blocks",
        localField: "parliaments.assemblies._id",
        foreignField: "assembly_id",
        as: "parliaments.assemblies.blocks"
      }
    },
    { $unwind: { path: "$parliaments.assemblies.blocks", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "booths",
        localField: "parliaments.assemblies.blocks._id",
        foreignField: "block_id",
        as: "parliaments.assemblies.blocks.booths",
      }
    },
    { $unwind: { path: "$parliaments.assemblies.blocks.booths", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        division: {
          id: "$_id",
          name: "$name"
        },
        parliament: {
          id: "$parliaments._id",
          name: "$parliaments.name"
        },
        assembly: {
          id: "$parliaments.assemblies._id",
          name: "$parliaments.assemblies.name",
          type: "$parliaments.assemblies.type"
        },
        block: {
          id: "$parliaments.assemblies.blocks._id",
          name: "$parliaments.assemblies.blocks.name"
        },
        booth: {
          id: "$parliaments.assemblies.blocks.booths._id",
          number: "$parliaments.assemblies.blocks.booths.booth_number",
          name: "$parliaments.assemblies.blocks.booths.name"
        }
      }
    }
  ];
}

// @desc    Get full geographical hierarchy
// @route   GET /api/hierarchy
// @access  Public
const getFullHierarchy = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const skip = (page - 1) * limit;

    // Base aggregation pipeline
    let pipeline = [...getFullHierarchyPipeline(), { $skip: skip }, { $limit: limit }];

    // Add filters if provided
    const matchStage = {};
    if (req.query.division) matchStage["_id"] = new mongoose.Types.ObjectId(req.query.division);
    if (req.query.parliament) matchStage["parliaments._id"] = new mongoose.Types.ObjectId(req.query.parliament);
    if (req.query.assembly) matchStage["parliaments.assemblies._id"] = new mongoose.Types.ObjectId(req.query.assembly);
    if (req.query.block) matchStage["parliaments.assemblies.blocks._id"] = new mongoose.Types.ObjectId(req.query.block);

    if (Object.keys(matchStage).length > 0) {
      pipeline.unshift({ $match: matchStage });
    }

    const data = await Division.aggregate(pipeline);
    const total = await Division.countDocuments(matchStage);

    res.status(200).json({
      success: true,
      count: data.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get hierarchy starting from division
// @route   GET /api/hierarchy/division/:divisionId
// @access  Public
const getHierarchyByDivision = async (req, res, next) => {
  try {
    const division = await Division.findById(req.params.divisionId);
    if (!division) {
      return res.status(404).json({
        success: false,
        message: 'Division not found'
      });
    }

    const pipeline = [
      { $match: { _id: division._id } },
      ...getFullHierarchyPipeline()
    ];

    const result = await Division.aggregate(pipeline);
    
    res.status(200).json({
      success: true,
      data: result[0] || null
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get hierarchy starting from parliament
// @route   GET /api/hierarchy/parliament/:parliamentId
// @access  Public
const getHierarchyByParliament = async (req, res, next) => {
  try {
    const parliament = await Parliament.findById(req.params.parliamentId)
      .populate('division_id', 'name');
    
    if (!parliament) {
      return res.status(404).json({
        success: false,
        message: 'Parliament not found'
      });
    }

    const pipeline = [
      { $match: { _id: parliament.division_id._id } },
      {
        $lookup: {
          from: "parliaments",
          localField: "_id",
          foreignField: "division_id",
          as: "parliaments",
          pipeline: [
            { $match: { _id: parliament._id } }
          ]
        }
      },
      ...getFullHierarchyPipeline().slice(2) // Skip the first two stages
    ];

    const result = await Division.aggregate(pipeline);
    
    res.status(200).json({
      success: true,
      data: result[0] || null
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getFullHierarchy,
  getHierarchyByDivision,
  getHierarchyByParliament
};