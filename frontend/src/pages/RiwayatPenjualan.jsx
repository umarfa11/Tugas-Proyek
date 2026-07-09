import React, { useState, useEffect } from 'react';
import { 
  History, Search, Calendar, Filter, ChevronDown, ChevronUp,
  User, Clock, Banknote, QrCode, Package, Printer, Eye, EyeOff, CheckCircle2, Download
} from 'lucide-react';
import * as XLSX from 'xlsx';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import RekapStruk from '../components/RekapStruk';
import api from '../services/api';

const formatDateForDisplay = (dateString) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

const RiwayatPenjualan = () => {
  const [riwayat, setRiwayat] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [detailData, setDetailData] = useState(null);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterMetode, setFilterMetode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Struk modal
  const [isRekapStrukOpen, setIsRekapStrukOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  const fetchRiwayat = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (filterMetode) params.append('metodeBayar', filterMetode);

      const res = await api.get(`/riwayat?${params.toString()}`);
      setRiwayat(res.data);
    } catch (err) {
      console.error('Error fetching riwayat:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRiwayat();
  }, [startDate, endDate, filterMetode]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, riwayat]);

  const handlePresetDate = (days) => {
    const end = new Date();
    const start = new Date();
    
    // For '1 Hari', both start and end are today
    if (days > 1) {
      start.setDate(end.getDate() - (days - 1));
    }

    const formatDateInput = (d) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    setStartDate(formatDateInput(start));
    setEndDate(formatDateInput(end));
  };

  // Detail expand
  const handleToggleDetail = async (id) => {
    if (expandedId === id) {
      setExpandedId(null);
      setDetailData(null);
      return;
    }
    try {
      const res = await api.get(`/riwayat/${id}`);
      setDetailData(res.data);
      setExpandedId(id);
    } catch (err) {
      console.error('Error fetching detail:', err);
    }
  };

  const formatRupiah = (num) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  // Local search filter
  const filteredRiwayat = riwayat.filter(item =>
    item.namaPembeli?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(item.nomorAntrian).includes(searchQuery)
  );

  const totalPages = Math.ceil(filteredRiwayat.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedRiwayat = filteredRiwayat.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Summary stats
  const totalPendapatan = filteredRiwayat.reduce((sum, item) => sum + Number(item.totalHarga), 0);
  const totalTransaksi = filteredRiwayat.length;
  const totalTunai = filteredRiwayat.filter(i => i.pembayaran?.metodeBayar === 'tunai').length;
  const totalQris = filteredRiwayat.filter(i => i.pembayaran?.metodeBayar === 'qris').length;

  // Export to Excel
  const exportToExcel = () => {
    // Siapkan data rapi untuk excel
    const excelData = filteredRiwayat.map((item, index) => ({
      'No': index + 1,
      'No. Antrian': item.nomorAntrian,
      'Nama Pembeli': item.namaPembeli,
      'Kasir': item.user?.nama || '-',
      'Tanggal Transaksi': formatDate(item.completedAt),
      'Metode Bayar': item.pembayaran?.metodeBayar?.toUpperCase() || '-',
      'Total Belanja': item.totalHarga,
      'Nominal Tunai': item.pembayaran?.metodeBayar === 'tunai' ? item.pembayaran?.nominalDiterima : '-',
      'Kembalian': item.pembayaran?.kembalian || '-',
      'Status': item.statusPesanan
    }));

    // Buat worksheet dan workbook
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Riwayat Penjualan");

    // Atur lebar kolom agar rapi
    const wscols = [
      {wch: 5},  // No
      {wch: 12}, // Antrian
      {wch: 25}, // Nama
      {wch: 20}, // Kasir
      {wch: 22}, // Tanggal
      {wch: 15}, // Metode
      {wch: 15}, // Total
      {wch: 15}, // Nominal
      {wch: 15}, // Kembalian
      {wch: 12}, // Status
    ];
    ws['!cols'] = wscols;

    // Simpan file
    const fileName = `Laporan_Penjualan_${startDate || 'Semua'}_sd_${endDate || 'Semua'}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-dark">Riwayat Penjualan</h1>
          <p className="text-gray-400 text-sm mt-1">Lihat rekap seluruh transaksi yang sudah selesai</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <Banknote size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Total Pendapatan</p>
              <p className="text-lg font-bold text-dark">{formatRupiah(totalPendapatan)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <History size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Total Transaksi</p>
              <p className="text-lg font-bold text-dark">{totalTransaksi}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
              <Banknote size={20} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Tunai</p>
              <p className="text-lg font-bold text-dark">{totalTunai} transaksi</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <QrCode size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-400">QRIS</p>
              <p className="text-lg font-bold text-dark">{totalQris} transaksi</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 shadow-sm">
        {/* Preset Buttons */}
        <div className="flex gap-2 mb-4 pb-4 border-b border-gray-50">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handlePresetDate(7)}
            className="text-xs py-1.5"
          >
            1 Minggu
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handlePresetDate(30)}
            className="text-xs py-1.5"
          >
            1 Bulan
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <div className="sm:col-span-2 lg:col-span-2">
            <Input icon={Search} placeholder="Cari nama pembeli / no. antrian..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Dari Tanggal</label>
            <div className="relative">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10" />
              <div className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white flex justify-between items-center text-dark focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/20">
                <span>{startDate ? formatDateForDisplay(startDate) : 'dd/mm/yyyy'}</span>
                <Calendar size={16} className="text-gray-400" />
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Sampai Tanggal</label>
            <div className="relative">
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10" />
              <div className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white flex justify-between items-center text-dark focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/20">
                <span>{endDate ? formatDateForDisplay(endDate) : 'dd/mm/yyyy'}</span>
                <Calendar size={16} className="text-gray-400" />
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Metode Pembayaran</label>
            <select value={filterMetode} onChange={(e) => setFilterMetode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 bg-white">
              <option value="">Semua</option>
              <option value="tunai">Tunai</option>
              <option value="qris">QRIS</option>
            </select>
          </div>

          <Button 
            variant="outline" 
            size="md" 
            icon={Download} 
            onClick={exportToExcel}
            disabled={filteredRiwayat.length === 0}
            className="w-full sm:col-span-2 lg:col-span-5 text-green-600 border-green-200 hover:bg-green-50 hover:border-green-300 mt-1"
          >
            Export Excel
          </Button>
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : filteredRiwayat.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-300">
            <History size={36} className="mb-2" />
            <p className="text-sm text-gray-400">Belum ada riwayat transaksi</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {paginatedRiwayat.map((item) => (
              <div key={item.id}>
                {/* Row */}
                <div className="flex flex-wrap sm:flex-nowrap items-center px-4 sm:px-6 py-4 hover:bg-gray-50/50 transition-colors gap-y-3">
                  {/* Queue number */}
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gray-50 flex flex-col items-center justify-center mr-3 sm:mr-4 shrink-0">
                    <span className="text-[9px] text-gray-400 uppercase">No.</span>
                    <span className="text-base sm:text-lg font-bold text-dark">{item.nomorAntrian}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 mb-0.5">
                      <User size={14} className="text-gray-400" />
                      <span className="font-semibold text-dark text-sm">{item.namaPembeli}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400 mt-1 sm:mt-0">
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {formatDate(item.completedAt)}
                      </span>
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        item.pembayaran?.metodeBayar === 'tunai' 
                          ? 'bg-yellow-50 text-yellow-700' 
                          : 'bg-purple-50 text-purple-700'
                      }`}>
                        {item.pembayaran?.metodeBayar === 'tunai' ? <Banknote size={10} /> : <QrCode size={10} />}
                        {item.pembayaran?.metodeBayar?.toUpperCase()}
                      </span>
                      {item.user && (
                        <span className="text-gray-300 flex items-center gap-1">
                          Kasir: {item.user.nama}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Total and Actions grouping for Mobile/Desktop */}
                  <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end ml-[3.25rem] sm:ml-0 pl-1 sm:pl-0 border-t sm:border-0 border-gray-100 pt-3 sm:pt-0">
                    <div className="text-left sm:text-right mr-4">
                      <p className="font-bold text-dark">{formatRupiah(item.totalHarga)}</p>
                      <span className="inline-flex items-center px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-semibold rounded-full mt-0.5">
                        <CheckCircle2 size={10} className="mr-1" /> Selesai
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleToggleDetail(item.id)}
                        className="p-2 rounded-lg text-gray-400 hover:text-secondary hover:bg-secondary/10 transition-colors"
                        title="Detail"
                      >
                        {expandedId === item.id ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expandable Detail */}
                {expandedId === item.id && detailData && (
                  <div className="px-4 sm:px-6 pb-4">
                    <div className="bg-gray-50 rounded-xl p-3 sm:p-4 sm:ml-[72px]">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Detail Item</p>
                      <div className="space-y-2">
                        {detailData.detailPesanan?.map((detail, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <Package size={14} className="text-gray-400" />
                              <span className="text-dark">{detail.produk?.namaProduk}</span>
                            </div>
                            <div className="flex items-center gap-4 text-gray-500">
                              <span>{detail.jumlah} x {formatRupiah(detail.produk?.harga || 0)}</span>
                              <span className="font-semibold text-dark w-24 text-right">{formatRupiah(detail.subtotal)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between text-sm font-bold">
                        <span>Total</span>
                        <span>{formatRupiah(detailData.totalHarga)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between bg-white px-4 py-3 border border-gray-100 rounded-2xl mt-4 shadow-sm gap-3">
          <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
            Menampilkan <span className="font-medium text-dark">{startIndex + 1}</span> hingga <span className="font-medium text-dark">{Math.min(startIndex + ITEMS_PER_PAGE, filteredRiwayat.length)}</span> dari <span className="font-medium text-dark">{filteredRiwayat.length}</span> transaksi
          </div>
          <div className="flex gap-2 w-full sm:w-auto justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Sebelumnya
            </Button>
            <div className="flex items-center px-3 text-sm font-medium text-dark">
              Halaman {currentPage} dari {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      )}

      {/* Rekap Struk Modal */}
      <Modal isOpen={isRekapStrukOpen} onClose={() => setIsRekapStrukOpen(false)} title="Cetak Rekap Penjualan" size="sm">
        {isRekapStrukOpen && (
          <RekapStruk 
            data={filteredRiwayat} 
            stats={{ totalPendapatan, totalTransaksi, totalTunai, totalQris }}
            filterInfo={startDate === endDate && startDate !== '' ? formatDate(startDate).split(',')[0] : (startDate ? formatDate(startDate).split(',')[0] + ' s/d ' + (endDate ? formatDate(endDate).split(',')[0] : 'Sekarang') : 'Semua Waktu')}
            onClose={() => setIsRekapStrukOpen(false)} 
          />
        )}
      </Modal>
    </div>
  );
};

export default RiwayatPenjualan;
