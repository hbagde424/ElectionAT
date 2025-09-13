const express = require('express');
const { getAssemblyStats } = require('../controllers/assemblyVotesController');
const router = express.Router();

router.get('/stats', getAssemblyStats);

module.exports = router;
