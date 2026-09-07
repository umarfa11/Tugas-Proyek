const prisma = require('../config/db');

const getLaporanLabaRugi = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    } else {
      // Default ke bulan ini
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      
      dateFilter = {
        gte: startOfMonth,
        lte: endOfMonth
      };
    }

    // 1. Total Pendapatan & Modal dari Pesanan Selesai/Lunas
    // Asumsi: Semua pesanan dengan status selesai sudah dibayar lunas
    const pesananSelesai = await prisma.pesanan.findMany({
      where: {
        statusPesanan: 'selesai',
        completedAt: dateFilter
      },
      include: {
        detailPesanan: {
          include: {
            produk: true
          }
        }
      }
    });

    let totalPendapatan = 0;
    let totalHargaModal = 0;

    pesananSelesai.forEach(pesanan => {
      totalPendapatan += Number(pesanan.totalHarga);
      
      pesanan.detailPesanan.forEach(dp => {
        // HPP = hargaModal * jumlah yang terjual
        const modalItem = dp.produk ? Number(dp.produk.hargaModal) : 0;
        totalHargaModal += (modalItem * dp.jumlah);
      });
    });

    // Laba Kotor = Pendapatan Penjualan - Harga Pokok Penjualan (HPP/Modal)
    const labaKotor = totalPendapatan - totalHargaModal;

    // 2. Total Pengeluaran Operasional
    const pengeluaran = await prisma.pengeluaran.findMany({
      where: {
        tanggal: dateFilter
      }
    });

    let totalPengeluaran = 0;
    pengeluaran.forEach(p => {
      totalPengeluaran += Number(p.nominal);
    });

    // Laba Bersih = Laba Kotor - Total Pengeluaran
    const labaBersih = labaKotor - totalPengeluaran;

    res.status(200).json({
      periode: {
        start: dateFilter.gte,
        end: dateFilter.lte
      },
      ringkasan: {
        totalPendapatan,
        totalHargaModal,
        labaKotor,
        totalPengeluaran,
        labaBersih
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getLaporanLabaRugi
};
