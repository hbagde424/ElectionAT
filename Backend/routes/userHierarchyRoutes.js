const express = require('express');
const router = express.Router();
const userHierarchyController = require('../controllers/userHierarchyController');

// Set user hierarchy access
router.post('/', userHierarchyController.setUserHierarchy);

// Get user hierarchy
router.get('/:userId', userHierarchyController.getUserHierarchy);

// Get all user hierarchies
router.get('/', userHierarchyController.getAllUserHierarchies);

// Remove user hierarchy
router.delete('/:userId', userHierarchyController.removeUserHierarchy);

module.exports = router;
