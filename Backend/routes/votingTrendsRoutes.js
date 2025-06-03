const express = require('express');
const router = express.Router();
const votingTrendsController = require('../controllers/votingTrendsController');

router.post('/', votingTrendsController.createVotingTrend);
router.get('/booth/:boothId', votingTrendsController.getVotingTrendsByBooth);
router.get('/booth/:boothId/year/:year', votingTrendsController.getVotingTrendByBoothAndYear);
router.put('/booth/:boothId/year/:year', votingTrendsController.updateVotingTrend);
router.delete('/booth/:boothId/year/:year', votingTrendsController.deleteVotingTrend);

module.exports = router;