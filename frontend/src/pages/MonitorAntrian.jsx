import React, { useState, useEffect, useCallback } from 'react';
import { 
  ListOrdered, Clock, CheckCircle2, ArrowRight, 
  RefreshCw, User, Timer, Package
} from 'lucide-react';
import Button from '../components/ui/Button';
import api from '../services/api';

const MonitorAntrian = () => {
  const [antrian, setAntrian] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchAntrian = useCallback(async () => {
    try {
      const res = await api.get('/pesanan/antrian');
      setAntrian(res.data);
    } catch (err) {
      console.error('Error fetching antrian:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAntrian();
    // Auto-refresh setiap 10 detik
    const interval = setInterval(fetchAntrian, 10000);
    return () => clearInterval(interval);
  }, [fetchAntrian]);

  const handleSelesai = async (id) => {
    setUpdatingId(id);
    try {
      await api.put(`/pesanan/${id}/status`);
      fetchAntrian();
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const formatRupiah = (num) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  // Hitung durasi menunggu
  const getWaitTime = (enteredAt) => {
    if (!enteredAt) return '-';
    const diff = Math.floor((Date.now() - new Date(enteredAt).getTime()) / 60000);
    if (diff < 1) return 'Baru saja';
    return `${diff} menit`;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-dark">Monitor Antrian</h1>
          <p className="text-gray-400 text-sm mt-1">Kelola pesanan berdasarkan urutan FIFO (First In, First Out)</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-full text-yellow-700 text-sm font-medium">
            <Clock size={16} />
            <span>{antrian.length} antrian aktif</span>
          </div>
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={() => { setIsLoading(true); fetchAntrian(); }}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Queue Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : antrian.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-300">
          <ListOrdered size={56} className="mb-4" />
          <p className="text-lg font-medium text-gray-400">Tidak ada antrian saat ini</p>
          <p className="text-sm text-gray-300 mt-1">Semua pesanan sudah selesai diproses</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {antrian.map((item, index) => (
            <div 
              key={item.id} 
              className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-300 ${
                index === 0 ? 'border-primary/30 ring-2 ring-primary/10' : 'border-gray-100'
              }`}
            >
              <div className="flex items-stretch">
                {/* Queue Number */}
                <div className={`w-28 flex flex-col items-center justify-center py-6 ${
                  index === 0 ? 'bg-primary/10' : 'bg-gray-50'
                }`}>
                  <span className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">Antrian</span>
                  <span className={`text-4xl font-bold ${index === 0 ? 'text-primary' : 'text-dark'}`}>
                    {item.nomorAntrian}
                  </span>
                  {index === 0 && (
                    <span className="mt-2 px-2 py-0.5 bg-primary text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                      Selanjutnya
                    </span>
                  )}
                </div>

                {/* Order Details */}
                <div className="flex-1 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <User size={16} className="text-gray-400" />
                        <h3 className="font-bold text-dark">{item.namaPembeli}</h3>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> Masuk: {formatTime(item.enteredAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Timer size={12} /> Menunggu: {getWaitTime(item.enteredAt)}
                        </span>
                      </div>
                    </div>
                    <span className="font-bold text-dark">{formatRupiah(item.totalHarga)}</span>
                  </div>

                  {/* Item list */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {item.detailPesanan?.map((detail, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 rounded-lg text-xs text-gray-600">
                        <Package size={12} className="text-gray-400" />
                        {detail.produk?.namaProduk} x{detail.jumlah}
                      </span>
                    ))}
                  </div>

                  {/* Action */}
                  <Button
                    variant={index === 0 ? 'primary' : 'outline'}
                    size="sm"
                    icon={CheckCircle2}
                    isLoading={updatingId === item.id}
                    onClick={() => handleSelesai(item.id)}
                  >
                    Tandai Selesai
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MonitorAntrian;
