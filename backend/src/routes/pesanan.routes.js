const express = require('express');
const router = express.Router();
const pesananController = require('../controllers/pesananController');
const { verifyToken } = require('../middlewares/authMiddleware');

// All pesanan routes are accessible by both Kasir & Super Admin
router.use(verifyToken);

router.post('/', pesananController.createPesanan);
router.get('/antrian', pesananController.getAntrian);
router.put('/:id/status', pesananController.selesaikanPesanan);

module.exports = router;
