const express = require('express');
const router = express.Router();
const divisionController = require('../controllers/divisionController');

// Create a new division
router.post('/', divisionController.createDivision);

// Get all divisions
router.get('/', divisionController.getAllDivisions);

// Get divisions by state ID
router.get('/state/:stateId', divisionController.getDivisionsByState);

// Get a single division by ID
// router.get('/:id', divisionController.getDivisionById);

// Update a division
// router.put('/:id', divisionController.updateDivision);

// Delete a division
// router.delete('/:id', divisionController.deleteDivision);

module.exports = router;