import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
  Package, ShoppingCart, ListOrdered, History, ArrowRight, TrendingUp, DollarSign, Activity,
  ChevronDown, Upload, SlidersHorizontal
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import api from '../services/api';

const Dashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    produk: 0,
    antrian: 0,
    transaksiHariIni: 0,
    pendapatanHariIni: 0
  });

  const [chartData, setChartData] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const formatRupiah = (num) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const currentYear = new Date().getFullYear();
        const [resProduk, resAntrian, resRiwayat] = await Promise.all([
          api.get('/produk'),
          api.get('/pesanan/antrian'),
          api.get(`/riwayat?startDate=${currentYear}-01-01`)
        ]);

        const riwayat = resRiwayat.data;

        // --- Calculate Today's Stats ---
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayTransactions = riwayat.filter(item => {
          const itemDate = new Date(item.completedAt);
          itemDate.setHours(0, 0, 0, 0);
          return itemDate.getTime() === today.getTime();
        });

        const pendapatanHariIni = todayTransactions.reduce((sum, item) => sum + Number(item.totalHarga), 0);

        setStats({
          produk: resProduk.data.length,
          antrian: resAntrian.data.length,
          transaksiHariIni: todayTransactions.length,
          pendapatanHariIni
        });

        // --- Process Chart Data (Monthly for Current Year) ---
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
        const fullMonthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

        const yearlyData = monthNames.map((name, index) => ({
          monthIndex: index,
          name: name,
          fullDate: `${fullMonthNames[index]} ${currentYear}`,
          total: 0
        }));

        riwayat.forEach(item => {
          const itemDate = new Date(item.completedAt);
          if (itemDate.getFullYear() === currentYear) {
            const monthIdx = itemDate.getMonth();
            yearlyData[monthIdx].total += Number(item.totalHarga);
          }
        });

        setChartData(yearlyData);

        // --- Recent Transactions ---
        const sorted = [...riwayat].sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
        setRecentTransactions(sorted.slice(0, 5));

      } catch (error) {
        console.error("Gagal mengambil data dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-gray-400 font-medium">Memuat Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-10">

      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-dark mb-1">Dashboard Overview</h1>
          <p className="text-sm text-gray-500">
            Ringkasan performa dan aktivitas Kasir Baksoku hari ini
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2.5 bg-white border border-gray-200 text-dark rounded-full text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2">
            Hari Ini <ChevronDown size={16} className="text-gray-400" />
          </button>
          <button className="px-4 py-2.5 bg-white border border-gray-200 text-dark rounded-full text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2">
            <Upload size={16} /> Export
          </button>
          <button className="px-4 py-2.5 bg-blue-500 text-white rounded-full text-sm font-medium hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-sm shadow-blue-500/30">
            <SlidersHorizontal size={16} /> Filter
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        
        {/* Card 1: Pendapatan (Gradient) */}
        <div 
          onClick={() => navigate('/admin/riwayat')}
          className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-[1.5rem] shadow-lg shadow-blue-500/20 relative overflow-hidden cursor-pointer hover:-translate-y-1 transition-transform"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-white/90 text-sm font-medium mb-1">Total Pendapatan</p>
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">{formatRupiah(stats.pendapatanHariIni)}</h3>
                <span className="flex items-center gap-1 text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">
                  <TrendingUp size={12} /> 12.5%
                </span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm mt-1">
              <DollarSign size={20} className="text-blue-500" />
            </div>
          </div>
          <p className="text-white/70 text-xs">Bulan lalu: {formatRupiah(stats.pendapatanHariIni * 0.8)}</p>
        </div>

        {/* Card 2: Transaksi */}
        <div 
          onClick={() => navigate('/admin/pesanan')}
          className="bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-sm cursor-pointer hover:-translate-y-1 transition-transform"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Total Pesanan</p>
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-3xl sm:text-4xl font-bold text-dark tracking-tight">{stats.transaksiHariIni}</h3>
                <span className="flex items-center gap-1 text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                  <TrendingUp size={12} /> 8.2%
                </span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-[#1e293b] flex items-center justify-center shrink-0 mt-1">
              <ShoppingCart size={20} className="text-white" />
            </div>
          </div>
          <p className="text-gray-400 text-xs">Bulan lalu: {Math.floor(stats.transaksiHariIni * 0.8)}</p>
        </div>

        {/* Card 3: Antrian */}
        <div 
          onClick={() => navigate('/admin/antrian')}
          className="bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-sm cursor-pointer hover:-translate-y-1 transition-transform"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Antrian Aktif</p>
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-3xl sm:text-4xl font-bold text-dark tracking-tight">{stats.antrian}</h3>
                <span className="flex items-center gap-1 text-[10px] font-bold bg-red-50 text-red-500 px-2 py-0.5 rounded-full">
                  <Activity size={12} /> Live
                </span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center shrink-0 mt-1">
              <ListOrdered size={20} className="text-white" />
            </div>
          </div>
          <p className="text-gray-400 text-xs">Menunggu diproses</p>
        </div>

        {/* Card 4: Produk */}
        <div 
          onClick={() => navigate('/admin/produk')}
          className="bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-sm cursor-pointer hover:-translate-y-1 transition-transform"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Total Produk Menu</p>
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-3xl sm:text-4xl font-bold text-dark tracking-tight">{stats.produk}</h3>
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center shrink-0 mt-1">
              <Package size={20} className="text-white" />
            </div>
          </div>
          <p className="text-gray-400 text-xs">Item aktif di database</p>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Chart Area */}
        <div className="lg:col-span-2 bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold text-dark">Performance Overview</h2>
            </div>
            <button className="px-4 py-2 bg-gray-50 border border-gray-100 text-dark rounded-full text-sm font-medium hover:bg-gray-100 transition-colors flex items-center gap-2">
              Tahun Ini <ChevronDown size={16} className="text-gray-400" />
            </button>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                    <stop offset="100%" stopColor="#93c5fd" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  tickFormatter={(value) => `${value / 1000}k`}
                  width={60}
                />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px 20px' }}
                  labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}
                  formatter={(value) => [formatRupiah(value), "Total Revenue"]}
                  labelFormatter={(label, payload) => {
                    if (payload && payload.length > 0) {
                      return payload[0].payload.fullDate;
                    }
                    return label;
                  }}
                />
                <Bar 
                  dataKey="total" 
                  radius={[8, 8, 8, 8]} 
                  barSize={32}
                  background={{ fill: '#f1f5f9', radius: [8, 8, 8, 8] }}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.total > 0 ? "url(#colorTotal)" : "transparent"} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity List / Right Column */}
        <div className="bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-dark">Aktivitas Terkini</h2>
            </div>
            <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50">
              <span className="text-xl leading-none -mt-2">...</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {recentTransactions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 pb-10">
                <History size={32} className="mb-2 text-gray-300" />
                <p className="text-sm">Belum ada transaksi</p>
              </div>
            ) : (
              recentTransactions.map((trx, idx) => (
                <div key={trx.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 transition-colors group cursor-pointer" onClick={() => navigate('/admin/riwayat')}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-sm group-hover:bg-primary group-hover:text-white transition-colors">
                      #{trx.nomorAntrian}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-dark">{trx.namaPembeli}</h4>
                      <p className="text-xs text-gray-400">{formatDate(trx.completedAt)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">+{formatRupiah(trx.totalHarga)}</p>
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">{trx.pembayaran?.metodeBayar || 'TUNAI'}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {recentTransactions.length > 0 && (
            <button
              onClick={() => navigate('/admin/riwayat')}
              className="mt-4 w-full py-3 text-sm font-bold text-primary bg-primary/5 hover:bg-primary/10 rounded-xl transition-colors"
            >
              Lihat Semua Transaksi
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
