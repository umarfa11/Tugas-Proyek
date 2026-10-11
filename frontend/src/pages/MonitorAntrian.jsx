import React, { useState, useEffect, useCallback } from 'react';
import { 
  ListOrdered, Clock, CheckCircle2, ArrowRight, 
  RefreshCw, User, Timer, Soup, MessageCircle, Smartphone
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

  const formatWaNumber = (phone) => {
    if (!phone) return '';
    let clean = String(phone).replace(/\D/g, '');
    if (clean.startsWith('0')) clean = '62' + clean.slice(1);
    else if (clean.startsWith('8')) clean = '62' + clean;
    return clean;
  };

  const handleKirimWA = (item) => {
    const waNumber = formatWaNumber(item.nomorHp);
    if (!waNumber) {
      alert('Nomor WhatsApp pelanggan tidak tersedia');
      return;
    }

    const itemsText = item.detailPesanan?.map(d => `• ${d.produk?.namaProduk} x${d.jumlah}`).join('\n') || '';
    const pesan = `Halo Kak *${item.namaPembeli}*! 👋\n\n` +
      `Pesanan Anda di *KASIR BAKSOKU* dengan *Nomor Antrean #${item.nomorAntrian}* sudah *SELESAI* dan siap disajikan/diambil! 🍜✨\n\n` +
      `*Rincian Menu:*\n${itemsText}\n\n` +
      `*Total Bayar:* ${formatRupiah(item.totalHarga)} (Lunas QRIS)\n\n` +
      `Silakan tunjukkan pesan ini di konter pengambilan. Terima kasih sudah memesan di Kasir Baksoku! 🙏`;

    const url = `https://wa.me/${waNumber}?text=${encodeURIComponent(pesan)}`;
    window.open(url, '_blank');
  };

  const handleSelesai = async (item) => {
    setUpdatingId(item.id);
    try {
      await api.put(`/pesanan/${item.id}/status`);
      fetchAntrian();

      // Jika pesanan online dan ada nomor HP, tawarkan langsung kirim notifikasi WA
      if (item.nomorHp) {
        const confirmWa = window.confirm(`Pesanan #${item.nomorAntrian} selesai! Buka WhatsApp untuk kirim notifikasi ke ${item.namaPembeli}?`);
        if (confirmWa) {
          handleKirimWA(item);
        }
      }
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {antrian.map((item, index) => (
            <div 
              key={item.id} 
              className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-300 ${
                index === 0 ? 'border-primary/30 ring-2 ring-primary/10' : 'border-gray-100'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-stretch">
                {/* Queue Number */}
                <div className={`w-full sm:w-28 flex flex-col items-center justify-center py-4 sm:py-6 ${
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
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <User size={16} className="text-gray-400 shrink-0" />
                        <h3 className="font-bold text-dark">{item.namaPembeli}</h3>
                        {item.tipePesanan === 'online' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200">
                            <Smartphone size={10} /> Online
                          </span>
                        )}
                        {item.nomorHp && (
                          <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                            WA: {item.nomorHp}
                          </span>
                        )}
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
                        <Soup size={12} className="text-gray-400" />
                        {detail.produk?.namaProduk} x{detail.jumlah}
                      </span>
                    ))}
                  </div>

                  {/* Action */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      variant={index === 0 ? 'primary' : 'outline'}
                      size="sm"
                      icon={CheckCircle2}
                      isLoading={updatingId === item.id}
                      onClick={() => handleSelesai(item)}
                    >
                      Tandai Selesai
                    </Button>
                    {item.nomorHp && (
                      <button
                        onClick={() => handleKirimWA(item)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
                        title="Kirim Pesan Notifikasi WhatsApp"
                      >
                        <MessageCircle size={14} />
                        <span>Kirim WA</span>
                      </button>
                    )}
                  </div>
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
