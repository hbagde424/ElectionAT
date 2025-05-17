const Block = require('../models/block');
const Assembly = require('../models/assembly');

/**
 * @swagger
 * components:
 *   schemas:
 *     Block:
 *       type: object
 *       required:
 *         - name
 *         - assembly_id
 *       properties:
 *         name:
 *           type: string
 *           example: "Block A"
 *         assembly_id:
 *           type: string
 *           format: objectId
 *           example: "507f1f77bcf86cd799439011"
 *         created_at:
 *           type: string
 *           format: date-time
 *           example: "2023-05-15T10:00:00Z"
 *         updated_at:
 *           type: string
 *           format: date-time
 *           example: "2023-05-15T10:00:00Z"
 */

exports.createBlock = async (req, res) => {
  try {
    // Check if assembly exists
    const assembly = await Assembly.findById(req.body.assembly_id);
    if (!assembly) {
      return res.status(404).json({ error: 'Assembly not found' });
    }
    
    const block = new Block(req.body);
    await block.save();
    res.status(201).json(block);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getAllBlocks = async (req, res) => {
  try {
    const blocks = await Block.find().populate('assembly_id');
    res.json(blocks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getBlocksByAssembly = async (req, res) => {
  try {
    const blocks = await Block.find({ assembly_id: req.params.assemblyId }).populate('assembly_id');
    res.json(blocks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getBlockById = async (req, res) => {
  try {
    const block = await Block.findById(req.params.id).populate('assembly_id');
    if (!block) {
      return res.status(404).json({ error: 'Block not found' });
    }
    res.json(block);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateBlock = async (req, res) => {
  try {
    const block = await Block.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('assembly_id');
    if (!block) {
      return res.status(404).json({ error: 'Block not found' });
    }
    res.json(block);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteBlock = async (req, res) => {
  try {
    const block = await Block.findByIdAndDelete(req.params.id);
    if (!block) {
      return res.status(404).json({ error: 'Block not found' });
    }
    res.json({ message: 'Block deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};