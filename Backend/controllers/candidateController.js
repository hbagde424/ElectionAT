const Candidate = require('../models/Candidate');
const upload = require('../config/candidateUpload');
const fs = require('fs');
const path = require('path');

// @desc    Get all candidates
// @route   GET /api/candidates
// @access  Public
exports.getCandidates = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit);
    const skip = (page - 1) * limit;

    // Basic query
    let query = Candidate.find({ is_active: true })
      .populate('created_by', 'username')
      .populate('updated_by', 'username')
      .sort({ name: 1 });

    // Enhanced search functionality
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      // Build $or array for all string fields
      const orArray = [
        { name: { $regex: searchRegex } },
        { caste: { $regex: searchRegex } },
        { education: { $regex: searchRegex } },
        { assets: { $regex: searchRegex } },
        { liabilities: { $regex: searchRegex } },
        { description: { $regex: searchRegex } }
      ];

      // Find party ids matching search
      // const Party = require('../models/Party');
      const User = require('../models/User');
      const partyDocs = await Party.find({ name: { $regex: searchRegex } }, '_id');
      if (partyDocs.length > 0) {
        orArray.push({ party_id: { $in: partyDocs.map(p => p._id) } });
      }
      // Find user ids matching search (for created_by and updated_by)
      const userDocs = await User.find({ username: { $regex: searchRegex } }, '_id');
      if (userDocs.length > 0) {
        orArray.push({ created_by: { $in: userDocs.map(u => u._id) } });
        orArray.push({ updated_by: { $in: userDocs.map(u => u._id) } });
      }

      query = query.find({ $or: orArray });
    }

    // Filter by caste
    if (req.query.caste) {
      query = query.where('caste').equals(req.query.caste);
    }

    // Filter by criminal cases
    if (req.query.criminal_cases) {
      query = query.where('criminal_cases').equals(parseInt(req.query.criminal_cases));
    }

    const candidates = await query.skip(skip).limit(limit).exec();
    const total = await Candidate.countDocuments(query.getFilter());

    res.status(200).json({
      success: true,
      count: candidates.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: candidates
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single candidate
// @route   GET /api/candidates/:id
// @access  Public
exports.getCandidate = async (req, res, next) => {
  try {
    const candidate = await Candidate.findById(req.params.id)
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    res.status(200).json({
      success: true,
      data: candidate
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new candidate
// @route   POST /api/candidates
// @access  Private (Admin only)
exports.createCandidate = async (req, res, next) => {
  try {
    // Check if user exists in request
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }


    let candidate;
    try {
      const candidateData = {
        ...req.body,
        description: req.body.description || '',
        created_by: req.user.id
      };

      const config = require('../config/config');
      // Handle file upload
      if (req.file) {
    candidateData.photo = `/uploads/candidate/${req.file.filename}`;
      }

      candidate = await Candidate.create(candidateData);
    } catch (error) {
      console.error('Validation error:', error.message);
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    return res.status(201).json({
      success: true,
      data: candidate
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update candidate
// @route   PUT /api/candidates/:id
// @access  Private (Admin only)
exports.updateCandidate = async (req, res, next) => {
  try {
    const candidate = await Candidate.findById(req.params.id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }


    // Prepare update data
    const updateData = {
      ...req.body,
      description: req.body.description || '',
      updated_by: req.user.id
    };

    // If a new photo is uploaded
    if (req.file) {
      updateData.photo = `/uploads/candidate/${req.file.filename}`;

      // Delete old photo file if it exists
      if (candidate.photo) {
        try {
          // Extract the filename from the full URL
          const oldFileName = candidate.photo.split('/').pop();
          const oldPath = path.join(__dirname, '../uploads/candidate', oldFileName);

          // Check if file exists before attempting to delete
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        } catch (error) {
          console.error('Error deleting old image:', error);
          // Continue with update even if delete fails
        }
      }
    }

    // Update candidate
    const updatedCandidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedCandidate
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};


// @desc    Delete candidate (soft delete)
// @route   DELETE /api/candidates/:id
// @access  Private (Admin only)
exports.deleteCandidate = async (req, res, next) => {
  try {
    const candidate = await Candidate.findById(req.params.id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    // Delete the photo file if it exists
    if (candidate.photo) {
      try {
        // Extract the filename from the full URL
        const fileName = candidate.photo.split('/').pop();
        const imagePath = path.join(__dirname, '../uploads/candidate', fileName);

        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      } catch (error) {
        console.error('Error deleting image file:', error);
        // Continue with deletion even if file removal fails
      }
    }

    // Soft delete by setting is_active to false
    candidate.is_active = false;
    candidate.updated_by = req.user.id;
    candidate.updated_at = new Date();
    await candidate.save();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Upload candidate photo
// @route   POST /api/candidates/:id/photo
// @access  Private (Admin only)
exports.uploadPhoto = async (req, res, next) => {
  try {
    const candidate = await Candidate.findById(req.params.id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    // Handle the upload via middleware
    upload.single('photo')(req, res, async function (err) {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      // Delete old photo if exists
      if (candidate.photo && candidate.photo.startsWith('/uploads/candidate/')) {
        const oldPhotoPath = path.join(__dirname, '..', candidate.photo);
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
        }
      }

      // Update candidate with new photo path
      candidate.photo = `/uploads/candidate/${req.file.filename}`;
      candidate.updated_by = req.user.id;
      candidate.updated_at = new Date();
      await candidate.save();

      res.status(200).json({
        success: true,
        data: {
          photo: candidate.photo
        }
      });
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get candidates by criminal cases count
// @route   GET /api/candidates/criminal-cases
// @access  Public
exports.getCandidatesByCriminalCases = async (req, res, next) => {
  try {
    const candidates = await Candidate.aggregate([
      { $match: { is_active: true } },
      {
        $group: {
          _id: '$criminal_cases',
          count: { $sum: 1 },
          candidates: { $push: '$$ROOT' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      count: candidates.length,
      data: candidates
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get candidates by caste
// @route   GET /api/candidates/caste
// @access  Public
exports.getCandidatesByCaste = async (req, res, next) => {
  try {
    const candidates = await Candidate.aggregate([
      { $match: { is_active: true } },
      {
        $group: {
          _id: '$caste',
          count: { $sum: 1 },
          candidates: { $push: '$$ROOT' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      count: candidates.length,
      data: candidates
    });
  } catch (err) {
    next(err);
  }
};