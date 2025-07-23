const express = require('express');
const router = express.Router();
const {
    getStatePolygons,
    getStatePolygonByCode,
    seedStatePolygons
} = require('../controllers/statePolygonController');

// Get all state polygons
router.get('/', getStatePolygons);

// Get single state polygon by state code
router.get('/:stateCode', getStatePolygonByCode);

// Seed state polygon data
router.post('/seed', seedStatePolygons);

module.exports = router;
