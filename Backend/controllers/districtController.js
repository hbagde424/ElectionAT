const District = require('../models/district');
const Parliament = require('../models/parliament');
const Division = require('../models/division');

/**
 * @swagger
 * components:
 *   schemas:
 *     District:
 *       type: object
 *       required:
 *         - name
 *         - division_id
 *       properties:
 *         name:
 *           type: string
 *           description: District name
 *         parliament_id:
 *           type: string
 *           description: ID of the parliament constituency (optional)
 *         division_id:
 *           type: string
 *           description: ID of the division this district belongs to
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *       example:
 *         name: "Lucknow District"
 *         parliament_id: "60d5ec9f8e78f432a0f1c9a1"
 *         division_id: "60d5ec9f8e78f432a0f1c9a2"
 */

exports.createDistrict = async (req, res) => {
  try {
    // Check if parliament exists (if provided)
    if (req.body.parliament_id) {
      const parliament = await Parliament.findById(req.body.parliament_id);
      if (!parliament) {
        return res.status(404).json({ error: 'Parliament not found' });
      }
    }
    
    // Check if division exists
    const division = await Division.findById(req.body.division_id);
    if (!division) {
      return res.status(404).json({ error: 'Division not found' });
    }
    
    const district = new District(req.body);
    await district.save();
    res.status(201).json(district);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getAllDistricts = async (req, res) => {
  try {
    const districts = await District.find()
      .populate('parliament_id')
      .populate('division_id');
    res.json(districts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getDistrictsByDivision = async (req, res) => {
  try {
    const districts = await District.find({ division_id: req.params.divisionId })
      .populate('parliament_id')
      .populate('division_id');
    res.json(districts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getDistrictById = async (req, res) => {
  try {
    const district = await District.findById(req.params.id)
      .populate('parliament_id')
      .populate('division_id');
    
    if (!district) {
      return res.status(404).json({ error: 'District not found' });
    }
    res.json(district);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateDistrict = async (req, res) => {
  try {
    const district = await District.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('parliament_id')
    .populate('division_id');
    
    if (!district) {
      return res.status(404).json({ error: 'District not found' });
    }
    res.json(district);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteDistrict = async (req, res) => {
  try {
    const district = await District.findByIdAndDelete(req.params.id);
    if (!district) {
      return res.status(404).json({ error: 'District not found' });
    }
    res.json({ message: 'District deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};