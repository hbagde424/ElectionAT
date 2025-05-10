const express = require('express');
const router = express.Router();
const districtController = require('../controllers/districtController');

// Get all districts
router.get('/', districtController.getAllDistricts);

// Get district by name
router.get('/:name', districtController.getDistrictByName);

module.exports = router;