const express = require('express');
const router = express.Router();
const electionYearController = require('../controllers/electionYearController');

router.post('/', electionYearController.createElectionYear);
router.get('/', electionYearController.getAllElectionYears);
router.get('/:id', electionYearController.getElectionYearById);
router.put('/:id', electionYearController.updateElectionYear);
router.delete('/:id', electionYearController.deleteElectionYear);

module.exports = router;