const prisma = require('../config/db');

const getRiwayat = async (req, res) => {
  try {
    const { startDate, endDate, metodeBayar } = req.query;

    const filters = {
      statusPesanan: 'selesai'
    };

    if (startDate || endDate) {
      filters.completedAt = {};
      if (startDate) {
        filters.completedAt.gte = new Date(startDate);
      }
      if (endDate) {
        filters.completedAt.lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
      }
    }

    if (metodeBayar) {
      filters.pembayaran = {
        is: {
          metodeBayar: metodeBayar
        }
      };
    }

    const riwayat = await prisma.pesanan.findMany({
      where: filters,
      orderBy: {
        completedAt: 'desc'
      },
      include: {
        pembayaran: true,
        user: {
            select: { nama: true }
        }
      }
    });

    res.status(200).json(riwayat);
  } catch (error) {
    console.error('Error in getRiwayat:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getDetailRiwayat = async (req, res) => {
  try {
    const { id } = req.params;
    const pesananId = parseInt(id);

    const pesanan = await prisma.pesanan.findUnique({
      where: { id: pesananId },
      include: {
        detailPesanan: {
          include: { produk: true }
        },
        pembayaran: true,
        user: { select: { nama: true } }
      }
    });

    if (!pesanan) {
      return res.status(404).json({ message: 'Riwayat not found' });
    }

    res.status(200).json(pesanan);
  } catch (error) {
    console.error('Error in getDetailRiwayat:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const cetakStrukUlang = async (req, res) => {
  try {
    const { id } = req.params;
    const pesananId = parseInt(id);

    // Essentially the same as getDetailRiwayat, but could be formatted specifically for printing
    // The frontend will handle the actual printing.
    const pesanan = await prisma.pesanan.findUnique({
      where: { id: pesananId },
      include: {
        detailPesanan: {
          include: { produk: true }
        },
        pembayaran: true,
        user: { select: { nama: true } }
      }
    });

    if (!pesanan) {
      return res.status(404).json({ message: 'Pesanan not found' });
    }

    res.status(200).json({
      message: 'Struk data generated',
      struk: pesanan
    });
  } catch (error) {
    console.error('Error in cetakStrukUlang:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getRiwayat,
  getDetailRiwayat,
  cetakStrukUlang
};
