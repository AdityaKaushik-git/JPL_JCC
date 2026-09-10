const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware } = require('../middleware/auth');

router.get('/team', authMiddleware, userController.getTeam);
router.get('/bids', authMiddleware, userController.getBids);
router.get('/player-profile', authMiddleware, userController.getPlayerProfile);
router.put('/player-profile', authMiddleware, userController.updatePlayerProfile);

module.exports = router;
