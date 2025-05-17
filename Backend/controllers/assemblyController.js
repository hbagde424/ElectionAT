const Assembly = require('../models/assembly');
const District = require('../models/district');
const Division = require('../models/division');
const Parliament = require('../models/parliament');

/**
 * @swagger
 * components:
 *   schemas:
 *     Assembly:
 *       type: object
 *       required:
 *         - name
 *         - type
 *         - district_id
 *         - division_id
 *         - parliament_id
 *       properties:
 *         name:
 *           type: string
 *           example: "Lucknow West"
 *         type:
 *           type: string
 *           enum: [Urban, Rural, Mixed]
 *           example: "Urban"
 *         district_id:
 *           type: string
 *           format: objectId
 *           example: "507f1f77bcf86cd799439011"
 *         division_id:
 *           type: string
 *           format: objectId
 *           example: "507f1f77bcf86cd799439012"
 *         parliament_id:
 *           type: string
 *           format: objectId
 *           example: "507f1f77bcf86cd799439013"
 *         created_at:
 *           type: string
 *           format: date-time
 *           example: "2023-05-15T10:00:00Z"
 *         updated_at:
 *           type: string
 *           format: date-time
 *           example: "2023-05-15T10:00:00Z"
 */

// [Keep all your existing controller methods...]

exports.createAssembly = async (req, res) => {
  try {
    // Check if all referenced entities exist
    const [district, division, parliament] = await Promise.all([
      District.findById(req.body.district_id),
      Division.findById(req.body.division_id),
      Parliament.findById(req.body.parliament_id)
    ]);

    if (!district) return res.status(404).json({ error: 'District not found' });
    if (!division) return res.status(404).json({ error: 'Division not found' });
    if (!parliament) return res.status(404).json({ error: 'Parliament not found' });

    const assembly = new Assembly(req.body);
    await assembly.save();
    res.status(201).json(assembly);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getAllAssemblies = async (req, res) => {
  try {
    const assemblies = await Assembly.find()
      .populate('district_id')
      .populate('division_id')
      .populate('parliament_id');
    res.json(assemblies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAssembliesByDistrict = async (req, res) => {
  try {
    const assemblies = await Assembly.find({ district_id: req.params.districtId })
      .populate('district_id')
      .populate('division_id')
      .populate('parliament_id');
    res.json(assemblies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAssembliesByParliament = async (req, res) => {
  try {
    const assemblies = await Assembly.find({ parliament_id: req.params.parliamentId })
      .populate('district_id')
      .populate('division_id')
      .populate('parliament_id');
    res.json(assemblies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAssemblyById = async (req, res) => {
  try {
    const assembly = await Assembly.findById(req.params.id)
      .populate('district_id')
      .populate('division_id')
      .populate('parliament_id');
    
    if (!assembly) {
      return res.status(404).json({ error: 'Assembly not found' });
    }
    res.json(assembly);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateAssembly = async (req, res) => {
  try {
    const assembly = await Assembly.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('district_id')
    .populate('division_id')
    .populate('parliament_id');
    
    if (!assembly) {
      return res.status(404).json({ error: 'Assembly not found' });
    }
    res.json(assembly);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteAssembly = async (req, res) => {
  try {
    const assembly = await Assembly.findByIdAndDelete(req.params.id);
    if (!assembly) {
      return res.status(404).json({ error: 'Assembly not found' });
    }
    res.json({ message: 'Assembly deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};