const express = require('express');
const router = express.Router();
const pengeluaranController = require('../controllers/pengeluaranController');
const { verifyToken, verifyRole } = require('../middlewares/authMiddleware');

// Hanya super_admin yang bisa mengelola pengeluaran
router.use(verifyToken, verifyRole(['super_admin']));

router.get('/', pengeluaranController.getAllPengeluaran);
router.post('/', pengeluaranController.createPengeluaran);
router.put('/:id', pengeluaranController.updatePengeluaran);
router.delete('/:id', pengeluaranController.deletePengeluaran);

module.exports = router;
