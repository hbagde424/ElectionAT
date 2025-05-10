const express = require('express');
const router = express.Router();
const parliamentController = require('../controllers/parliamentController');

// Get all parliaments
router.get('/', parliamentController.getAllParliaments);

// Get parliament by name
router.get('/:name', parliamentController.getParliamentByName);

module.exports = router;