import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  Package, ShoppingCart, ListOrdered, History, ArrowRight, TrendingUp, DollarSign, Activity
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
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark mb-2">Ikhtisar Bisnis, {user?.nama}! 👋</h1>
        <p className="text-gray-500">
          Pantau performa <span className="font-semibold text-primary">KASIR BAKSOKU</span> secara real-time hari ini.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        
        {/* Card 1: Pendapatan */}
        <div 
          onClick={() => navigate('/admin/riwayat')}
          className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group cursor-pointer hover:shadow-md transition-all"
        >
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-green-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out z-0"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center">
                <DollarSign size={24} />
              </div>
              <ArrowRight size={20} className="text-gray-300 group-hover:text-green-500 transition-colors" />
            </div>
            <p className="text-gray-400 text-sm font-medium mb-1">Pendapatan Hari Ini</p>
            <h3 className="text-2xl font-bold text-dark">{formatRupiah(stats.pendapatanHariIni)}</h3>
          </div>
        </div>

        {/* Card 2: Transaksi */}
        <div 
          onClick={() => navigate('/admin/pesanan')}
          className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group cursor-pointer hover:shadow-md transition-all"
        >
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out z-0"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <ShoppingCart size={24} />
              </div>
              <ArrowRight size={20} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
            </div>
            <p className="text-gray-400 text-sm font-medium mb-1">Total Transaksi (Hari Ini)</p>
            <h3 className="text-2xl font-bold text-dark">{stats.transaksiHariIni} <span className="text-sm font-normal text-gray-400">Pesanan</span></h3>
          </div>
        </div>

        {/* Card 3: Antrian */}
        <div 
          onClick={() => navigate('/admin/antrian')}
          className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group cursor-pointer hover:shadow-md transition-all"
        >
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-yellow-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out z-0"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-yellow-100 text-yellow-600 flex items-center justify-center">
                <ListOrdered size={24} />
              </div>
              <ArrowRight size={20} className="text-gray-300 group-hover:text-yellow-500 transition-colors" />
            </div>
            <p className="text-gray-400 text-sm font-medium mb-1">Antrian Aktif</p>
            <h3 className="text-2xl font-bold text-dark">{stats.antrian} <span className="text-sm font-normal text-gray-400">Menunggu</span></h3>
          </div>
        </div>

        {/* Card 4: Produk */}
        <div 
          onClick={() => navigate('/admin/produk')}
          className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group cursor-pointer hover:shadow-md transition-all"
        >
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out z-0"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center">
                <Package size={24} />
              </div>
              <ArrowRight size={20} className="text-gray-300 group-hover:text-purple-500 transition-colors" />
            </div>
            <p className="text-gray-400 text-sm font-medium mb-1">Total Produk Menu</p>
            <h3 className="text-2xl font-bold text-dark">{stats.produk} <span className="text-sm font-normal text-gray-400">Item</span></h3>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Chart Area */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-dark">Grafik Penjualan</h2>
              <p className="text-sm text-gray-400">Tren pendapatan bulanan tahun ini</p>
            </div>
            <div className="p-2 bg-primary/10 rounded-xl">
              <TrendingUp size={20} className="text-primary" />
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6B6B" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FF6B6B" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
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
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}
                  formatter={(value) => [formatRupiah(value), "Pendapatan"]}
                  labelFormatter={(label, payload) => {
                    if (payload && payload.length > 0) {
                      return payload[0].payload.fullDate;
                    }
                    return label;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#FF6B6B" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorTotal)" 
                  activeDot={{ r: 6, fill: '#FF6B6B', stroke: '#fff', strokeWidth: 3 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity List */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-dark">Aktivitas Terkini</h2>
              <p className="text-sm text-gray-400">Transaksi terbaru</p>
            </div>
            <div className="p-2 bg-blue-50 rounded-xl">
              <Activity size={20} className="text-blue-500" />
            </div>
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
