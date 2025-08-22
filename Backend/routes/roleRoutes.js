const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');

router.post('/', roleController.createRole);
router.get('/', roleController.getRoles);
router.put('/:id', roleController.updateRole);
router.delete('/:id', roleController.deleteRole);

// Assign/remove permissions to/from role
router.post('/assign-permission', roleController.assignPermission);
router.post('/remove-permission', roleController.removePermission);

module.exports = router;
