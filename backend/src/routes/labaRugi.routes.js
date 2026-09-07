const express = require('express');
const router = express.Router();
const labaRugiController = require('../controllers/labaRugiController');
const { verifyToken, verifyRole } = require('../middlewares/authMiddleware');

// Hanya super_admin yang bisa melihat laba rugi
router.use(verifyToken, verifyRole(['super_admin']));

router.get('/', labaRugiController.getLaporanLabaRugi);

module.exports = router;
