const BoothAdmin = require('../models/boothAdmin');
const Booth = require('../models/booth');

/**
 * @swagger
 * components:
 *   schemas:
 *     BoothAdmin:
 *       type: object
 *       required:
 *         - booth_id
 *       properties:
 *         booth_id:
 *           type: string
 *           description: Reference to Booth
 *         municipal_ward_no:
 *           type: string
 *           description: Municipal ward number
 *         nearest_landmark:
 *           type: string
 *           description: Nearest landmark
 *         blo_name:
 *           type: string
 *           description: BLO (Booth Level Officer) name
 *         blo_contact:
 *           type: string
 *           description: BLO contact number
 *         police_station:
 *           type: string
 *           description: Nearest police station
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *       example:
 *         booth_id: "507f1f77bcf86cd799439011"
 *         municipal_ward_no: "Ward 15"
 *         nearest_landmark: "Near City Mall"
 *         blo_name: "Sanjay Patel"
 *         blo_contact: "9876543210"
 *         police_station: "Hazratganj Police Station"
 *         created_at: "2023-05-15T10:00:00Z"
 *         updated_at: "2023-05-15T10:00:00Z"
 */

exports.createBoothAdmin = async (req, res) => {
  try {
    // Check if booth exists
    const booth = await Booth.findById(req.body.booth_id);
    if (!booth) {
      return res.status(404).json({ error: 'Booth not found' });
    }
    
    const boothAdmin = new BoothAdmin(req.body);
    await boothAdmin.save();
    res.status(201).json(boothAdmin);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getAllBoothAdmins = async (req, res) => {
  try {
    const boothAdmins = await BoothAdmin.find().populate('booth_id');
    res.json(boothAdmins);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getBoothAdminByBoothId = async (req, res) => {
  try {
    const boothAdmin = await BoothAdmin.findOne({ booth_id: req.params.boothId }).populate('booth_id');
    if (!boothAdmin) {
      return res.status(404).json({ error: 'Booth admin details not found' });
    }
    res.json(boothAdmin);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateBoothAdmin = async (req, res) => {
  try {
    const boothAdmin = await BoothAdmin.findOneAndUpdate(
      { booth_id: req.params.boothId },
      req.body,
      { new: true, runValidators: true }
    ).populate('booth_id');
    
    if (!boothAdmin) {
      return res.status(404).json({ error: 'Booth admin details not found' });
    }
    res.json(boothAdmin);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteBoothAdmin = async (req, res) => {
  try {
    const boothAdmin = await BoothAdmin.findOneAndDelete({ booth_id: req.params.boothId });
    if (!boothAdmin) {
      return res.status(404).json({ error: 'Booth admin details not found' });
    }
    res.json({ message: 'Booth admin details deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};