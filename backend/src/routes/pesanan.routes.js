const express = require('express');
const router = express.Router();
const pesananController = require('../controllers/pesananController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Public routes for online customers
router.post('/online', pesananController.createPesananOnline);
router.get('/status/:id', pesananController.cekStatusPesanan);

// Protected routes - Kasir & Super Admin
router.use(verifyToken);

router.post('/', pesananController.createPesanan);
router.get('/antrian', pesananController.getAntrian);
router.put('/:id/status', pesananController.selesaikanPesanan);

module.exports = router;
