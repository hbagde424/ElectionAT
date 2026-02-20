const express = require('express');
const {
  getAssemblies,
  getAssembly,
  createAssembly,
  updateAssembly,
  deleteAssembly,
  importAssemblies,
  uploadAssemblyPolygon,
  getAssemblyRelatedData
} = require('../controllers/assemblyController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Assemblies
 *   description: Assembly management
 */

router.get('/', getAssemblies);
router.get('/:id', getAssembly);
router.get('/:id/related-data', getAssemblyRelatedData);
router.post('/', protect, authorize('superAdmin'), createAssembly);
router.put('/:id', protect, authorize('superAdmin'), updateAssembly);
router.delete('/:id', protect, authorize('superAdmin'), deleteAssembly);
router.post('/import', protect, authorize('superAdmin'), importAssemblies);
router.post('/upload-polygon', protect, authorize('superAdmin'), uploadAssemblyPolygon);

module.exports = router;
