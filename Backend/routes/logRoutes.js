const express = require('express');
const router = express.Router();
const { getLogs, getLogMeta, getLogById } = require('../controllers/logController');
const { protect } = require('../middlewares/auth');

// Secure logs behind auth; you can add role-based check if needed
router.get('/', protect, getLogs);
router.get('/meta', protect, getLogMeta);
router.get('/:id', protect, getLogById);

module.exports = router;
