const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const State = require('../models/state');
const Division = require('../models/division');
const Parliament = require('../models/parliament');
const Block = require('../models/block');
const Assembly = require('../models/assembly');
const Booth = require('../models/booth');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// @desc    Register user
// @route   POST /api/users/register
// @access  Private (Admin/SuperAdmin)
exports.register = async (req, res, next) => {
  try {
    const { username, mobile, email, password, role } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { mobile }, { username }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email, mobile or username already exists'
      });
    }

    // Verify references based on role
    let verificationPromises = [];
    
    if (role === 'State' && req.body.state_ids) {
      verificationPromises.push(State.find({ _id: { $in: req.body.state_ids }}));
    }
    if (role === 'Division' && req.body.division_ids) {
      verificationPromises.push(Division.find({ _id: { $in: req.body.division_ids }}));
    }
    if (role === 'Parliament' && req.body.parliament_ids) {
      verificationPromises.push(Parliament.find({ _id: { $in: req.body.parliament_ids }}));
    }
    if (role === 'Block' && req.body.block_ids) {
      verificationPromises.push(Block.find({ _id: { $in: req.body.block_ids }}));
    }
    if (role === 'Assembly' && req.body.assembly_ids) {
      verificationPromises.push(Assembly.find({ _id: { $in: req.body.assembly_ids }}));
    }
    if (role === 'Booth' && req.body.booth_ids) {
      verificationPromises.push(Booth.find({ _id: { $in: req.body.booth_ids }}));
    }

    const verificationResults = await Promise.all(verificationPromises);
    
    for (const result of verificationResults) {
      if (!result || result.length !== req.body[`${role.toLowerCase()}_ids`]?.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more referenced IDs are invalid'
        });
      }
    }

    const userData = {
      ...req.body,
      created_by: req.user.id
    };

    const user = await User.create(userData);

    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate field value entered'
      });
    }
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username and password'
      });
    }

    const user = await User.findOne({ $or: [{ username }, { email: username }, { mobile: username }] }).select('+password');
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is disabled. Please contact admin.'
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current user
// @route   GET /api/users/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('state_ids', 'name')
      .populate('division_ids', 'name')
      .populate('parliament_ids', 'name')
      .populate('assembly_ids', 'name')
      .populate('block_ids', 'name')
      .populate('booth_ids', 'name booth_number')
      .populate('created_by', 'username');

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
      username: req.body.username,
      mobile: req.body.mobile,
      email: req.body.email
    };

    if (req.body.password) {
      fieldsToUpdate.password = req.body.password;
    }
    req.body.updated_at = new Date();

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
// @access  Private (Admin/SuperAdmin)
exports.getUsers = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit);
    const skip = (page - 1) * limit;

    let query = {};
    
    // Non-superAdmins can only see users they created
    if (req.user.role !== 'SuperAdmin') {
      query.created_by = req.user.id;
    }

    // Search functionality
    if (req.query.search) {
      query.$or = [
        { username: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { mobile: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Filter by role
    if (req.query.role) {
      query.role = req.query.role;
    }

    const users = await User.find(query)
      .select('-password')
      .populate('state_ids', 'name')
      .populate('division_ids', 'name')
      .populate('parliament_ids', 'name')
      .populate('assembly_ids', 'name')
      .populate('block_ids', 'name')
      .populate('booth_ids', 'name booth_number')
      .populate('created_by', 'username')
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: users
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private (Admin/SuperAdmin)
exports.getUser = async (req, res, next) => {
  try {
    let query = { _id: req.params.id };
    
    // Non-superAdmins can only see users they created
    if (req.user.role !== 'SuperAdmin') {
      query.created_by = req.user.id;
    }

    const user = await User.findOne(query)
      .select('-password')
      .populate('state_ids', 'name')
      .populate('division_ids', 'name')
      .populate('parliament_ids', 'name')
      .populate('assembly_ids', 'name')
      .populate('block_ids', 'name')
      .populate('booth_ids', 'name booth_number')
      .populate('created_by', 'username');

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
// @access  Private (Admin/SuperAdmin)
exports.updateUser = async (req, res, next) => {
  try {
    let query = { _id: req.params.id };
    
    // Non-superAdmins can only update users they created
    if (req.user.role !== 'SuperAdmin') {
      query.created_by = req.user.id;
    }

    const existingUser = await User.findOne(query);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found or not authorized'
      });
    }

    // Verify references if being updated
    if (req.body.role || req.body[`${req.body.role?.toLowerCase()}_ids`]) {
      const role = req.body.role || existingUser.role;
      const ids = req.body[`${role.toLowerCase()}_ids`] || existingUser[`${role.toLowerCase()}_ids`];
      
      let Model;
      switch (role) {
        case 'State': Model = State; break;
        case 'Division': Model = Division; break;
        case 'Parliament': Model = Parliament; break;
        case 'Block': Model = Block; break;
        case 'Assembly': Model = Assembly; break;
        case 'Booth': Model = Booth; break;
        default: break;
      }

      if (Model && ids) {
        const refs = await Model.find({ _id: { $in: ids } });
        if (refs.length !== ids.length) {
          return res.status(400).json({
            success: false,
            message: 'One or more referenced IDs are invalid'
          });
        }
      }
    }

    const updateData = {
      ...req.body,
      updated_by: req.user.id
    };
    req.body.updated_at = new Date();

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    }).select('-password');

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate field value entered'
      });
    }
    next(err);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin/SuperAdmin)
exports.deleteUser = async (req, res, next) => {
  try {
    let query = { _id: req.params.id };
    
    // Non-superAdmins can only delete users they created
    if (req.user.role !== 'SuperAdmin') {
      query.created_by = req.user.id;
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
// @access  Private (Admin/SuperAdmin)
exports.toggleActive = async (req, res, next) => {
  try {
    let query = { _id: req.params.id };
    
    // Non-superAdmins can only toggle users they created
    if (req.user.role !== 'SuperAdmin') {
      query.created_by = req.user.id;
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
    user.updated_by = req.user.id;
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