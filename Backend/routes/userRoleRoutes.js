const express = require('express');
const router = express.Router();
const userRoleController = require('../controllers/userRoleController');

// New enhanced routes
router.post('/', userRoleController.assignUserRole);
router.delete('/', userRoleController.removeUserRole);
router.get('/user/:userId', userRoleController.getUserRoles);
router.get('/role/:roleId', userRoleController.getRoleUsers);

// Legacy routes for backward compatibility
router.post('/assign', userRoleController.assignRole);
router.post('/remove', userRoleController.removeRole);

module.exports = router;
