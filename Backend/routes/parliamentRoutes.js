const express = require('express');
const {
  getParliaments,
  getParliament,
  createParliament,
  updateParliament,
  deleteParliament,
  importParliaments,
  uploadParliamentPolygon,
  getTotalParliaments,
  getParliamentRelatedData,
  getParliamentPolygons,
  getParliamentPolygonsByDivision
} = require('../controllers/parliamentController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Parliaments
 *   description: Parliament management
 */

router.get('/', getParliaments);
router.get('/polygons', getParliamentPolygons);
router.get('/polygons/name/:divisionName', getParliamentPolygonsByDivision);
router.get('/total', getTotalParliaments);
router.get('/:id', getParliament);
router.get('/:id/related-data', getParliamentRelatedData);
router.post('/', protect, authorize('superAdmin'), createParliament);
router.put('/:id', protect, authorize('superAdmin'), updateParliament);
router.delete('/:id', protect, authorize('superAdmin'), deleteParliament);
router.post('/import', protect, authorize('superAdmin'), importParliaments);
router.post('/upload-polygon', protect, authorize('superAdmin'), uploadParliamentPolygon);

module.exports = router;
