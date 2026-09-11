const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware } = require('../middleware/auth');

router.get('/my-team', authMiddleware, userController.getTeam);
router.get('/my-bids', authMiddleware, userController.getBids);
router.get('/profile', authMiddleware, userController.getProfile);
router.put('/profile', authMiddleware, userController.updateProfile);
router.get('/dashboard', authMiddleware, userController.getDashboard);

// Legacy aliases
router.get('/team', authMiddleware, userController.getTeam);
router.get('/bids', authMiddleware, userController.getBids);
router.get('/player-profile', authMiddleware, userController.getPlayerProfile);
router.put('/player-profile', authMiddleware, userController.updatePlayerProfile);

module.exports = router;
