const express = require('express');
const router = express.Router();
const produkController = require('../controllers/produkController');
const { verifyToken, verifyRole } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Get all - accessible by public (pelanggan online), kasir & super_admin
router.get('/', produkController.getAllProduk);

// Get deactivated products - accessible by super_admin & kasir
router.get('/deactivated', verifyToken, verifyRole(['super_admin', 'kasir']), produkController.getDeactivatedProduk);

// Create, Update, Delete, Restore - accessible by super_admin & kasir
router.post('/', verifyToken, verifyRole(['super_admin', 'kasir']), upload.single('gambar'), produkController.createProduk);
router.post('/:id/restore', verifyToken, verifyRole(['super_admin', 'kasir']), produkController.restoreProduk);
router.put('/:id', verifyToken, verifyRole(['super_admin', 'kasir']), upload.single('gambar'), produkController.updateProduk);
router.delete('/:id', verifyToken, verifyRole(['super_admin', 'kasir']), produkController.deleteProduk);

module.exports = router;
