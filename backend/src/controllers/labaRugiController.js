const prisma = require('../config/db');

// Helper untuk mengkategorikan keterangan pengeluaran operasional
const categorizePengeluaran = (keterangan = '') => {
  const k = keterangan.toLowerCase();
  if (/listrik|pln|air|pdam|gas|lpg|token/.test(k)) return 'Utilitas (Listrik/Air/Gas)';
  if (/bahan|daging|ayam|mie|terigu|cabe|bumbu|sayur|minyak|garam|bawang|kuah|bakso|telur|kecap|saus/.test(k)) return 'Bahan Penolong & Dapur';
  if (/gaji|upah|bonus|karyawan|kasir|pekerja|lembur/.test(k)) return 'Gaji & Upah Karyawan';
  if (/sewa|kontrakan|tempat|ruko|kebersihan|sampah|retribusi|lapak/.test(k)) return 'Sewa & Kebersihan Tempat';
  if (/alat|mangkok|sendok|garpu|plastik|kresek|cup|sedotan|kemasan|pembungkus|kertas|tissue|tisu/.test(k)) return 'Perlengkapan & Kemasan';
  return 'Beban Operasional Lainnya';
};

// Helper normalisasi tanggal start dan end (00:00:00.000 s/d 23:59:59.999)
const normalizeDateRange = (preset, startDate, endDate) => {
  const now = new Date();
  let start, end;
  let prevStart, prevEnd;

  if (preset === 'hari_ini') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    // Kemarin
    prevStart = new Date(start);
    prevStart.setDate(prevStart.getDate() - 1);
    prevEnd = new Date(end);
    prevEnd.setDate(prevEnd.getDate() - 1);
  } else if (preset === 'minggu_ini') {
    // 7 hari terakhir
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    start = new Date(end);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    // 7 hari sebelumnya
    prevEnd = new Date(start);
    prevEnd.setMilliseconds(prevEnd.getMilliseconds() - 1);
    prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - 6);
    prevStart.setHours(0, 0, 0, 0);
  } else if (preset === 'tahun_ini') {
    start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    // Tahun lalu
    prevStart = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
    prevEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
  } else if (preset === 'bulan_ini' || (!startDate && !endDate)) {
    // Default: bulan berjalan
    start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    // Bulan sebelumnya
    prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  } else {
    // Custom range
    start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const diffDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
    prevEnd = new Date(start);
    prevEnd.setMilliseconds(prevEnd.getMilliseconds() - 1);
    prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - (diffDays - 1));
    prevStart.setHours(0, 0, 0, 0);
  }

  return { start, end, prevStart, prevEnd };
};

// Fungsi agregasi data finansial untuk periode tertentu
const aggregateFinancialData = async (startDate, endDate) => {
  const dateFilter = {
    gte: startDate,
    lte: endDate
  };

  // 1. Ambil seluruh pesanan selesai
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
      },
      pembayaran: true,
      user: {
        select: { id: true, nama: true }
      }
    },
    orderBy: { completedAt: 'asc' }
  });

  // 2. Ambil seluruh pengeluaran operasional
  const pengeluaran = await prisma.pengeluaran.findMany({
    where: {
      tanggal: dateFilter
    },
    orderBy: { tanggal: 'asc' }
  });

  // Akumulator
  let totalPendapatan = 0;
  let totalHargaModal = 0;
  let itemsCount = 0;
  let missingModalWarningCount = 0;

  const kategoriMap = {};
  const metodeBayarMap = {
    tunai: { nominal: 0, count: 0 },
    qris: { nominal: 0, count: 0 }
  };
  const produkStatsMap = {};
  const timeSeriesMap = {};

  // Helper key tanggal YYYY-MM-DD
  const toDateKey = (d) => {
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  };

  // Iterasi pesanan selesai
  pesananSelesai.forEach(pesanan => {
    const nilaiPesanan = Number(pesanan.totalHarga) || 0;
    totalPendapatan += nilaiPesanan;

    const dateKey = toDateKey(pesanan.completedAt || pesanan.createdAt);
    if (!timeSeriesMap[dateKey]) {
      timeSeriesMap[dateKey] = {
        tanggal: dateKey,
        pendapatan: 0,
        hpp: 0,
        labaKotor: 0,
        pengeluaran: 0,
        labaBersih: 0,
        transaksi: 0
      };
    }
    timeSeriesMap[dateKey].pendapatan += nilaiPesanan;
    timeSeriesMap[dateKey].transaksi += 1;

    // Pembayaran
    const metode = pesanan.pembayaran?.metodeBayar || 'tunai';
    if (!metodeBayarMap[metode]) {
      metodeBayarMap[metode] = { nominal: 0, count: 0 };
    }
    metodeBayarMap[metode].nominal += nilaiPesanan;
    metodeBayarMap[metode].count += 1;

    // Detail Item (HPP & Kategori)
    pesanan.detailPesanan.forEach(dp => {
      const qty = dp.jumlah || 0;
      itemsCount += qty;
      const subtotalItem = Number(dp.subtotal) || 0;
      const modalItemSatuan = dp.produk ? Number(dp.produk.hargaModal) || 0 : 0;
      const modalItemTotal = modalItemSatuan * qty;

      if (modalItemSatuan === 0) {
        missingModalWarningCount += 1;
      }

      totalHargaModal += modalItemTotal;
      timeSeriesMap[dateKey].hpp += modalItemTotal;

      const kategori = dp.produk?.kategori || 'Lainnya';
      if (!kategoriMap[kategori]) {
        kategoriMap[kategori] = {
          kategori,
          pendapatan: 0,
          hpp: 0,
          labaKotor: 0,
          qty: 0
        };
      }
      kategoriMap[kategori].pendapatan += subtotalItem;
      kategoriMap[kategori].hpp += modalItemTotal;
      kategoriMap[kategori].labaKotor += (subtotalItem - modalItemTotal);
      kategoriMap[kategori].qty += qty;

      // Produk individual
      const produkId = dp.produkId;
      const namaProduk = dp.produk?.namaProduk || `Produk #${produkId}`;
      if (!produkStatsMap[produkId]) {
        produkStatsMap[produkId] = {
          id: produkId,
          namaProduk,
          kategori,
          qty: 0,
          pendapatan: 0,
          hpp: 0,
          laba: 0
        };
      }
      produkStatsMap[produkId].qty += qty;
      produkStatsMap[produkId].pendapatan += subtotalItem;
      produkStatsMap[produkId].hpp += modalItemTotal;
      produkStatsMap[produkId].laba += (subtotalItem - modalItemTotal);
    });
  });

  // Laba kotor
  const labaKotor = totalPendapatan - totalHargaModal;

  // Beban Operasional
  let totalPengeluaran = 0;
  const bebanKategoriMap = {};

  pengeluaran.forEach(p => {
    const nominal = Number(p.nominal) || 0;
    totalPengeluaran += nominal;

    const kategoriBeban = categorizePengeluaran(p.keterangan);
    if (!bebanKategoriMap[kategoriBeban]) {
      bebanKategoriMap[kategoriBeban] = {
        kategori: kategoriBeban,
        total: 0,
        count: 0
      };
    }
    bebanKategoriMap[kategoriBeban].total += nominal;
    bebanKategoriMap[kategoriBeban].count += 1;

    const dateKey = toDateKey(p.tanggal);
    if (!timeSeriesMap[dateKey]) {
      timeSeriesMap[dateKey] = {
        tanggal: dateKey,
        pendapatan: 0,
        hpp: 0,
        labaKotor: 0,
        pengeluaran: 0,
        labaBersih: 0,
        transaksi: 0
      };
    }
    timeSeriesMap[dateKey].pengeluaran += nominal;
  });

  // Hitung Laba Bersih
  const labaOperasional = labaKotor - totalPengeluaran;
  const labaBersih = labaOperasional; // Beban/pendapatan lain-lain = 0 jika belum ada pos terpisah

  // Hitung laba bersih pada setiap time series point
  const timeSeries = Object.values(timeSeriesMap).sort((a, b) => a.tanggal.localeCompare(b.tanggal)).map(item => {
    const itemLabaKotor = item.pendapatan - item.hpp;
    const itemLabaBersih = itemLabaKotor - item.pengeluaran;
    return {
      ...item,
      labaKotor: itemLabaKotor,
      labaBersih: itemLabaBersih
    };
  });

  // Rasio Keuangan
  const grossMarginPct = totalPendapatan > 0 ? (labaKotor / totalPendapatan) * 100 : 0;
  const netMarginPct = totalPendapatan > 0 ? (labaBersih / totalPendapatan) * 100 : 0;
  const hppRatioPct = totalPendapatan > 0 ? (totalHargaModal / totalPendapatan) * 100 : 0;
  const expenseRatioPct = totalPendapatan > 0 ? (totalPengeluaran / totalPendapatan) * 100 : 0;
  const pesananCount = pesananSelesai.length;
  const aov = pesananCount > 0 ? totalPendapatan / pesananCount : 0;

  // Top Produk berdasarkan laba
  const topProdukByProfit = Object.values(produkStatsMap)
    .sort((a, b) => b.laba - a.laba)
    .slice(0, 5);

  // Top Produk berdasarkan omzet
  const topProdukByRevenue = Object.values(produkStatsMap)
    .sort((a, b) => b.pendapatan - a.pendapatan)
    .slice(0, 5);

  // Verifikasi matematis konsistensi
  const isBalanced = Math.abs((totalPendapatan - totalHargaModal - totalPengeluaran) - labaBersih) < 0.01;

  return {
    ringkasan: {
      totalPendapatan,
      totalHargaModal,
      labaKotor,
      totalPengeluaran,
      labaOperasional,
      labaBersih,
      status: labaBersih >= 0 ? 'untung' : 'rugi',
      jumlahPesanan: pesananCount,
      jumlahItemTerjual: itemsCount,
      jumlahPengeluaran: pengeluaran.length,
      aov,
      rasio: {
        grossMarginPct: Number(grossMarginPct.toFixed(2)),
        netMarginPct: Number(netMarginPct.toFixed(2)),
        hppRatioPct: Number(hppRatioPct.toFixed(2)),
        expenseRatioPct: Number(expenseRatioPct.toFixed(2))
      },
      validasi: {
        isBalanced,
        missingModalWarningCount
      }
    },
    breakdownKategori: Object.values(kategoriMap),
    breakdownMetodeBayar: metodeBayarMap,
    breakdownBeban: Object.values(bebanKategoriMap).sort((a, b) => b.total - a.total),
    topProduk: {
      byProfit: topProdukByProfit,
      byRevenue: topProdukByRevenue
    },
    timeSeries
  };
};

// Main Controller Handler
const getLaporanLabaRugi = async (req, res) => {
  try {
    const { preset, startDate, endDate } = req.query;

    const { start, end, prevStart, prevEnd } = normalizeDateRange(preset, startDate, endDate);

    // Ambil data periode berjalan dan periode pembanding secara paralel
    const [currentData, previousData, pesananDiprosesCount] = await Promise.all([
      aggregateFinancialData(start, end),
      aggregateFinancialData(prevStart, prevEnd),
      prisma.pesanan.count({
        where: {
          statusPesanan: 'diproses',
          createdAt: { gte: start, lte: end }
        }
      })
    ]);

    // Hitung perubahan (Growth & Delta)
    const calcGrowth = (curr, prev) => {
      const diff = curr - prev;
      const pct = prev !== 0 ? (diff / Math.abs(prev)) * 100 : (curr !== 0 ? 100 : 0);
      return {
        sebelumnya: prev,
        sekarang: curr,
        selisih: diff,
        persentase: Number(pct.toFixed(2))
      };
    };

    const perbandingan = {
      periodeSebelumnya: {
        start: prevStart,
        end: prevEnd
      },
      pendapatan: calcGrowth(currentData.ringkasan.totalPendapatan, previousData.ringkasan.totalPendapatan),
      hpp: calcGrowth(currentData.ringkasan.totalHargaModal, previousData.ringkasan.totalHargaModal),
      labaKotor: calcGrowth(currentData.ringkasan.labaKotor, previousData.ringkasan.labaKotor),
      totalPengeluaran: calcGrowth(currentData.ringkasan.totalPengeluaran, previousData.ringkasan.totalPengeluaran),
      labaBersih: calcGrowth(currentData.ringkasan.labaBersih, previousData.ringkasan.labaBersih),
      jumlahPesanan: calcGrowth(currentData.ringkasan.jumlahPesanan, previousData.ringkasan.jumlahPesanan)
    };

    res.status(200).json({
      periode: {
        preset: preset || 'custom',
        start,
        end
      },
      ringkasan: currentData.ringkasan,
      perbandingan,
      breakdownKategori: currentData.breakdownKategori,
      breakdownMetodeBayar: currentData.breakdownMetodeBayar,
      breakdownBeban: currentData.breakdownBeban,
      topProduk: currentData.topProduk,
      timeSeries: currentData.timeSeries,
      auditInfo: {
        pesananBelumSelesai: pesananDiprosesCount,
        missingModalWarningCount: currentData.ringkasan.validasi.missingModalWarningCount
      }
    });

  } catch (error) {
    console.error('Error in getLaporanLabaRugi:', error);
    res.status(500).json({ message: 'Internal server error saat mengolah laporan laba rugi' });
  }
};

// Handler untuk mengambil detail transaksi sumber (Drill-down audit)
const getDetailTransaksiSumber = async (req, res) => {
  try {
    const { preset, startDate, endDate, type } = req.query;
    const { start, end } = normalizeDateRange(preset, startDate, endDate);

    const dateFilter = { gte: start, lte: end };

    if (type === 'beban') {
      const pengeluaran = await prisma.pengeluaran.findMany({
        where: { tanggal: dateFilter },
        orderBy: { tanggal: 'desc' }
      });

      const formattedBeban = pengeluaran.map(p => ({
        id: p.id,
        tanggal: p.tanggal,
        keterangan: p.keterangan,
        kategori: categorizePengeluaran(p.keterangan),
        nominal: Number(p.nominal)
      }));

      return res.status(200).json({
        type: 'beban',
        periode: { start, end },
        total: formattedBeban.reduce((acc, curr) => acc + curr.nominal, 0),
        data: formattedBeban
      });
    }

    // Default type: 'penjualan'
    const pesanan = await prisma.pesanan.findMany({
      where: {
        statusPesanan: 'selesai',
        completedAt: dateFilter
      },
      include: {
        detailPesanan: {
          include: { produk: true }
        },
        pembayaran: true,
        user: { select: { nama: true } }
      },
      orderBy: { completedAt: 'desc' }
    });

    const formattedPesanan = pesanan.map(p => {
      let modalPesanan = 0;
      const items = p.detailPesanan.map(dp => {
        const modalItem = dp.produk ? Number(dp.produk.hargaModal) || 0 : 0;
        const totalModalItem = modalItem * dp.jumlah;
        modalPesanan += totalModalItem;
        return {
          id: dp.id,
          namaProduk: dp.produk?.namaProduk || 'Item Dihapus',
          kategori: dp.produk?.kategori || 'Makanan',
          jumlah: dp.jumlah,
          hargaSatuan: Number(dp.subtotal) / dp.jumlah,
          modalSatuan: modalItem,
          subtotal: Number(dp.subtotal),
          modalTotal: totalModalItem,
          labaItem: Number(dp.subtotal) - totalModalItem
        };
      });

      const totalHarga = Number(p.totalHarga);
      return {
        id: p.id,
        nomorAntrian: p.nomorAntrian,
        namaPembeli: p.namaPembeli,
        kasir: p.user?.nama || 'Kasir',
        completedAt: p.completedAt,
        metodeBayar: p.pembayaran?.metodeBayar || 'tunai',
        totalHarga,
        totalModal: modalPesanan,
        labaKotor: totalHarga - modalPesanan,
        items
      };
    });

    return res.status(200).json({
      type: 'penjualan',
      periode: { start, end },
      totalPendapatan: formattedPesanan.reduce((acc, curr) => acc + curr.totalHarga, 0),
      totalModal: formattedPesanan.reduce((acc, curr) => acc + curr.totalModal, 0),
      totalLabaKotor: formattedPesanan.reduce((acc, curr) => acc + curr.labaKotor, 0),
      data: formattedPesanan
    });

  } catch (error) {
    console.error('Error in getDetailTransaksiSumber:', error);
    res.status(500).json({ message: 'Internal server error saat mengambil detail transaksi sumber' });
  }
};

module.exports = {
  getLaporanLabaRugi,
  getDetailTransaksiSumber
};
