const prisma = require('../config/db');

const createPesanan = async (req, res) => {
  try {
    const { namaPembeli, items, metodeBayar, nominalDiterima } = req.body;
    const userId = req.user.id; // from auth middleware

    if (!namaPembeli || !items || items.length === 0 || !metodeBayar) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (metodeBayar === 'tunai' && nominalDiterima == null) {
      return res.status(400).json({ message: 'Nominal diterima is required for tunai' });
    }

    // 1. Fetch all products in one single query to optimize database roundtrips (prevents N+1)
    const productIds = items.map(item => item.produkId);
    const dbProducts = await prisma.produk.findMany({
      where: {
        id: { in: productIds }
      }
    });

    const productMap = new Map(dbProducts.map(p => [p.id, p]));
    let totalHarga = 0;
    const detailPesananData = [];

    for (const item of items) {
      const produk = productMap.get(item.produkId);
      if (!produk) {
        return res.status(404).json({ message: `Produk dengan ID ${item.produkId} tidak ditemukan` });
      }
      if (produk.stok < item.jumlah) {
        return res.status(400).json({ message: `Stok tidak mencukupi untuk ${produk.namaProduk}` });
      }

      const subtotal = Number(produk.harga) * Number(item.jumlah);
      totalHarga += subtotal;

      detailPesananData.push({
        produkId: item.produkId,
        jumlah: Number(item.jumlah),
        subtotal
      });
    }

    // Hitung kembalian
    const numTotal = Number(totalHarga);
    const numNominal = metodeBayar === 'tunai' ? Number(nominalDiterima) : numTotal;
    
    if (metodeBayar === 'tunai' && numNominal < numTotal) {
        return res.status(400).json({ message: 'Nominal uang tidak mencukupi' });
    }
    const kembalian = numNominal - numTotal;

    // 2. Determine Nomor Antrian (Resets to 1 every day/24 hours based on local server time)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const lastPesananToday = await prisma.pesanan.findFirst({
      where: {
        createdAt: {
          gte: startOfToday
        }
      },
      orderBy: { id: 'desc' }
    });
    const nomorAntrian = lastPesananToday ? lastPesananToday.nomorAntrian + 1 : 1;

    // 3. Prisma Transaction: Create Pesanan, Details, Pembayaran, and Update Stock
    const result = await prisma.$transaction(async (tx) => {
      // Create pesanan
      const newPesanan = await tx.pesanan.create({
        data: {
          nomorAntrian,
          namaPembeli,
          userId,
          totalHarga: numTotal,
          statusPesanan: 'diproses',
          detailPesanan: {
            create: detailPesananData
          },
          pembayaran: {
            create: {
              metodeBayar,
              nominalDiterima: numNominal,
              kembalian,
              statusPembayaran: 'lunas'
            }
          }
        },
        include: {
          detailPesanan: true,
          pembayaran: true
        }
      });

      // Update stocks in parallel
      const updatePromises = detailPesananData.map(item => 
        tx.produk.update({
          where: { id: item.produkId },
          data: {
            stok: { decrement: item.jumlah }
          }
        })
      );
      
      await Promise.all(updatePromises);

      return newPesanan;
    }, {
      maxWait: 10000,
      timeout: 30000
    });

    res.status(201).json({
      message: 'Pesanan created successfully',
      pesanan: result
    });
  } catch (error) {
    console.error('Error in createPesanan:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getAntrian = async (req, res) => {
  try {
    const antrian = await prisma.pesanan.findMany({
      where: {
        statusPesanan: 'diproses'
      },
      orderBy: {
        enteredAt: 'asc' // FIFO logic
      },
      include: {
        detailPesanan: {
            include: { produk: true }
        }
      }
    });

    res.status(200).json(antrian);
  } catch (error) {
    console.error('Error in getAntrian:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const selesaikanPesanan = async (req, res) => {
  try {
    const { id } = req.params;
    const pesananId = parseInt(id);

    const pesanan = await prisma.pesanan.findUnique({ where: { id: pesananId } });
    if (!pesanan) {
      return res.status(404).json({ message: 'Pesanan not found' });
    }

    if (pesanan.statusPesanan === 'selesai') {
      return res.status(400).json({ message: 'Pesanan is already completed' });
    }

    const updatedPesanan = await prisma.pesanan.update({
      where: { id: pesananId },
      data: {
        statusPesanan: 'selesai',
        completedAt: new Date()
      },
      include: {
        detailPesanan: {
          include: { produk: true }
        },
        pembayaran: true
      }
    });

    res.status(200).json({
      message: 'Pesanan marked as completed',
      pesanan: updatedPesanan
    });
  } catch (error) {
    console.error('Error in selesaikanPesanan:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createPesananOnline = async (req, res) => {
  try {
    const { namaPembeli, nomorHp, items } = req.body;

    if (!namaPembeli || !nomorHp || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Nama, nomor WhatsApp, dan menu pesanan wajib diisi' });
    }

    // 1. Fetch all products
    const productIds = items.map(item => item.produkId);
    const dbProducts = await prisma.produk.findMany({
      where: {
        id: { in: productIds },
        deactivatedAt: null
      }
    });

    const productMap = new Map(dbProducts.map(p => [p.id, p]));
    let totalHarga = 0;
    const detailPesananData = [];

    for (const item of items) {
      const produk = productMap.get(item.produkId);
      if (!produk) {
        return res.status(404).json({ message: `Produk dengan ID ${item.produkId} tidak ditemukan atau dinonaktifkan` });
      }
      if (produk.stok < item.jumlah) {
        return res.status(400).json({ message: `Stok tidak mencukupi untuk menu ${produk.namaProduk} (Sisa stok: ${produk.stok})` });
      }

      const subtotal = Number(produk.harga) * Number(item.jumlah);
      totalHarga += subtotal;

      detailPesananData.push({
        produkId: item.produkId,
        jumlah: Number(item.jumlah),
        subtotal
      });
    }

    // 2. Determine Nomor Antrian (Reset ke 1 tiap hari)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const lastPesananToday = await prisma.pesanan.findFirst({
      where: {
        createdAt: {
          gte: startOfToday
        }
      },
      orderBy: { id: 'desc' }
    });
    const nomorAntrian = lastPesananToday ? lastPesananToday.nomorAntrian + 1 : 1;

    // 3. Prisma Transaction
    const result = await prisma.$transaction(async (tx) => {
      const newPesanan = await tx.pesanan.create({
        data: {
          nomorAntrian,
          namaPembeli,
          nomorHp: String(nomorHp).trim(),
          tipePesanan: 'online',
          totalHarga: Number(totalHarga),
          statusPesanan: 'diproses',
          detailPesanan: {
            create: detailPesananData
          },
          pembayaran: {
            create: {
              metodeBayar: 'qris',
              nominalDiterima: Number(totalHarga),
              kembalian: 0,
              statusPembayaran: 'lunas'
            }
          }
        },
        include: {
          detailPesanan: {
            include: { produk: true }
          },
          pembayaran: true
        }
      });

      // Potong stok produk
      const updatePromises = detailPesananData.map(item =>
        tx.produk.update({
          where: { id: item.produkId },
          data: {
            stok: { decrement: item.jumlah }
          }
        })
      );

      await Promise.all(updatePromises);
      return newPesanan;
    }, {
      maxWait: 10000,
      timeout: 30000
    });

    res.status(201).json({
      message: 'Pesanan online berhasil dibuat',
      pesanan: result
    });
  } catch (error) {
    console.error('Error in createPesananOnline:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const cekStatusPesanan = async (req, res) => {
  try {
    const { id } = req.params;
    const pesanan = await prisma.pesanan.findUnique({
      where: { id: parseInt(id) },
      include: {
        detailPesanan: {
          include: { produk: true }
        },
        pembayaran: true
      }
    });

    if (!pesanan) {
      return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
    }

    res.status(200).json(pesanan);
  } catch (error) {
    console.error('Error in cekStatusPesanan:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  createPesanan,
  getAntrian,
  selesaikanPesanan,
  createPesananOnline,
  cekStatusPesanan
};
