import React, { useState, useEffect } from 'react';
import { 
  Search, ShoppingCart, Plus, Minus, Trash2, User, 
  Banknote, QrCode, Package, ArrowRight, X, CheckCircle2,
  Utensils, Coffee, CakeSlice, MoreHorizontal, Receipt
} from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Struk from '../components/Struk';
import api from '../services/api';

const InputPesanan = () => {
  // Product data
  const [produkList, setProdukList] = useState([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [isLoadingProduk, setIsLoadingProduk] = useState(true);

  // Cart (Persisted in localStorage so it's not lost on navigation)
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('bakso_draft_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [namaPembeli, setNamaPembeli] = useState(() => {
    return localStorage.getItem('bakso_draft_name') || '';
  });

  // Save drafts when they change
  useEffect(() => {
    localStorage.setItem('bakso_draft_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('bakso_draft_name', namaPembeli);
  }, [namaPembeli]);

  // Payment
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [metodeBayar, setMetodeBayar] = useState('tunai');
  const [nominalDiterima, setNominalDiterima] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Receipt
  const [strukData, setStrukData] = useState(null);
  const [isStrukOpen, setIsStrukOpen] = useState(false);

  // Fetch products
  useEffect(() => {
    const fetchProduk = async () => {
      setIsLoadingProduk(true);
      try {
        const res = await api.get('/produk');
        setProdukList(res.data);
      } catch (err) {
        console.error('Error fetching produk:', err);
      } finally {
        setIsLoadingProduk(false);
      }
    };
    fetchProduk();
  }, []);

  // Filter
  const filteredProduk = produkList.filter(p => {
    const matchSearch = p.namaProduk.toLowerCase().includes(search.toLowerCase());
    const matchCategory = activeCategory === 'Semua' || p.kategori === activeCategory;
    return matchSearch && matchCategory;
  });

  // Cart operations
  const addToCart = (produk) => {
    setCart(prev => {
      const existing = prev.find(item => item.produkId === produk.id);
      if (existing) {
        if (existing.jumlah >= produk.stok) return prev;
        return prev.map(item =>
          item.produkId === produk.id
            ? { ...item, jumlah: item.jumlah + 1, subtotal: (item.jumlah + 1) * Number(produk.harga) }
            : item
        );
      }
      return [...prev, {
        produkId: produk.id,
        namaProduk: produk.namaProduk,
        harga: Number(produk.harga),
        jumlah: 1,
        subtotal: Number(produk.harga),
        stok: produk.stok
      }];
    });
  };

  const updateQty = (produkId, delta) => {
    setCart(prev =>
      prev.map(item => {
        if (item.produkId !== produkId) return item;
        const newQty = item.jumlah + delta;
        if (newQty < 1) return item;
        if (newQty > item.stok) return item;
        return { ...item, jumlah: newQty, subtotal: newQty * item.harga };
      })
    );
  };

  const removeFromCart = (produkId) => {
    setCart(prev => prev.filter(item => item.produkId !== produkId));
  };

  const totalHarga = cart.reduce((sum, item) => sum + item.subtotal, 0);

  // Format currency
  const formatRupiah = (num) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  // Open payment modal
  const handleOpenPayment = () => {
    if (!namaPembeli.trim()) return;
    if (cart.length === 0) return;
    setPaymentError('');
    setNominalDiterima('');
    setMetodeBayar('tunai');
    setIsPaymentOpen(true);
  };

  // Submit order
  const handleSubmitOrder = async () => {
    setPaymentError('');

    if (metodeBayar === 'tunai') {
      const nominal = Number(nominalDiterima);
      if (!nominal || nominal < totalHarga) {
        setPaymentError('Nominal uang tidak mencukupi');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        namaPembeli: namaPembeli.trim(),
        items: cart.map(item => ({ produkId: item.produkId, jumlah: item.jumlah })),
        metodeBayar,
        nominalDiterima: metodeBayar === 'tunai' ? Number(nominalDiterima) : totalHarga,
      };
      const res = await api.post('/pesanan', payload);
      setStrukData({
        ...res.data.pesanan,
        kembalian: metodeBayar === 'tunai' ? Number(nominalDiterima) - totalHarga : 0,
        nominalDiterima: metodeBayar === 'tunai' ? Number(nominalDiterima) : totalHarga,
        cartItems: cart,
      });
      setIsPaymentOpen(false);
      setIsStrukOpen(true);

      // Reset
      setCart([]);
      setNamaPembeli('');
      localStorage.removeItem('bakso_draft_cart');
      localStorage.removeItem('bakso_draft_name');
      // Refresh product list for updated stock
      const updatedProduk = await api.get('/produk');
      setProdukList(updatedProduk.data);
    } catch (err) {
      setPaymentError(err.response?.data?.message || 'Gagal membuat pesanan');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick denomination buttons for cash
  const denominations = [10000, 20000, 50000, 100000];

  // Category Icons & Colors mapping
  const getCategoryMeta = (cat) => {
    switch (cat) {
      case 'Makanan': return { icon: Utensils, color: 'text-primary', bg: 'bg-primary/10', cardBg: 'bg-white', border: 'border-gray-100 hover:border-primary/30' };
      case 'Minuman': return { icon: Coffee, color: 'text-secondary', bg: 'bg-secondary/10', cardBg: 'bg-white', border: 'border-gray-100 hover:border-secondary/30' };
      case 'Dessert': return { icon: CakeSlice, color: 'text-primary', bg: 'bg-primary/10', cardBg: 'bg-white', border: 'border-gray-100 hover:border-primary/30' };
      case 'Lainnya': return { icon: MoreHorizontal, color: 'text-secondary', bg: 'bg-secondary/10', cardBg: 'bg-white', border: 'border-gray-100 hover:border-secondary/30' };
      default: return { icon: Package, color: 'text-dark', bg: 'bg-gray-100', cardBg: 'bg-white', border: 'border-gray-100 hover:border-gray-300' };
    }
  };

  return (
    <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-6rem)] gap-6">
      {/* ===== LEFT: Product Grid ===== */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-dark tracking-tight mb-1">Kasir POS</h1>
          <p className="text-gray-400 text-sm">Pilih menu pesanan pelanggan dengan cepat</p>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="w-full sm:max-w-xs">
            <Input icon={Search} placeholder="Cari menu bakso..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          
          {/* Category Tabs (Pill style) */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide w-full sm:w-auto py-1">
            {['Semua', 'Makanan', 'Minuman', 'Dessert', 'Lainnya'].map((cat) => {
              const meta = getCategoryMeta(cat);
              const Icon = cat === 'Semua' ? Package : meta.icon;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-300 ${
                    activeCategory === cat 
                      ? 'bg-gradient-to-r from-primary to-rose-400 text-white shadow-md shadow-primary/30 border-transparent' 
                      : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'
                  }`}
                >
                  <Icon size={16} className={activeCategory === cat ? 'text-white' : meta.color} />
                  {cat}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 pb-6">
          {isLoadingProduk ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
              <p className="text-gray-400 font-medium">Memuat menu...</p>
            </div>
          ) : filteredProduk.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 bg-white/50 rounded-3xl border border-dashed border-gray-200">
              <Package size={48} className="mb-3 text-gray-300" />
              <span className="font-medium text-lg">Menu tidak ditemukan</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pt-3 pr-3">
              {filteredProduk.map(produk => {
                const inCart = cart.find(c => c.produkId === produk.id);
                const isOutOfStock = produk.stok <= 0;
                const meta = getCategoryMeta(produk.kategori);
                const Icon = meta.icon;
                
                return (
                  <button
                    key={produk.id}
                    onClick={() => !isOutOfStock && addToCart(produk)}
                    disabled={isOutOfStock}
                    className={`relative flex flex-col text-left rounded-3xl border overflow-hidden transition-all duration-300 group
                      ${isOutOfStock
                        ? 'bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed grayscale'
                        : `bg-white border-gray-100 hover:border-primary/30 hover:shadow-xl hover:-translate-y-1 cursor-pointer`
                      }
                    `}
                  >
                    {inCart && (
                      <div className="absolute top-3 right-3 w-8 h-8 bg-dark text-white text-sm font-black rounded-full flex items-center justify-center shadow-lg ring-2 ring-white animate-fade-in z-20">
                        {inCart.jumlah}
                      </div>
                    )}
                    
                    {/* Image Header */}
                    <div className="relative w-full h-40 sm:h-48 bg-gray-50 overflow-hidden shrink-0">
                      {produk.gambar ? (
                        <img 
                          src={`http://localhost:5000/uploads/${produk.gambar}`} 
                          alt={produk.namaProduk}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center ${meta.bg} transition-transform duration-700 group-hover:scale-110`}>
                          <Icon size={48} className={`${meta.color} opacity-40`} />
                        </div>
                      )}
                      
                      <div className="absolute top-3 left-3 z-10">
                        <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full shadow-sm backdrop-blur-md ${isOutOfStock ? 'bg-red-500/90 text-white' : 'bg-white/90 text-gray-700'}`}>
                          Sisa {produk.stok}
                        </span>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="p-4 flex-1 flex flex-col w-full">
                      <h3 className="font-bold text-dark text-base leading-tight mb-1 group-hover:text-primary transition-colors line-clamp-2">{produk.namaProduk}</h3>
                      <p className="text-gray-500 font-medium text-xs mb-3">{produk.kategori || 'Makanan'}</p>
                      
                      <div className="flex items-center justify-between mt-auto pt-2">
                        <p className="text-dark font-black text-lg">{formatRupiah(produk.harga)}</p>
                        {!isOutOfStock && (
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                            <Plus size={18} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ===== RIGHT: Digital Receipt Cart ===== */}
      <div id="cart-section" className="w-full lg:w-96 lg:min-w-[384px] shrink-0 bg-gradient-to-br from-white to-gray-50/80 rounded-2xl shadow-sm flex flex-col relative overflow-hidden border border-gray-100 mt-4 lg:mt-0">
        
        {/* Cart Header */}
        <div className="px-5 py-4 text-center border-b border-gray-100">
          <div className="inline-flex items-center justify-center w-10 h-10 bg-primary/10 rounded-xl text-primary mb-2">
            <Receipt size={20} />
          </div>
          <h2 className="font-bold text-lg text-dark">Pesanan Baru</h2>
          <p className="text-xs text-gray-400 font-medium">{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        {/* Buyer Name */}
        <div className="px-5 py-3 border-b border-gray-50 bg-gray-50/30">
          <Input
            icon={User}
            placeholder="Nama pembeli..."
            value={namaPembeli}
            onChange={(e) => setNamaPembeli(e.target.value)}
          />
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-300">
              <ShoppingCart size={40} className="mb-2" />
              <p className="text-sm font-medium">Belum ada pesanan</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.produkId} className="flex flex-col gap-2 p-3 bg-white border border-gray-100 rounded-xl hover:border-primary/30 transition-colors group">
                <div className="flex justify-between items-start">
                  <p className="font-bold text-dark text-sm leading-tight pr-4">{item.namaProduk}</p>
                  <button onClick={() => removeFromCart(item.produkId)} className="text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-lg">
                    {formatRupiah(item.harga)}
                  </p>
                  
                  <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-1 border border-gray-100">
                    <button
                      onClick={() => updateQty(item.produkId, -1)}
                      className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center text-dark hover:bg-gray-200 transition-colors active:scale-95"
                    >
                      <Minus size={14} strokeWidth={3} />
                    </button>
                    <span className="w-4 text-center text-sm font-black text-dark">{item.jumlah}</span>
                    <button
                      onClick={() => updateQty(item.produkId, 1)}
                      className="w-7 h-7 rounded-lg bg-dark shadow-sm flex items-center justify-center text-white hover:bg-black transition-colors active:scale-95"
                    >
                      <Plus size={14} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Footer */}
        <div className="border-t border-gray-100 p-5 bg-white mt-auto">
          <div className="flex justify-between items-center mb-4">
            <div>
              <span className="text-gray-500 font-medium block">Total Bayar</span>
              <span className="text-xs text-gray-400">{cart.reduce((s, i) => s + i.jumlah, 0)} Item</span>
            </div>
            <span className="text-2xl font-bold text-primary">{formatRupiah(totalHarga)}</span>
          </div>
          <button
            disabled={cart.length === 0 || !namaPembeli.trim()}
            onClick={handleOpenPayment}
            className={`w-full py-3 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-200
              ${cart.length === 0 || !namaPembeli.trim()
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-primary to-rose-400 text-white shadow-md shadow-primary/20 hover:shadow-lg hover:-translate-y-0.5'
              }
            `}
          >
            Lanjut Bayar
            <ArrowRight size={20} />
          </button>
        </div>
      </div>

      {/* ===== Payment Modal ===== */}
      <Modal isOpen={isPaymentOpen} onClose={() => setIsPaymentOpen(false)} title="Selesaikan Pembayaran" size="md">
        <div className="space-y-6">
          {paymentError && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm font-bold flex items-center gap-2">
              <X size={18} /> {paymentError}
            </div>
          )}

          {/* Order Summary */}
          <div className="bg-dark rounded-3xl p-6 text-white relative overflow-hidden shadow-lg">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
            <div className="relative z-10 space-y-3">
              <div className="flex justify-between text-sm items-center">
                <span className="text-gray-400 font-medium">Pelanggan</span>
                <span className="font-bold bg-white/10 px-3 py-1 rounded-full">{namaPembeli}</span>
              </div>
              <div className="border-t border-white/10 my-1" />
              <div className="flex justify-between items-end">
                <span className="text-gray-300 font-medium">Total Bayar</span>
                <span className="font-black text-primary text-3xl">{formatRupiah(totalHarga)}</span>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="text-sm font-bold text-dark mb-3 block">Pilih Metode Pembayaran</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setMetodeBayar('tunai')}
                className={`flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 transition-all active:scale-95 ${
                  metodeBayar === 'tunai'
                    ? 'border-dark bg-dark text-white shadow-xl'
                    : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Banknote size={32} />
                <span className="font-black">TUNAI</span>
              </button>
              <button
                onClick={() => setMetodeBayar('qris')}
                className={`flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 transition-all active:scale-95 ${
                  metodeBayar === 'qris'
                    ? 'border-[#00569C] bg-[#00569C] text-white shadow-xl shadow-[#00569C]/30'
                    : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200 hover:bg-gray-50'
                }`}
              >
                <QrCode size={32} />
                <span className="font-black">QRIS</span>
              </button>
            </div>
          </div>

          {/* Cash Input */}
          {metodeBayar === 'tunai' && (
            <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100">
              <label className="text-sm font-bold text-dark mb-2 block">Uang Diterima (Rp)</label>
              <input
                type="number"
                placeholder="0"
                value={nominalDiterima}
                onChange={(e) => setNominalDiterima(e.target.value)}
                className="w-full bg-white border-2 border-gray-200 rounded-2xl px-5 py-4 text-2xl font-black text-dark text-center focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all mb-4"
              />
              <div className="grid grid-cols-2 gap-3">
                {denominations.map(d => (
                  <button
                    key={d}
                    onClick={() => setNominalDiterima(String(d))}
                    className="py-3 text-sm font-bold rounded-xl border-2 border-gray-200 text-gray-600 bg-white hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors active:scale-95"
                  >
                    {formatRupiah(d)}
                  </button>
                ))}
              </div>
              
              {/* Change Indicator */}
              {nominalDiterima && Number(nominalDiterima) >= totalHarga && (
                <div className="mt-5 p-4 rounded-2xl bg-green-50 border-2 border-green-200 flex justify-between items-center animate-fade-in">
                  <span className="text-green-700 font-bold text-sm">Kembalian</span>
                  <span className="font-black text-green-700 text-xl">
                    {formatRupiah(Number(nominalDiterima) - totalHarga)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* QRIS Placeholder */}
          {metodeBayar === 'qris' && (
            <div className="text-center p-8 bg-gray-50 rounded-3xl border border-gray-100">
              <div className="w-48 h-48 mx-auto bg-white rounded-3xl flex items-center justify-center mb-4 shadow-sm border border-gray-200 relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-50/50 animate-pulse"></div>
                <QrCode size={80} className="text-[#00569C] relative z-10" />
              </div>
              <p className="text-sm font-bold text-dark mb-1">Menunggu Scan QRIS</p>
              <p className="text-xs text-gray-500">Minta pelanggan scan barcode toko Anda</p>
            </div>
          )}

          {/* Submit */}
          <button
            disabled={isSubmitting}
            onClick={handleSubmitOrder}
            className="w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-rose-500 text-white hover:shadow-xl hover:shadow-primary/40 transition-all active:scale-95 disabled:opacity-70 hover:-translate-y-0.5"
          >
            {isSubmitting ? (
              <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 size={24} strokeWidth={3} />
                CETAK STRUK
              </>
            )}
          </button>
        </div>
      </Modal>

      {/* ===== Receipt Modal ===== */}
      <Modal isOpen={isStrukOpen} onClose={() => setIsStrukOpen(false)} title="Struk Berhasil Dicetak" size="sm">
        {strukData && <Struk data={strukData} onClose={() => setIsStrukOpen(false)} />}
      </Modal>
      {/* Floating Mobile Cart Button */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-6 right-6 z-30 animate-fade-in">
          <button
            onClick={() => {
              document.getElementById('cart-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="bg-primary text-white p-4 rounded-full shadow-2xl shadow-primary/40 flex items-center justify-center relative active:scale-95 transition-transform"
          >
            <ShoppingCart size={24} />
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-dark text-white text-xs font-black rounded-full flex items-center justify-center ring-2 ring-white">
              {cart.reduce((sum, item) => sum + item.jumlah, 0)}
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default InputPesanan;
