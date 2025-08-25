const Assembly = require('../models/Assemblypolygen');

// Helper to handle large JSON responses
const sendJsonResponse = (res, data) => {
  res.setHeader('Content-Type', 'application/json');
  return res.status(200).send(JSON.stringify(data, null, 2));
};

// Helper error handler
const handleError = (res, err) => {
  console.error('Error:', err);
  return res.status(500).json({
    message: 'Server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

// ✅ Get assemblies within a geographic area using $geoWithin
exports.getAssembliesWithin = async (req, res) => {
  try {
    const { longitude, latitude, radius } = req.query;

    if (!longitude || !latitude || !radius) {
      return res.status(400).json({ message: 'Missing required query parameters' });
    }

    const assemblies = await Assembly.find(
      {
        'features.geometry': {
          $geoWithin: {
            $centerSphere: [
              [parseFloat(longitude), parseFloat(latitude)],
              parseFloat(radius) / 6378.1 // Convert km to radians
            ]
          }
        }
      },
      { _id: 0, __v: 0 }
    ).lean();

    if (!assemblies || assemblies.length === 0) {
      return res.status(404).json({ message: 'No assemblies found within the specified area' });
    }

    return sendJsonResponse(res, assemblies);
  } catch (err) {
    return handleError(res, err);
  }
};

// Get all assemblies
exports.getAllAssemblies = async (req, res) => {
  try {
    const assemblies = await Assembly.find({}, { _id: 0, __v: 0 }).lean();
    return sendJsonResponse(res, assemblies);
  } catch (err) {
    return handleError(res, err);
  }
};

// Get assembly by VS_Code
exports.getAssemblyByVSCode = async (req, res) => {
  try {
    const vsCode = parseInt(req.params.vs_code);
    if (isNaN(vsCode)) {
      return res.status(400).json({ message: 'Invalid VS Code' });
    }

    const assembly = await Assembly.findOne(
      { 'features.properties.PC_NAME': vsCode },
      { _id: 0, __v: 0 }
    ).lean();

    if (!assembly) {
      return res.status(404).json({ message: 'Assembly not found' });
    }

    return sendJsonResponse(res, assembly);
  } catch (err) {
    return handleError(res, err);
  }
};

// Get assemblies by district
exports.getAssembliesByDistrict = async (req, res) => {
  try {
    const assemblies = await Assembly.find(
      { 'features.properties.District': req.params.district },
      { _id: 0, __v: 0 }
    ).lean();

    if (!assemblies || assemblies.length === 0) {
      return res.status(404).json({ message: 'No assemblies found for this district' });
    }

    return sendJsonResponse(res, assemblies);
  } catch (err) {
    return handleError(res, err);
  }
};
// Get assemblies by Parliament name
exports.getAssembliesByParliament = async (req, res) => {
  try {
    const { pc_name } = req.params;
    const pcNo = Number(pc_name); // Convert string to number

    const assemblies = await Assembly.aggregate([
      {
        $project: {
          type: 1,
          createdAt: 1,
          updatedAt: 1,
          features: {
            $filter: {
              input: "$features",
              as: "feature",
              cond: {
                $eq: ["$$feature.properties.PC_NO", pcNo]
              }
            }
          }
        }
      },
      {
        $match: {
          "features.0": { $exists: true }
        }
      }
    ]);

    if (!assemblies || assemblies.length === 0) {
      return res.status(404).json({
        message: 'No assemblies found for this parliamentary constituency'
      });
    }

    res.status(200).json({
      success: true,
      count: assemblies.length,
      data: assemblies
    });
  } catch (err) {
    console.error('Error in getAssembliesByParliament:', err);
    res.status(500).json({ message: 'Server error' });
  }
};




