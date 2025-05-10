const express = require('express');
const router = express.Router();
const divisionController = require('../controllers/divisionController');

// Get all divisions
router.get('/', divisionController.getAllDivisions);

// Get division by name
router.get('/:name', divisionController.getDivisionByName);

module.exports = router;