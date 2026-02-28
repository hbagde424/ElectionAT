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
const { getUserPermissionsAndHierarchy } = require('../middlewares/permissions');

router.route('/')
  .get(protect, getUserPermissionsAndHierarchy, getBLAs)
  .post(protect, createBLA);

router.route('/import')
  .post(protect, importBLAs);

// Phone OTP routes
router.post('/:id/request-phone-otp', protect, requestPhoneOtp);
router.post('/:id/verify-phone-otp', protect, verifyPhoneOtp);

router.route('/:id')
  .get(protect, getUserPermissionsAndHierarchy, getBLA)
  .put(protect, updateBLA)
  .delete(protect, deleteBLA);

module.exports = router;

