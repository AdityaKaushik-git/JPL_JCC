const express = require('express');
const router = express.Router();
const auctionController = require('../controllers/auctionController');
const { authMiddleware } = require('../middleware/auth');

router.get('/status', authMiddleware, auctionController.getStatus);
router.get('/history', authMiddleware, auctionController.getHistory);

module.exports = router;
