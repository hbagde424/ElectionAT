const express = require('express');
const router = express.Router();
const userRoleController = require('../controllers/userRoleController');

router.post('/assign', userRoleController.assignRole);
router.post('/remove', userRoleController.removeRole);

module.exports = router;
