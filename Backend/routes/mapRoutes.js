const express = require('express');
const { getPolygons } = require('../controllers/mapController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.route('/polygons').get(protect, getPolygons);

module.exports = router;