const express = require('express');
const router = express.Router();
const {
  getBLOs,
  getBLO,
  createBLO,
  updateBLO,
  deleteBLO
} = require('../controllers/bloController');
const { protect } = require('../middlewares/auth');

router.route('/')
  .get(protect, getBLOs)
  .post(protect, createBLO);

router.route('/:id')
  .get(protect, getBLO)
  .put(protect, updateBLO)
  .delete(protect, deleteBLO);

module.exports = router;
