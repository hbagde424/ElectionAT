// middlewares/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const RBACService = require('../utils/rbac');

exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!req.user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is disabled'
      });
    }

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Convert both stored role and checked roles to same case for comparison
    const userRole = req.user.role.toLowerCase();
    const allowedRoles = roles.map(role => role.toLowerCase());

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// New RBAC-based authorization middlewares

// Permission-based authorization middleware
exports.requirePermission = (permissionName, scopeType = null) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }

      // Extract scope ID from request parameters if needed
      let scopeId = null;
      if (scopeType) {
        scopeId = req.params[`${scopeType.toLowerCase()}Id`] || 
                  req.body[`${scopeType.toLowerCase()}Id`] ||
                  req.query[`${scopeType.toLowerCase()}Id`];
      }

      const hasPermission = await RBACService.checkUserPermission(
        req.user._id, 
        permissionName, 
        scopeType, 
        scopeId
      );

      if (!hasPermission) {
        return res.status(403).json({ 
          success: false, 
          message: `Access denied. Required permission: ${permissionName}` 
        });
      }

      next();
    } catch (error) {
      console.error('Authorization error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Authorization check failed' 
      });
    }
  };
};

// Role-based authorization middleware
exports.requireRole = (roleName) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }

      const userRoles = await req.user.getUserRoles();
      const hasRole = userRoles.some(ur => ur.role.name === roleName);

      if (!hasRole) {
        return res.status(403).json({ 
          success: false, 
          message: `Access denied. Required role: ${roleName}` 
        });
      }

      next();
    } catch (error) {
      console.error('Role authorization error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Role check failed' 
      });
    }
  };
};

// Scope-based authorization middleware
exports.requireScope = (scopeType) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }

      const scopeId = req.params[`${scopeType.toLowerCase()}Id`] || 
                     req.body[`${scopeType.toLowerCase()}Id`] ||
                     req.query[`${scopeType.toLowerCase()}Id`];

      if (!scopeId) {
        return res.status(400).json({ 
          success: false, 
          message: `${scopeType} ID required` 
        });
      }

      const userRoles = await req.user.getUserRoles();
      const hasScope = userRoles.some(ur => 
        ur.scope_type === scopeType && 
        ur.scope_id.toString() === scopeId.toString()
      );

      if (!hasScope) {
        return res.status(403).json({ 
          success: false, 
          message: `Access denied for ${scopeType}:${scopeId}` 
        });
      }

      next();
    } catch (error) {
      console.error('Scope authorization error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Scope check failed' 
      });
    }
  };
};

// Super admin only middleware
exports.requireSuperAdmin = exports.requireRole('SuperAdmin');

// State admin or higher middleware
exports.requireStateAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    const userRoles = await req.user.getUserRoles();
    const hasRequiredRole = userRoles.some(ur => 
      ['SuperAdmin', 'StateAdmin'].includes(ur.role.name)
    );

    if (!hasRequiredRole) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. State admin or higher role required' 
      });
    }

    next();
  } catch (error) {
    console.error('State admin authorization error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Authorization check failed' 
    });
  }
};