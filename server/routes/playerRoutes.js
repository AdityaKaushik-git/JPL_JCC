const express = require('express');
const router = express.Router();
const playerController = require('../controllers/playerController');
const { authMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, playerController.getAllPlayers);
router.get('/:id', authMiddleware, playerController.getPlayerById);

module.exports = router;
