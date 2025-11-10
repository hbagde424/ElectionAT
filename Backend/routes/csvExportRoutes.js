const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { requestCsvOtp, verifyCsvOtp } = require('../controllers/csvExportController');

// Request OTP for a given resource export
router.post('/request-otp', protect, requestCsvOtp);
router.post('/verify-otp', protect, verifyCsvOtp);

module.exports = router;
