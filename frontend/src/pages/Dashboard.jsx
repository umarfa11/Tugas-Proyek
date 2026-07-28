import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  Soup, ShoppingCart, ListOrdered, History, ArrowRight, TrendingUp, DollarSign, Activity, ChevronDown, SlidersHorizontal
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
  const [chartFilter, setChartFilter] = useState('tahunan');
  const [rawRiwayat, setRawRiwayat] = useState([]);

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

        // --- Save raw data for filtering ---
        setRawRiwayat(riwayat);

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

  useEffect(() => {
    if (!rawRiwayat || rawRiwayat.length === 0) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (chartFilter === 'mingguan') {
      const weeklyData = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
        weeklyData.push({
          name: dayNames[d.getDay()],
          fullDate: d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
          total: 0,
          dateValue: d.getTime()
        });
      }

      rawRiwayat.forEach(item => {
        const itemDate = new Date(item.completedAt);
        itemDate.setHours(0, 0, 0, 0);
        const target = weeklyData.find(w => w.dateValue === itemDate.getTime());
        if (target) {
          target.total += Number(item.totalHarga);
        }
      });
      setChartData(weeklyData);

    } else if (chartFilter === 'bulanan') {
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const monthlyData = [];
      for (let i = 1; i <= daysInMonth; i++) {
        monthlyData.push({
          name: i.toString(),
          fullDate: `${i} ${new Date(currentYear, currentMonth, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`,
          total: 0,
          dateValue: i
        });
      }

      rawRiwayat.forEach(item => {
        const itemDate = new Date(item.completedAt);
        if (itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear) {
          monthlyData[itemDate.getDate() - 1].total += Number(item.totalHarga);
        }
      });
      setChartData(monthlyData);

    } else if (chartFilter === 'tahunan') {
      const currentYear = today.getFullYear();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
      const fullMonthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      const yearlyData = monthNames.map((name, index) => ({
        monthIndex: index,
        name: name,
        fullDate: `${fullMonthNames[index]} ${currentYear}`,
        total: 0
      }));

      rawRiwayat.forEach(item => {
        const itemDate = new Date(item.completedAt);
        if (itemDate.getFullYear() === currentYear) {
          yearlyData[itemDate.getMonth()].total += Number(item.totalHarga);
        }
      });
      setChartData(yearlyData);
    }
  }, [chartFilter, rawRiwayat]);

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
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-dark mb-1">Dashboard Overview</h1>
          <p className="text-sm text-gray-500">
            Ringkasan performa dan aktivitas Kasir Baksoku hari ini
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white border border-gray-200 text-dark rounded-full text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2">
            Hari Ini <ChevronDown size={16} className="text-gray-400" />
          </button>
          <button className="px-4 py-2 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm shadow-primary/30">
            <SlidersHorizontal size={16} /> Filter
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">

        {/* Card 1: Pendapatan */}
        <div
          onClick={() => navigate('/admin/riwayat')}
          className="bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Total Pendapatan</p>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-3xl font-bold text-dark tracking-tight">{formatRupiah(stats.pendapatanHariIni)}</h3>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-green-50 text-green-600 px-2 py-1 rounded-md">
                <TrendingUp size={12} /> +12.5%
              </span>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center shrink-0">
              <DollarSign size={22} className="text-green-500" />
            </div>
          </div>
        </div>

        {/* Card 2: Transaksi */}
        <div
          onClick={() => navigate('/admin/pesanan')}
          className="bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Total Pesanan</p>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-3xl font-bold text-dark tracking-tight">{stats.transaksiHariIni}</h3>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded-md">
                <TrendingUp size={12} /> +8.2%
              </span>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              <ShoppingCart size={22} className="text-blue-500" />
            </div>
          </div>
        </div>

        {/* Card 3: Antrian */}
        <div
          onClick={() => navigate('/admin/antrian')}
          className="bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Antrian Aktif</p>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-3xl font-bold text-dark tracking-tight">{stats.antrian}</h3>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-yellow-50 text-yellow-600 px-2 py-1 rounded-md">
                <Activity size={12} /> Live
              </span>
            </div>
            <div className="w-12 h-12 rounded-full bg-yellow-50 flex items-center justify-center shrink-0">
              <ListOrdered size={22} className="text-yellow-500" />
            </div>
          </div>
        </div>

        {/* Card 4: Produk */}
        <div
          onClick={() => navigate('/admin/produk')}
          className="bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Total Produk Menu</p>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-3xl font-bold text-dark tracking-tight">{stats.produk}</h3>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-purple-50 text-purple-600 px-2 py-1 rounded-md">
                <Soup size={12} /> Active
              </span>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
              <Soup size={22} className="text-purple-500" />
            </div>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Chart Area */}
        <div className="lg:col-span-2 bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-dark">Performance Overview</h2>
            </div>
            <div className="relative">
              <select 
                value={chartFilter}
                onChange={(e) => setChartFilter(e.target.value)}
                className="appearance-none px-4 py-1.5 pr-8 bg-gray-50 border border-gray-100 text-dark rounded-full text-xs font-medium hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value="mingguan">Mingguan</option>
                <option value="bulanan">Bulanan</option>
                <option value="tahunan">Tahunan</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                <ChevronDown size={14} className="text-gray-400" />
              </div>
            </div>
          </div>

          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
                  tickFormatter={(value) => `Rp${value / 1000}k`}
                  width={60}
                />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px 16px' }}
                  labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}
                  formatter={(value) => [formatRupiah(value), "Pendapatan"]}
                  labelFormatter={(label, payload) => {
                    if (payload && payload.length > 0) {
                      return payload[0].payload.fullDate;
                    }
                    return label;
                  }}
                />
                <Bar 
                  dataKey="total" 
                  fill="#FF6B6B"
                  radius={[6, 6, 6, 6]} 
                  barSize={32}
                  background={{ fill: '#f1f5f9', radius: [6, 6, 6, 6] }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity List */}
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
