const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Division = require('../models/division');
const Parliament = require('../models/parliament');
const Block = require('../models/block');
const Assembly = require('../models/assembly');
// const Master = require('../models/Master');

// @desc    Register user
// @route   POST /api/users/register
// @access  Public (for first superAdmin) or Private (for subsequent registrations)
exports.register = async (req, res, next) => {
  try {
    const { email, password, role, accessLevel, regionIds, regionModel } = req.body;

        const superAdminExists = await User.exists({ role: 'SuperAdmin' });
    
    // If superAdmin exists, require authentication
    if (superAdminExists && !req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to register users'
      });
    }
    
    // If superAdmin exists and user is not superAdmin, deny access
    if (superAdminExists && req.user.role !== 'SuperAdmin') {
      return res.status(403).json({
        success: false,
        message: 'Only SuperAdmin can register users'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // For superAdmin registration, skip region validation
    if (role !== 'superAdmin') {
      if (!regionModel || !regionIds || regionIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Region information is required for this role'
        });
      }

      let RegionModel;
      switch (regionModel) {
        case 'Division':
          RegionModel = Division;
          break;
        case 'Parliament':
          RegionModel = Parliament;
          break;
        case 'Block':
          RegionModel = Block;
          break;
        case 'Assembly':
          RegionModel = Assembly;
          break;
        case 'master':
          RegionModel = Master;
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid region model'
          });
      }

      const regions = await RegionModel.find({ _id: { $in: regionIds } });
      if (regions.length !== regionIds.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more region IDs are invalid'
        });
      }
    }

    // Create user data object
    const userData = {
      email,
      password,
      role,
      accessLevel: role === 'superAdmin' ? 'editor' : accessLevel || 'viewOnly'
    };

    // Only add region info if not superAdmin
    if (role !== 'superAdmin') {
      userData.regionIds = regionIds;
      userData.regionModel = regionModel;
    }

    // Add createdBy if available (from authenticated user)
    if (req.user) {
      userData.createdBy = req.user.id;
    }

    // Create user
    const user = await User.create(userData);

    // Create token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      data: {
        id: user._id,
        email: user.email,
        role: user.role,
        accessLevel: user.accessLevel
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is disabled'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Create token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      data: {
        id: user._id,
        email: user.email,
        role: user.role,
        accessLevel: user.accessLevel
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged in user
// @route   GET /api/users/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('regionIds', 'name');

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user details
// @route   PUT /api/users/me
// @access  Private
exports.updateMe = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      email: req.body.email,
      accessLevel: req.body.accessLevel
    };

    // Only allow password update if provided
    if (req.body.password) {
      fieldsToUpdate.password = req.body.password;
    }

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    }).select('-password');

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin/SuperAdmin only)
exports.getUsers = async (req, res, next) => {
  try {
    // Only superAdmin can see all users, others see only their created users
    let query = {};
    if (req.user.role !== 'superAdmin') {
      query = { createdBy: req.user.id };
    }

    const users = await User.find(query)
      .select('-password')
      .populate('createdBy', 'email')
      .populate('regionIds', 'name');

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private (Admin/SuperAdmin only)
exports.getUser = async (req, res, next) => {
  try {
    let query = { _id: req.params.id };
    
    // Non-superAdmins can only see their created users
    if (req.user.role !== 'superAdmin') {
      query.createdBy = req.user.id;
    }

    const user = await User.findOne(query)
      .select('-password')
      .populate('createdBy', 'email')
      .populate('regionIds', 'name');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found or not authorized'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin/SuperAdmin only)
exports.updateUser = async (req, res, next) => {
  try {
    let query = { _id: req.params.id };
    
    // Non-superAdmins can only update their created users
    if (req.user.role !== 'superAdmin') {
      query.createdBy = req.user.id;
    }

    // Find user first to check permissions
    const existingUser = await User.findOne(query);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found or not authorized'
      });
    }

    // Prepare update data
    const updateData = {
      ...req.body,
      updatedBy: req.user.id
    };

    // Remove password if not being updated
    if (!req.body.password) {
      delete updateData.password;
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    }).select('-password');

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin/SuperAdmin only)
exports.deleteUser = async (req, res, next) => {
  try {
    let query = { _id: req.params.id };
    
    // Non-superAdmins can only delete their created users
    if (req.user.role !== 'superAdmin') {
      query.createdBy = req.user.id;
    }

    const user = await User.findOne(query);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found or not authorized'
      });
    }

    // Prevent deleting self
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle user active status
// @route   PUT /api/users/:id/toggle-active
// @access  Private (Admin/SuperAdmin only)
exports.toggleActive = async (req, res, next) => {
  try {
    let query = { _id: req.params.id };
    
    // Non-superAdmins can only toggle their created users
    if (req.user.role !== 'superAdmin') {
      query.createdBy = req.user.id;
    }

    const user = await User.findOne(query);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found or not authorized'
      });
    }

    // Prevent disabling self
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot disable your own account'
      });
    }

    user.isActive = !user.isActive;
    user.updatedBy = req.user.id;
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        isActive: user.isActive
      }
    });
  } catch (err) {
    next(err);
  }
};

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};