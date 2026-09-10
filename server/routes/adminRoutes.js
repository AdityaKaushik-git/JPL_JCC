const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.use(authMiddleware, adminMiddleware);

router.get('/users', adminController.getUsers);
router.post('/players', adminController.addPlayer);
router.put('/players/:id', adminController.updatePlayer);
router.delete('/players/:id', adminController.deletePlayer);
router.get('/auction/state', adminController.getAuctionState);

module.exports = router;
