const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');

router.get('/dashboard', menuController.getDashboardMenu);

module.exports = router;
