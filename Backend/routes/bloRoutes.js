const express = require('express');
const router = express.Router();
const {
    getBLOs,
    getBLOById,
    createBLO,
    updateBLO,
    deleteBLO,
    requestPhoneOtp,
    verifyPhoneOtp,
    importBLOs
} = require('../controllers/bloController');

const { protect } = require('../middlewares/auth');
const { getUserPermissionsAndHierarchy } = require('../middlewares/permissions');

// Apply authentication to all routes
router.use(protect);

// GET /api/blos - Get all BLOs with filtering and pagination
router.get('/', getUserPermissionsAndHierarchy, getBLOs);

// GET /api/blos/:id - Get single BLO by ID
router.get('/:id', getUserPermissionsAndHierarchy, getBLOById);

// POST /api/blos - Create new BLO
router.post('/', createBLO);

// PUT /api/blos/:id - Update BLO
router.put('/:id', updateBLO);

// DELETE /api/blos/:id - Delete BLO
router.delete('/:id', deleteBLO);

// POST /api/blos/:id/request-phone-otp - Request OTP for phone number reveal
router.post('/:id/request-phone-otp', requestPhoneOtp);

// POST /api/blos/:id/verify-phone-otp - Verify OTP and reveal phone number
router.post('/:id/verify-phone-otp', verifyPhoneOtp);

// POST /api/blos/import - Bulk import BLOs
router.post('/import', importBLOs);

module.exports = router;