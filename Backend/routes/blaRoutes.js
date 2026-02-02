const express = require('express');
const router = express.Router();
const {
  getBLAs,
  getBLA,
  createBLA,
  updateBLA,
  deleteBLA,
  importBLAs,
  requestPhoneOtp,
  verifyPhoneOtp
} = require('../controllers/blaController');
const { protect } = require('../middlewares/auth');

router.route('/')
  .get(protect, getBLAs)
  .post(protect, createBLA);

router.route('/import')
  .post(protect, importBLAs);

// Phone OTP routes
router.post('/:id/request-phone-otp', protect, requestPhoneOtp);
router.post('/:id/verify-phone-otp', protect, verifyPhoneOtp);

router.route('/:id')
  .get(protect, getBLA)
  .put(protect, updateBLA)
  .delete(protect, deleteBLA);

module.exports = router;

