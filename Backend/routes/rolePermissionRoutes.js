const express = require('express');
const router = express.Router();
const rolePermissionController = require('../controllers/rolePermissionController');

router.get('/:roleId', rolePermissionController.getRolePermissions);

module.exports = router;
