const User = require('../models/User');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { generateToken } = require('../utils/jwt');
const AssemblyMap = require('../models/AssemblyMap');

// Toggle user active status
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isActive = !user.isActive;
    await user.save();

    res.json({ message: `User is now ${user.isActive ? 'active' : 'deactive'}` });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { email, password, role, regionIds, regionModel } = req.body;

    // Create user
    const user = await User.create({
      email,
      password,
      role,
      regionIds, // changed from regionId to regionIds
      regionModel,
    });

    // Create token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        regionIds: user.regionIds, // changed from regionId to regionIds
        regionModel: user.regionModel,
        isActive: user.isActive // added isActive field
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'User account is deactivated' });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Create token
    const token = generateToken(user._id);

    // If user is assembly user, fetch the map data
    let assemblyMap = null;
    if (user.role === 'assembly') {
      assemblyMap = await AssemblyMap.findOne({ assemblyId: { $in: user.regionIds } }); // updated to check in array
    }

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        regionIds: user.regionIds, // changed from regionId to regionIds
        regionModel: user.regionModel,
        isActive: user.isActive // added isActive field
      },
      assemblyMap: assemblyMap || undefined
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    let assemblyMap = null;
    if (user.role === 'assembly') {
      assemblyMap = await AssemblyMap.findOne({ assemblyId: { $in: user.regionIds } }); // updated to check in array
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        regionIds: user.regionIds, // changed from regionId to regionIds
        regionModel: user.regionModel,
        isActive: user.isActive // added isActive field
      },
      assemblyMap: assemblyMap || undefined
    });
  } catch (err) {
    next(err);
  }
};