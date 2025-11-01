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
    console.log('=== LOGIN ATTEMPT ===');
    console.log('Request body:', req.body);
    console.log('Request headers:', req.headers);

    const { email, password } = req.body;
    console.log('Extracted email:', email);
    console.log('Extracted password:', password ? '[PROVIDED]' : '[MISSING]');

    // Validate email & password
    if (!email || !password) {
      console.log('❌ Missing email or password');
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // Check for user
    console.log('🔍 Looking for user with email:', email);
    const user = await User.findOne({ email }).select('+password');
    console.log('👤 User found:', !!user);

    if (!user) {
      console.log('❌ User not found in database');
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    console.log('📋 User details:');
    console.log('  - Email:', user.email);
    console.log('  - Username:', user.username);
    console.log('  - Role:', user.role);
    console.log('  - Active:', user.isActive);
    console.log('  - Has password:', !!user.password);

    // Check if user is active
    if (!user.isActive) {
      console.log('❌ User account is deactivated');
      return res.status(401).json({ success: false, message: 'User account is deactivated' });
    }

    // Check if password matches
    console.log('🔐 Testing password comparison...');
    const isMatch = await user.comparePassword(password);
    console.log('🔐 Password match result:', isMatch);

    if (!isMatch) {
      console.log('❌ Password does not match');
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    console.log('✅ Password matches! Generating token...');

    // Create token
    const token = generateToken(user._id);

    // If user is Assembly user, fetch the map data
    let assemblyMap = null;
    if (user.role === 'Assembly') {
      // When role is Assembly, prefer assembly_ids from User schema
      const assemblyIds = Array.isArray(user.assembly_ids) ? user.assembly_ids : [];
      if (assemblyIds.length > 0) {
        assemblyMap = await AssemblyMap.findOne({ assemblyId: { $in: assemblyIds } });
      }
    }

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        username: user.username,
        isActive: user.isActive,
        // Include hierarchical scopes so frontend can infer hierarchy when needed
        state_ids: user.state_ids || [],
        division_ids: user.division_ids || [],
        parliament_ids: user.parliament_ids || [],
        assembly_ids: user.assembly_ids || [],
        block_ids: user.block_ids || [],
        booth_ids: user.booth_ids || []
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
    if (user.role === 'Assembly') {
      const assemblyIds = Array.isArray(user.assembly_ids) ? user.assembly_ids : [];
      if (assemblyIds.length > 0) {
        assemblyMap = await AssemblyMap.findOne({ assemblyId: { $in: assemblyIds } });
      }
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        username: user.username,
        isActive: user.isActive,
        state_ids: user.state_ids || [],
        division_ids: user.division_ids || [],
        parliament_ids: user.parliament_ids || [],
        assembly_ids: user.assembly_ids || [],
        block_ids: user.block_ids || [],
        booth_ids: user.booth_ids || []
      },
      assemblyMap: assemblyMap || undefined
    });
  } catch (err) {
    next(err);
  }
};