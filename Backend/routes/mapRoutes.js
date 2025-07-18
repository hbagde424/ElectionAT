// routes/mapRoutes.js
const express = require('express');
const { protect } = require('../middlewares/auth');
const AssemblyMap = require('../models/AssemblyMap');

const router = express.Router();

// @desc    Get assembly map data
// @route   GET /api/map/assembly/:id
// @access  Private (only for assembly users)
router.get('/assembly/:id', protect, async (req, res) => {
  try {
    // Check if user has access to this assembly
    if (req.user.role !== 'assembly' || req.user.regionId.toString() !== req.params.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this map data' });
    }

    const assemblyMap = await AssemblyMap.findOne({ assemblyId: req.params.id });
    
    if (!assemblyMap) {
      return res.status(404).json({ success: false, message: 'Map data not found' });
    }

    res.status(200).json({
      success: true,
      data: assemblyMap
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;