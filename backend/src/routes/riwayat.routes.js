const express = require('express');
const router = express.Router();
const riwayatController = require('../controllers/riwayatController');
const { verifyToken, verifyRole } = require('../middlewares/authMiddleware');

// Only super admin can access reports
router.use(verifyToken, verifyRole(['super_admin']));

router.get('/', riwayatController.getRiwayat);
router.get('/:id', riwayatController.getDetailRiwayat);
router.get('/:id/struk', riwayatController.cetakStrukUlang);

module.exports = router;
