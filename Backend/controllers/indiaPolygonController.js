const IndiaPolygon = require('../models/IndiaPolygon');

// @desc    Get India polygon
// @route   GET /api/india-polygon
// @access  Public
exports.getIndiaPolygon = async (req, res, next) => {
  try {
    const polygon = await IndiaPolygon.findOne();
    if (!polygon) {
      return res.status(404).json({ success: false, message: 'Polygon not found' });
    }

    res.status(200).json({ success: true, data: polygon });
  } catch (err) {
    next(err);
  }
};

// @desc    Create India polygon
// @route   POST /api/india-polygon
// @access  Private (superAdmin)
exports.createIndiaPolygon = async (req, res, next) => {
  try {
    const polygon = await IndiaPolygon.create(req.body);
    res.status(201).json({ success: true, data: polygon });
  } catch (err) {
    next(err);
  }
};

// @desc    Update India polygon
// @route   PUT /api/india-polygon/:id
// @access  Private (superAdmin)
exports.updateIndiaPolygon = async (req, res, next) => {
  try {
    const polygon = await IndiaPolygon.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!polygon) {
      return res.status(404).json({ success: false, message: 'Polygon not found' });
    }

    res.status(200).json({ success: true, data: polygon });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete India polygon
// @route   DELETE /api/india-polygon/:id
// @access  Private (superAdmin)
exports.deleteIndiaPolygon = async (req, res, next) => {
  try {
    const polygon = await IndiaPolygon.findById(req.params.id);
    if (!polygon) {
      return res.status(404).json({ success: false, message: 'Polygon not found' });
    }

    await polygon.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};
