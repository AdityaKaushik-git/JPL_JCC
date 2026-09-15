const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.use(authMiddleware, adminMiddleware);

router.get('/users', adminController.getUsers);
router.get('/players', adminController.getPlayers);
router.get('/stats', adminController.getStats);
router.get('/auction-history', adminController.getAuctionHistory);
router.delete('/auction-history/:id', adminController.deleteAuctionHistoryRecord);
router.post('/players', adminController.addPlayer);
router.put('/players/:id', adminController.updatePlayer);
router.patch('/players/:id/status', adminController.updatePlayerStatus);
router.delete('/players/:id', adminController.deletePlayer);
router.get('/auction/state', adminController.getAuctionState);

module.exports = router;
