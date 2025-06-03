const express = require('express');
const router = express.Router();
const parliamentController = require('../controllers/parliamentController');

// Create a new parliament
router.post('/', parliamentController.createParliament);

// Get all parliaments
router.get('/', parliamentController.getAllParliaments);

// Get parliaments by division ID
router.get('/division/:divisionId', parliamentController.getParliamentsByDivision);

// Get a single parliament by ID
// router.get('/:id', parliamentController.getParliamentById);

// Update a parliament
// router.put('/:id', parliamentController.updateParliament);

// Delete a parliament
// router.delete('/:id', parliamentController.deleteParliament);

module.exports = router;