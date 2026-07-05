const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

const { verifyToken, verifyRole } = require('../middlewares/authMiddleware');

// Public Routes
router.post('/register', authController.register); // Or this could be protected, but keeping public for now
router.post('/login', authController.login);

// Protected Admin Routes
router.get('/users', verifyToken, verifyRole(['super_admin']), authController.getUsers);
router.delete('/users/:id', verifyToken, verifyRole(['super_admin']), authController.deleteUser);

module.exports = router;
