import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Activity, Receipt, Soup } from 'lucide-react';
import Button from '../components/ui/Button';
import api from '../services/api';

const LabaRugi = () => {
  const [laporan, setLaporan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Tanggal default: bulan ini
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(startOfMonth);
  const [endDate, setEndDate] = useState(endOfMonth);

  const fetchLaporan = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/laba-rugi?startDate=${startDate}&endDate=${endDate}`);
      setLaporan(res.data.ringkasan);
    } catch (err) {
      console.error('Error fetching laba rugi:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLaporan();
  }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    fetchLaporan();
  };

  const formatRupiah = (num) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark">Laporan Laba Rugi</h1>
          <p className="text-gray-400 text-sm mt-1">Pantau performa keuangan bisnis Anda</p>
        </div>
      </div>

      {/* Filter Tanggal */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6">
        <form onSubmit={handleFilter} className="flex flex-col sm:flex-row items-end gap-4">
          <div className="flex-1 w-full space-y-1.5">
            <label className="text-sm font-medium text-gray-500">Dari Tanggal</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
              required
            />
          </div>
          <div className="flex-1 w-full space-y-1.5">
            <label className="text-sm font-medium text-gray-500">Sampai Tanggal</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
              required
            />
          </div>
          <Button type="submit" icon={Calendar} className="w-full sm:w-auto h-[42px]">
            Terapkan Filter
          </Button>
        </form>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : laporan ? (
        <div className="space-y-6">
          {/* Highlight Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <DollarSign size={100} />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                  <Activity size={20} />
                </div>
                <h3 className="font-semibold text-gray-500">Total Pendapatan</h3>
              </div>
              <div className="text-3xl font-bold text-dark">{formatRupiah(laporan.totalPendapatan)}</div>
              <p className="text-xs text-gray-400 mt-2">Dari semua pesanan selesai</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Soup size={100} />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
                  <TrendingDown size={20} />
                </div>
                <h3 className="font-semibold text-gray-500">Total Modal (HPP)</h3>
              </div>
              <div className="text-3xl font-bold text-dark">{formatRupiah(laporan.totalHargaModal)}</div>
              <p className="text-xs text-gray-400 mt-2">Modal barang yang terjual</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Receipt size={100} />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
                  <TrendingDown size={20} />
                </div>
                <h3 className="font-semibold text-gray-500">Biaya Operasional</h3>
              </div>
              <div className="text-3xl font-bold text-dark">{formatRupiah(laporan.totalPengeluaran)}</div>
              <p className="text-xs text-gray-400 mt-2">Listrik, sewa, gaji, dll</p>
            </div>
          </div>

          {/* Laba Bersih Card */}
          <div className={`p-8 rounded-3xl border shadow-lg relative overflow-hidden text-center ${
            laporan.labaBersih >= 0 
              ? 'bg-gradient-to-br from-emerald-500 to-teal-600 border-transparent text-white' 
              : 'bg-gradient-to-br from-red-500 to-rose-600 border-transparent text-white'
          }`}>
            <div className="absolute -top-10 -right-10 opacity-10">
              {laporan.labaBersih >= 0 ? <TrendingUp size={200} /> : <TrendingDown size={200} />}
            </div>
            
            <h2 className="text-lg font-medium opacity-90 mb-2">
              {laporan.labaBersih >= 0 ? 'Laba Bersih' : 'Rugi Bersih'}
            </h2>
            <div className="text-5xl font-extrabold tracking-tight mb-4">
              {formatRupiah(laporan.labaBersih)}
            </div>
            
            <div className="inline-flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 px-6 py-3 bg-white/10 rounded-2xl backdrop-blur-sm text-sm font-medium">
              <div className="flex items-center gap-2">
                <span className="opacity-70">Laba Kotor:</span>
                <span>{formatRupiah(laporan.labaKotor)}</span>
              </div>
              <div className="hidden sm:block w-1 h-1 rounded-full bg-white/50" />
              <div className="flex items-center gap-2">
                <span className="opacity-70">Pengeluaran:</span>
                <span>- {formatRupiah(laporan.totalPengeluaran)}</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default LabaRugi;
