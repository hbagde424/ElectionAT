const BoothDemographics = require('../models/BoothDemographics');

/**
 * @swagger
 * components:
 *   schemas:
 *     BoothDemographics:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "6823469b436f44ab6db31552"
 *         booth_id:
 *           type: string
 *           example: "6823469b436f44ab6db31550"
 *         total_population:
 *           type: number
 *           example: 1200
 *         total_electors:
 *           type: number
 *           example: 850
 *         male_electors:
 *           type: number
 *           example: 450
 *         female_electors:
 *           type: number
 *           example: 400
 *         other_electors:
 *           type: number
 *           example: 0
 *         age_18_25:
 *           type: number
 *           example: 200
 *         age_26_40:
 *           type: number
 *           example: 300
 *         age_41_60:
 *           type: number
 *           example: 250
 *         age_60_above:
 *           type: number
 *           example: 100
 *         sc_percent:
 *           type: number
 *           example: 20.5
 *         st_percent:
 *           type: number
 *           example: 5
 *         obc_percent:
 *           type: number
 *           example: 35
 *         general_percent:
 *           type: number
 *           example: 39.5
 *         literacy_rate:
 *           type: number
 *           example: 75.3
 *         religious_composition:
 *           type: object
 *           example: {"Hindu": 70, "Muslim": 25, "Others": 5}
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *       example:
 *         _id: "6823469b436f44ab6db31552"
 *         booth_id: "6823469b436f44ab6db31550"
 *         total_population: 1200
 *         total_electors: 850
 *         male_electors: 450
 *         female_electors: 400
 *         other_electors: 0
 *         age_18_25: 200
 *         age_26_40: 300
 *         age_41_60: 250
 *         age_60_above: 100
 *         sc_percent: 20.5
 *         st_percent: 5
 *         obc_percent: 35
 *         general_percent: 39.5
 *         literacy_rate: 75.3
 *         religious_composition: {"Hindu": 70, "Muslim": 25, "Others": 5}
 *         created_at: "2025-05-13T18:48:19.446Z"
 *         updated_at: "2025-05-13T18:48:19.446Z"
 */

exports.getAllBoothDemographics = async (req, res) => {
  try {
    const demographics = await BoothDemographics.find().populate('booth_id');
    res.json(demographics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getBoothDemographicsById = async (req, res) => {
  try {
    const demographic = await BoothDemographics.findById(req.params.id).populate('booth_id');
    if (!demographic) {
      return res.status(404).json({ error: 'Booth demographics not found' });
    }
    res.json(demographic);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getBoothDemographicsByBoothId = async (req, res) => {
  try {
    const demographic = await BoothDemographics.findOne({ booth_id: req.params.boothId }).populate('booth_id');
    if (!demographic) {
      return res.status(404).json({ error: 'Booth demographics not found for this booth' });
    }
    res.json(demographic);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createBoothDemographics = async (req, res) => {
  try {
    const newDemographics = new BoothDemographics(req.body);
    const savedDemographics = await newDemographics.save();
    res.status(201).json(savedDemographics);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateBoothDemographics = async (req, res) => {
  try {
    const updatedDemographics = await BoothDemographics.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedDemographics) {
      return res.status(404).json({ error: 'Booth demographics not found' });
    }
    res.json(updatedDemographics); 
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteBoothDemographics = async (req, res) => {
  try {
    const deletedDemographics = await BoothDemographics.findByIdAndDelete(req.params.id);
    if (!deletedDemographics) {
      return res.status(404).json({ error: 'Booth demographics not found' });
    }
    res.json({ message: 'Booth demographics deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};