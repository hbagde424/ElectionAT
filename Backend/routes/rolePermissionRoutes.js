const express = require('express');
const router = express.Router();
const rolePermissionController = require('../controllers/rolePermissionController');

router.get('/:roleId', rolePermissionController.getRolePermissions);
router.get('/', rolePermissionController.getAllRolePermissions);
router.post('/', rolePermissionController.createRolePermission);
router.delete('/', rolePermissionController.deleteRolePermission);

module.exports = router;
