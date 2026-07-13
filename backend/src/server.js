const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const uploadDir = process.env.NODE_ENV === 'production' 
  ? '/tmp/uploads' 
  : path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadDir));

// Routes
const authRoutes = require('./routes/auth.routes');
const produkRoutes = require('./routes/produk.routes');
const pesananRoutes = require('./routes/pesanan.routes');
const riwayatRoutes = require('./routes/riwayat.routes');

app.use('/api/auth', authRoutes);
app.use('/api/produk', produkRoutes);
app.use('/api/pesanan', pesananRoutes);
app.use('/api/riwayat', riwayatRoutes);

// Basic Route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to KASIR BAKSOKU API' });
});

// Start Server (Hanya dijalankan jika tidak di lingkungan Vercel)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// Export untuk Vercel Serverless Function
module.exports = app;
