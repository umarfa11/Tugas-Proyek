const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

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

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
