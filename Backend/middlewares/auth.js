// middlewares/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/config');

exports.protect = async (req, res, next) => {
  let token;

  // Extract token from Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Reject request if no token provided
  if (!token) {
    // Log unauthorized access attempt (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('[Auth Middleware] Unauthorized access attempt to:', req.path);
    }
    
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in to access this resource.',
      data: null // Explicitly return null data
    });
  }

  try {
    // Check if JWT_SECRET is configured (use config for consistency with token generation)
    const jwtSecret = config.JWT_SECRET || process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('[Auth Middleware] JWT_SECRET is not configured!');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error',
        data: null
      });
    }

    // Verify and decode the JWT token
    const decoded = jwt.verify(token, jwtSecret);
    
    // Find user in database
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      // Log in development only
      if (process.env.NODE_ENV === 'development') {
        console.log('[Auth Middleware] User not found for token ID:', decoded.id);
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token. Please log in again.',
        data: null // No data returned for security
      });
    }

    if (!req.user.isActive) {
      // Log in development only
      if (process.env.NODE_ENV === 'development') {
        console.log('[Auth Middleware] Inactive user attempted access:', req.user.email);
      }
      return res.status(401).json({
        success: false,
        message: 'Your account has been disabled. Please contact an administrator.',
        data: null // No data returned for security
      });
    }

    // Authentication successful - proceed to next middleware
    // Only log in development to reduce production noise
    if (process.env.NODE_ENV === 'development') {
      console.log('[Auth Middleware] Authenticated user:', req.user.email);
    }
    next();
  } catch (err) {
    // Handle different JWT error types
    let errorMessage = 'Invalid or expired authentication token. Please log in again.';
    
    if (process.env.NODE_ENV === 'development') {
      console.error('[Auth Middleware] Token verification failed:', err.message);
      if (err.name === 'TokenExpiredError') {
        console.error('[Auth Middleware] Token has expired');
      } else if (err.name === 'JsonWebTokenError') {
        console.error('[Auth Middleware] Invalid token format or signature');
      }
    }
    
    return res.status(401).json({
      success: false,
      message: errorMessage,
      data: null, // Explicitly return null - no data leaked
      // Only include error details in development
      ...(process.env.NODE_ENV === 'development' && { error: err.message })
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