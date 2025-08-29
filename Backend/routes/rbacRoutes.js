const express = require('express');
const router = express.Router();
const rbacMetricsController = require('../controllers/rbacMetricsController');
const { protect, requirePermission } = require('../middlewares/auth');

// Protect all routes
router.use(protect);

// @route   GET /api/rbac/metrics
// @desc    Get RBAC system metrics
// @access  Private (requires analytics.read permission)
router.get('/metrics', requirePermission('analytics.read'), rbacMetricsController.getRBACMetrics);

// @route   GET /api/rbac/role-permission-matrix
// @desc    Get role permission matrix
// @access  Private (requires role.read permission)
router.get('/role-permission-matrix', requirePermission('role.read'), rbacMetricsController.getRolePermissionMatrix);

// @route   GET /api/rbac/user-access-report
// @desc    Get user access report
// @access  Private (requires user.read permission)
router.get('/user-access-report', requirePermission('user.read'), rbacMetricsController.getUserAccessReport);

// @route   GET /api/rbac/permission-usage
// @desc    Get permission usage statistics
// @access  Private (requires analytics.read permission)
router.get('/permission-usage', requirePermission('analytics.read'), rbacMetricsController.getPermissionUsageStats);

// @route   GET /api/rbac/role-hierarchy
// @desc    Get role hierarchy information
// @access  Private (requires role.read permission)
router.get('/role-hierarchy', requirePermission('role.read'), rbacMetricsController.getRoleHierarchy);

module.exports = router;
