const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

const register = async (req, res) => {
  try {
    const { nama, username, password, role } = req.body;

    // Basic validation
    if (!nama || !username || !password || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        nama,
        username,
        password: hashedPassword,
        role
      }
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        nama: newUser.nama,
        username: newUser.username,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Error in register:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        nama: user.nama,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        nama: true,
        username: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);
    
    // Prevent self-deletion if we know the requester
    if (req.user && req.user.id === userId) {
      return res.status(400).json({ message: 'Tidak dapat menghapus akun Anda sendiri' });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has associated transactions
    const relatedPesanan = await prisma.pesanan.findFirst({
      where: { userId }
    });

    if (relatedPesanan) {
      return res.status(400).json({ message: 'Tidak dapat menghapus pengguna karena memiliki riwayat transaksi aktif. Akun dengan transaksi harus dipertahankan untuk integritas laporan.' });
    }

    await prisma.user.delete({
      where: { id: userId }
    });

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    // Handle Prisma ForeignKey constraint error gracefully just in case
    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'Gagal menghapus! Pengguna ini terikat dengan data transaksi.' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  register,
  login,
  getUsers,
  deleteUser
};
