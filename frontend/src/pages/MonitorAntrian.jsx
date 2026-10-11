import React, { useState, useEffect, useCallback } from 'react';
import { 
  ListOrdered, Clock, CheckCircle2, 
  RefreshCw, User, Timer, Soup, MessageCircle, Smartphone, Phone,
  Check, Utensils
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
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {antrian.map((item, index) => (
            <div 
              key={item.id} 
              className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md ${
                index === 0 ? 'border-primary/50 ring-2 ring-primary/20' : 'border-gray-200'
              }`}
            >
              {/* 1. NOMOR ANTRIAN & STATUS HEADER */}
              <div className={`px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b ${
                index === 0 ? 'bg-primary/5 border-primary/20' : 'bg-gray-50/80 border-gray-100'
              }`}>
                <div className="flex items-center gap-3">
                  {/* Badge Nomor Antrian */}
                  <div className={`px-3.5 py-1.5 rounded-xl font-black text-xl flex items-center gap-1.5 shadow-xs ${
                    index === 0 ? 'bg-primary text-white' : 'bg-gray-800 text-white'
                  }`}>
                    <span className="text-[11px] font-semibold uppercase tracking-wider opacity-80">Antrian</span>
                    <span>#{item.nomorAntrian}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {index === 0 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                        🔥 Sedang Diproses (Giliran #1)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
                        Urutan ke-{index + 1}
                      </span>
                    )}

                    {/* Tipe Pesanan */}
                    {item.tipePesanan === 'online' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        <Smartphone size={12} /> Order Online (QRIS)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                        Kasir POS (Offline)
                      </span>
                    )}
                  </div>
                </div>

                {/* Waktu Masuk & Durasi Menunggu */}
                <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                  <span className="flex items-center gap-1" title="Jam Masuk Pesanan">
                    <Clock size={13} className="text-gray-400" /> {formatTime(item.enteredAt)}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1" title="Lama Waktu Menunggu">
                    <Timer size={13} className="text-gray-400" /> {getWaitTime(item.enteredAt)}
                  </span>
                </div>
              </div>

              {/* BODY: INFORMASI PEMBELI & DETAIL PRODUK */}
              <div className="p-5 space-y-4">
                {/* 2. INFORMASI PEMBELI (NAMA & NOMOR HP) */}
                <div className="bg-slate-50/90 rounded-xl p-3.5 border border-slate-200/70 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Nama Pembeli */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-primary shrink-0 shadow-2xs mt-0.5">
                      <User size={16} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                        Nama Pembeli
                      </span>
                      <span className="text-base font-extrabold text-gray-900 block truncate" title={item.namaPembeli}>
                        {item.namaPembeli || 'Pelanggan'}
                      </span>
                    </div>
                  </div>

                  {/* Nomor HP Pembeli */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-emerald-600 shrink-0 shadow-2xs mt-0.5">
                      <Phone size={16} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                        Nomor HP / WhatsApp
                      </span>
                      {item.nomorHp ? (
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-sm font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                            {item.nomorHp}
                          </span>
                          <button 
                            onClick={() => handleKirimWA(item)}
                            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline inline-flex items-center gap-1 cursor-pointer"
                            title="Buka Chat WhatsApp"
                          >
                            <MessageCircle size={13} /> Chat WA
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-gray-400 italic block mt-0.5">
                          Tidak ada (Pesanan Offline)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. RINCIAN PRODUK APA SAJA YANG DIBELI */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Utensils size={14} className="text-primary" /> Rincian Produk yang Dibeli
                    </span>
                    <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded-md">
                      Total: {item.detailPesanan?.reduce((sum, d) => sum + d.jumlah, 0) || 0} Porsi
                    </span>
                  </div>

                  {/* List / Tabel Produk */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 bg-white shadow-2xs">
                    {item.detailPesanan?.map((detail, idx) => (
                      <div key={idx} className="p-3 sm:px-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-[11px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <span className="font-bold text-gray-900 text-sm block truncate">
                              {detail.produk?.namaProduk || 'Menu Produk'}
                            </span>
                            <span className="text-[11px] text-gray-400 font-medium">
                              @ {formatRupiah(detail.produk?.harga || (detail.subtotal / detail.jumlah))}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-black">
                            {detail.jumlah} Porsi
                          </span>
                          <span className="font-bold text-gray-900 text-sm w-24 text-right">
                            {formatRupiah(detail.subtotal)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* TOTAL TAGIHAN & STATUS PEMBAYARAN */}
                  <div className="mt-3 flex items-center justify-between px-3.5 py-2.5 bg-gray-50 rounded-xl border border-gray-200/80">
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                        Total Tagihan
                      </span>
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <Check size={13} /> Lunas (Pembayaran Berhasil)
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg sm:text-xl font-black text-primary">
                        {formatRupiah(item.totalHarga)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. ACTIONS */}
                <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-gray-100 flex-wrap">
                  {item.nomorHp && (
                    <button
                      onClick={() => handleKirimWA(item)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
                      title="Kirim Pesan WhatsApp Selesai ke Pelanggan"
                    >
                      <MessageCircle size={14} />
                      <span>Kirim WA</span>
                    </button>
                  )}
                  <Button
                    variant={index === 0 ? 'primary' : 'outline'}
                    size="sm"
                    icon={CheckCircle2}
                    isLoading={updatingId === item.id}
                    onClick={() => handleSelesai(item)}
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
