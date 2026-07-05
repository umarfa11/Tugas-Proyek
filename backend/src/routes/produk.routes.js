const express = require('express');
const router = express.Router();
const produkController = require('../controllers/produkController');
const { verifyToken, verifyRole } = require('../middlewares/authMiddleware');

// Get all - accessible by kasir & super_admin
router.get('/', verifyToken, produkController.getAllProduk);

// Get deactivated products - only accessible by super_admin
router.get('/deactivated', verifyToken, verifyRole(['super_admin']), produkController.getDeactivatedProduk);

// Create, Update, Delete, Restore - only accessible by super_admin
router.post('/', verifyToken, verifyRole(['super_admin']), produkController.createProduk);
router.post('/:id/restore', verifyToken, verifyRole(['super_admin']), produkController.restoreProduk);
router.put('/:id', verifyToken, verifyRole(['super_admin']), produkController.updateProduk);
router.delete('/:id', verifyToken, verifyRole(['super_admin']), produkController.deleteProduk);

module.exports = router;
