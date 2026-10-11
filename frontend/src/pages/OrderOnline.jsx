import React, { useState, useEffect } from 'react';
import { 
  Search, ShoppingCart, Plus, Minus, Trash2, User, 
  QrCode, Soup, ArrowRight, X, CheckCircle2,
  Utensils, Coffee, CakeSlice, MoreHorizontal, ChefHat,
  Phone, Sparkles, Clock, AlertCircle, ArrowLeft, RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import api from '../services/api';

const OrderOnline = () => {
  // Products
  const [produkList, setProdukList] = useState([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [isLoadingProduk, setIsLoadingProduk] = useState(true);

  // Customer Identity (Simple Login via localStorage)
  const [customerName, setCustomerName] = useState(() => localStorage.getItem('bakso_customer_name') || '');
  const [customerPhone, setCustomerPhone] = useState(() => localStorage.getItem('bakso_customer_phone') || '');
  const [isIdentityModalOpen, setIsIdentityModalOpen] = useState(false);
  const [tempName, setTempName] = useState('');
  const [tempPhone, setTempPhone] = useState('');
  const [identityError, setIdentityError] = useState('');

  // Cart
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('bakso_online_cart');
    return saved ? JSON.parse(saved) : [];
  });

  // Mobile Drawer
  const [isCartMobileOpen, setIsCartMobileOpen] = useState(false);

  // Payment (QRIS Statis)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Success Order Ticket
  const [successOrder, setSuccessOrder] = useState(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Fetch Products
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

  useEffect(() => {
    fetchProduk();
  }, []);

  // Persist cart
  useEffect(() => {
    localStorage.setItem('bakso_online_cart', JSON.stringify(cart));
  }, [cart]);

  // Formatters
  const formatRupiah = (num) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  const totalHarga = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const totalItemCount = cart.reduce((sum, item) => sum + item.jumlah, 0);

  // Cart Handlers
  const addToCart = (produk) => {
    if (produk.stok <= 0) return;

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
        stok: produk.stok,
        gambar: produk.gambar
      }];
    });
  };

  const updateQty = (produkId, delta) => {
    setCart(prev =>
      prev.map(item => {
        if (item.produkId === produkId) {
          const newQty = item.jumlah + delta;
          if (newQty <= 0) return null;
          if (newQty > item.stok) return item;
          return { ...item, jumlah: newQty, subtotal: newQty * item.harga };
        }
        return item;
      }).filter(Boolean)
    );
  };

  const removeFromCart = (produkId) => {
    setCart(prev => prev.filter(item => item.produkId !== produkId));
  };

  // Filtered Products
  const filteredProduk = produkList.filter(p => {
    const matchSearch = p.namaProduk.toLowerCase().includes(search.toLowerCase());
    const matchCategory = activeCategory === 'Semua' || p.kategori === activeCategory;
    return matchSearch && matchCategory;
  });

  // Category Meta
  const getCategoryMeta = (cat) => {
    switch (cat) {
      case 'Makanan': return { icon: Utensils, color: 'text-primary' };
      case 'Minuman': return { icon: Coffee, color: 'text-secondary' };
      case 'Dessert': return { icon: CakeSlice, color: 'text-primary' };
      case 'Lainnya': return { icon: MoreHorizontal, color: 'text-secondary' };
      default: return { icon: Soup, color: 'text-dark' };
    }
  };

  // Identity Form
  const handleOpenIdentityModal = () => {
    setTempName(customerName);
    setTempPhone(customerPhone);
    setIdentityError('');
    setIsIdentityModalOpen(true);
  };

  const handleSaveIdentity = (e) => {
    e.preventDefault();
    if (!tempName.trim()) {
      setIdentityError('Mohon isi nama lengkap Anda');
      return;
    }
    const cleanPhone = tempPhone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 9) {
      setIdentityError('Mohon isi nomor WhatsApp yang valid (minimal 9 digit)');
      return;
    }

    setCustomerName(tempName.trim());
    setCustomerPhone(tempPhone.trim());
    localStorage.setItem('bakso_customer_name', tempName.trim());
    localStorage.setItem('bakso_customer_phone', tempPhone.trim());
    setIsIdentityModalOpen(false);
  };

  // Checkout flow
  const handleProceedToPayment = () => {
    if (cart.length === 0) return;
    if (!customerName || !customerPhone) {
      handleOpenIdentityModal();
      return;
    }
    setPaymentError('');
    setIsPaymentOpen(true);
  };

  const handleSubmitOrder = async () => {
    if (cart.length === 0) return;
    if (!customerName || !customerPhone) {
      setIsPaymentOpen(false);
      handleOpenIdentityModal();
      return;
    }

    setIsSubmitting(true);
    setPaymentError('');

    try {
      const payload = {
        namaPembeli: customerName,
        nomorHp: customerPhone,
        items: cart.map(item => ({ produkId: item.produkId, jumlah: item.jumlah }))
      };

      const res = await api.post('/pesanan/online', payload);
      
      setSuccessOrder(res.data.pesanan);
      setIsPaymentOpen(false);
      setIsSuccessModalOpen(true);
      
      // Clear cart
      setCart([]);
      localStorage.removeItem('bakso_online_cart');

      // Refresh products for latest stock
      fetchProduk();
    } catch (err) {
      console.error('Error submitting online order:', err);
      setPaymentError(err.response?.data?.message || 'Gagal memproses pesanan online');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-dark flex flex-col font-sans pb-24 lg:pb-8">
      {/* ===== Header Bar ===== */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary to-rose-500 flex items-center justify-center text-white shadow-md shadow-primary/20">
              <ChefHat size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-dark text-base sm:text-lg tracking-tight leading-tight">KASIR BAKSOKU</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-primary border border-rose-200">
                  Order Online
                </span>
              </div>
              <p className="text-[11px] text-gray-400">Pesan Menu Mandiri • Pembayaran QRIS</p>
            </div>
          </div>

          {/* Customer Profile / Action */}
          <div className="flex items-center gap-3">
            {customerName ? (
              <button 
                onClick={handleOpenIdentityModal}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 text-xs font-semibold text-dark transition-all cursor-pointer"
                title="Ubah data pemesan"
              >
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                  {customerName.charAt(0).toUpperCase()}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="leading-tight truncate max-w-[120px]">{customerName}</p>
                  <p className="text-[10px] text-gray-400 font-normal">{customerPhone}</p>
                </div>
              </button>
            ) : (
              <button 
                onClick={handleOpenIdentityModal}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-xl text-xs font-bold shadow-sm shadow-primary/20 hover:bg-primary/90 transition-all cursor-pointer"
              >
                <User size={14} />
                <span>Isi Data Pemesan</span>
              </button>
            )}

            {/* Cart Trigger Mobile */}
            <button 
              onClick={() => setIsCartMobileOpen(true)}
              className="lg:hidden relative p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-dark hover:bg-gray-100 transition-all"
            >
              <ShoppingCart size={20} />
              {totalItemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-[11px] font-black rounded-full flex items-center justify-center shadow-xs">
                  {totalItemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ===== Main Container ===== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex-1 w-full">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* ===== Left: Menu Catalog ===== */}
          <div className="flex-1 w-full min-w-0">
            {/* Banner Promo / Sambutan */}
            <div className="bg-gradient-to-r from-dark via-slate-800 to-dark text-white rounded-3xl p-6 sm:p-8 mb-6 relative overflow-hidden shadow-lg">
              <div className="absolute right-0 top-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 max-w-lg">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-rose-300 text-xs font-bold mb-3 border border-white/10">
                  <Sparkles size={14} /> Pesan Mudah, Antrean Otomatis
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight mb-2">
                  Nikmati Bakso Hangat Favoritmu 🍜
                </h2>
                <p className="text-sm text-gray-300 leading-relaxed">
                  Pilih menu kesukaan Anda, bayar praktis via QRIS, dan kami akan mengirimkan notifikasi WhatsApp saat pesanan sudah siap diambil!
                </p>
              </div>
            </div>

            {/* Search & Category Filter */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="w-full sm:max-w-xs">
                <Input 
                  icon={Search} 
                  placeholder="Cari menu bakso & minuman..." 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                />
              </div>

              {/* Categories */}
              <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1">
                {['Semua', 'Makanan', 'Minuman', 'Dessert', 'Lainnya'].map((cat) => {
                  const meta = getCategoryMeta(cat);
                  const Icon = cat === 'Semua' ? Soup : meta.icon;
                  const isActive = activeCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-primary to-rose-400 text-white shadow-md shadow-primary/20'
                          : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <Icon size={16} className={isActive ? 'text-white' : meta.color} />
                      <span>{cat}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Product Cards Grid */}
            {isLoadingProduk ? (
              <div className="flex flex-col items-center justify-center h-64 bg-white rounded-3xl border border-gray-100">
                <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-3" />
                <p className="text-gray-400 text-sm font-medium">Memuat menu ketersediaan...</p>
              </div>
            ) : filteredProduk.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 bg-white rounded-3xl border border-dashed border-gray-200 text-gray-400">
                <Soup size={48} className="text-gray-300 mb-2" />
                <p className="font-bold text-base text-gray-600">Menu tidak ditemukan</p>
                <p className="text-xs text-gray-400">Coba cari dengan kata kunci lain</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-4">
                {filteredProduk.map((produk) => {
                  const isOutOfStock = Number(produk.stok) <= 0;
                  const itemInCart = cart.find(c => c.produkId === produk.id);

                  return (
                    <div 
                      key={produk.id}
                      className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col ${
                        isOutOfStock 
                          ? 'opacity-60 border-gray-100 grayscale-30' 
                          : 'border-gray-100 hover:border-primary/30 hover:shadow-md'
                      }`}
                    >
                      {/* Product Image */}
                      <div className="relative aspect-4/3 w-full bg-gray-100 overflow-hidden">
                        {produk.gambar ? (
                          <img 
                            src={produk.gambar} 
                            alt={produk.namaProduk} 
                            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 bg-gradient-to-tr from-gray-50 to-gray-100">
                            <Soup size={36} />
                            <span className="text-[10px] mt-1 font-semibold text-gray-400">Kasir Baksoku</span>
                          </div>
                        )}

                        {/* Stock Badge */}
                        <div className="absolute top-2.5 right-2.5">
                          {isOutOfStock ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gray-800/80 backdrop-blur-sm text-white">
                              Habis
                            </span>
                          ) : (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-sm ${
                              produk.stok <= 5 
                                ? 'bg-amber-500/90 text-white' 
                                : 'bg-emerald-500/90 text-white'
                            }`}>
                              Sisa {produk.stok}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-3.5 flex flex-col flex-1">
                        <div className="mb-2">
                          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-0.5">
                            {produk.kategori}
                          </span>
                          <h3 className="font-bold text-dark text-sm leading-snug line-clamp-2">
                            {produk.namaProduk}
                          </h3>
                        </div>

                        <div className="mt-auto pt-2 flex items-center justify-between border-t border-gray-50">
                          <div>
                            <span className="text-xs text-gray-400 block -mb-0.5">Harga</span>
                            <span className="font-extrabold text-primary text-sm sm:text-base">
                              {formatRupiah(produk.harga)}
                            </span>
                          </div>

                          {/* Add / Stepper */}
                          {itemInCart ? (
                            <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl">
                              <button 
                                onClick={() => updateQty(produk.id, -1)}
                                className="w-6 h-6 rounded-lg bg-white text-dark flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="w-5 text-center text-xs font-bold text-dark">
                                {itemInCart.jumlah}
                              </span>
                              <button 
                                disabled={itemInCart.jumlah >= produk.stok}
                                onClick={() => updateQty(produk.id, 1)}
                                className="w-6 h-6 rounded-lg bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-40 cursor-pointer"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          ) : (
                            <button
                              disabled={isOutOfStock}
                              onClick={() => addToCart(produk)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                isOutOfStock
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-primary text-white hover:bg-primary/90 shadow-xs shadow-primary/20 active:scale-95'
                              }`}
                            >
                              <Plus size={14} />
                              <span>Pesan</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ===== Right: Cart Sidebar (Desktop) ===== */}
          <div className="hidden lg:block w-96 bg-white rounded-3xl border border-gray-100 shadow-sm sticky top-22 overflow-hidden flex flex-col max-h-[calc(100vh-7rem)]">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart size={20} className="text-primary" />
                <h3 className="font-extrabold text-dark text-base">Keranjang Pesanan</h3>
              </div>
              {cart.length > 0 && (
                <button 
                  onClick={() => setCart([])}
                  className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                >
                  Kosongkan
                </button>
              )}
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {cart.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-gray-300 text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                    <ShoppingCart size={28} className="text-gray-300" />
                  </div>
                  <p className="font-bold text-gray-600 text-sm">Keranjang masih kosong</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-[200px]">
                    Pilih menu bakso favorit Anda untuk memesan secara online
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.produkId} className="p-3 bg-gray-50/70 rounded-2xl border border-gray-100 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-dark text-xs truncate">{item.namaProduk}</h4>
                      <p className="text-xs font-semibold text-primary">{formatRupiah(item.harga)}</p>
                    </div>

                    <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-gray-200">
                      <button 
                        onClick={() => updateQty(item.produkId, -1)}
                        className="w-6 h-6 rounded-lg bg-gray-50 text-dark flex items-center justify-center hover:bg-gray-100 cursor-pointer"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-5 text-center text-xs font-bold text-dark">{item.jumlah}</span>
                      <button 
                        disabled={item.jumlah >= item.stok}
                        onClick={() => updateQty(item.produkId, 1)}
                        className="w-6 h-6 rounded-lg bg-primary text-white flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 cursor-pointer"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <button 
                      onClick={() => removeFromCart(item.produkId)}
                      className="text-gray-300 hover:text-red-500 p-1 transition-colors cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer Summary */}
            <div className="p-5 border-t border-gray-100 bg-white">
              {/* Customer Info Reminder */}
              <div className="mb-4 p-3 bg-rose-50/50 rounded-2xl border border-rose-100/60 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-gray-400 block font-medium">Pemesan:</span>
                  <span className="font-bold text-dark">{customerName || 'Belum diisi'}</span>
                </div>
                <button 
                  onClick={handleOpenIdentityModal}
                  className="text-primary font-bold hover:underline text-[11px] cursor-pointer"
                >
                  {customerName ? 'Ubah' : 'Isi Data'}
                </button>
              </div>

              <div className="flex justify-between items-center mb-4">
                <div>
                  <span className="text-xs text-gray-400 block">Total Bayar:</span>
                  <span className="text-xl font-black text-primary">{formatRupiah(totalHarga)}</span>
                </div>
                <span className="text-xs text-gray-400 font-medium">{totalItemCount} Item</span>
              </div>

              <button
                disabled={cart.length === 0}
                onClick={handleProceedToPayment}
                className={`w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  cart.length === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-primary to-rose-500 text-white shadow-md shadow-primary/25 hover:shadow-lg hover:-translate-y-0.5 active:scale-95'
                }`}
              >
                <span>Bayar via QRIS</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>

        </div>
      </main>

      {/* ===== Floating Cart Bar Mobile ===== */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40 animate-slide-up">
          <div className="bg-dark text-white rounded-2xl p-4 shadow-xl border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center font-bold text-white text-sm">
                {totalItemCount}
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block">Total Pesanan</span>
                <span className="text-base font-black text-white">{formatRupiah(totalHarga)}</span>
              </div>
            </div>

            <button
              onClick={() => setIsCartMobileOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-primary to-rose-500 rounded-xl text-xs font-bold text-white shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <span>Lihat Keranjang</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ===== Mobile Cart Modal/Drawer ===== */}
      <Modal isOpen={isCartMobileOpen} onClose={() => setIsCartMobileOpen(false)} title="Keranjang Pesanan" size="md">
        <div className="space-y-4">
          <div className="max-h-60 overflow-y-auto space-y-2.5">
            {cart.map((item) => (
              <div key={item.produkId} className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-dark text-xs truncate">{item.namaProduk}</h4>
                  <p className="text-xs font-semibold text-primary">{formatRupiah(item.harga)}</p>
                </div>
                <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-xl border border-gray-200">
                  <button onClick={() => updateQty(item.produkId, -1)} className="p-1 text-dark"><Minus size={12} /></button>
                  <span className="text-xs font-bold w-4 text-center">{item.jumlah}</span>
                  <button disabled={item.jumlah >= item.stok} onClick={() => updateQty(item.produkId, 1)} className="p-1 text-primary"><Plus size={12} /></button>
                </div>
                <button onClick={() => removeFromCart(item.produkId)} className="text-gray-300 hover:text-red-500 p-1">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="p-3.5 bg-rose-50/50 rounded-2xl border border-rose-100 flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] text-gray-400 block">Pemesan:</span>
              <span className="font-bold text-dark">{customerName || 'Belum diisi'}</span>
            </div>
            <button onClick={handleOpenIdentityModal} className="text-primary font-bold text-xs underline">
              {customerName ? 'Ubah' : 'Isi Data'}
            </button>
          </div>

          <div className="flex justify-between items-center pt-2">
            <div>
              <span className="text-xs text-gray-400 block">Total Bayar:</span>
              <span className="text-2xl font-black text-primary">{formatRupiah(totalHarga)}</span>
            </div>
            <button
              onClick={() => {
                setIsCartMobileOpen(false);
                handleProceedToPayment();
              }}
              className="px-6 py-3 bg-gradient-to-r from-primary to-rose-500 text-white rounded-xl font-bold text-sm shadow-md cursor-pointer"
            >
              Lanjut ke QRIS
            </button>
          </div>
        </div>
      </Modal>

      {/* ===== Identity Modal (Login Simpel Pelanggan) ===== */}
      <Modal isOpen={isIdentityModalOpen} onClose={() => setIsIdentityModalOpen(false)} title="Data Pemesan Online" size="sm">
        <form onSubmit={handleSaveIdentity} className="space-y-4">
          <p className="text-xs text-gray-500 leading-relaxed">
            Silakan masukkan nama dan nomor WhatsApp Anda agar dapur kami dapat mengirimkan <strong>notifikasi saat pesanan Anda selesai disiapkan</strong>.
          </p>

          {identityError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold flex items-center gap-2">
              <AlertCircle size={16} /> {identityError}
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-dark mb-1.5 block">Nama Lengkap Pemesan</label>
            <Input
              icon={User}
              placeholder="Contoh: Budi Santoso"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-dark mb-1.5 block">Nomor WhatsApp Aktif</label>
            <Input
              icon={Phone}
              type="tel"
              placeholder="Contoh: 081234567890"
              value={tempPhone}
              onChange={(e) => setTempPhone(e.target.value)}
              required
            />
            <span className="text-[10px] text-gray-400 mt-1 block">Notifikasi kesiapan pesanan akan dikirim ke nomor ini</span>
          </div>

          <div className="pt-2">
            <Button type="submit" variant="primary" className="w-full">
              Simpan & Lanjutkan
            </Button>
          </div>
        </form>
      </Modal>

      {/* ===== Payment Modal: QRIS Statis ===== */}
      <Modal isOpen={isPaymentOpen} onClose={() => setIsPaymentOpen(false)} title="Pembayaran QRIS Statis" size="md">
        <div className="space-y-5 text-center">
          {paymentError && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold flex items-center justify-center gap-2">
              <AlertCircle size={16} /> {paymentError}
            </div>
          )}

          {/* Info Ringkasan */}
          <div className="bg-dark text-white rounded-2xl p-4 flex items-center justify-between text-left shadow-md">
            <div>
              <span className="text-[10px] text-gray-400 block font-medium">Pemesan: {customerName}</span>
              <span className="text-xs text-emerald-400 font-medium">WhatsApp: {customerPhone}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-gray-400 block font-medium">Total Pembayaran</span>
              <span className="text-2xl font-black text-primary">{formatRupiah(totalHarga)}</span>
            </div>
          </div>

          {/* Box QRIS Statis */}
          <div className="bg-white p-5 rounded-3xl border-2 border-dashed border-gray-200 inline-block shadow-sm">
            <div className="flex items-center justify-between mb-3 px-2">
              <span className="text-[10px] font-black tracking-widest text-[#00569C]">QRIS</span>
              <span className="text-[9px] font-bold text-gray-400">PEMBAYARAN NASIONAL</span>
            </div>

            {/* Ilustrasi QRIS Statis Merchant */}
            <div className="w-52 h-52 mx-auto bg-slate-50 rounded-2xl border border-gray-100 flex flex-col items-center justify-center p-3 relative overflow-hidden">
              {/* SVG QR Code Display */}
              <svg className="w-40 h-40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Outer Frame */}
                <rect width="100" height="100" fill="white" rx="8" />
                {/* Position Detection Patterns Top-Left */}
                <rect x="10" y="10" width="24" height="24" rx="4" fill="#0F172A" />
                <rect x="14" y="14" width="16" height="16" rx="2" fill="white" />
                <rect x="18" y="18" width="8" height="8" rx="1" fill="#0F172A" />
                {/* Top-Right */}
                <rect x="66" y="10" width="24" height="24" rx="4" fill="#0F172A" />
                <rect x="70" y="14" width="16" height="16" rx="2" fill="white" />
                <rect x="74" y="18" width="8" height="8" rx="1" fill="#0F172A" />
                {/* Bottom-Left */}
                <rect x="10" y="66" width="24" height="24" rx="4" fill="#0F172A" />
                <rect x="14" y="70" width="16" height="16" rx="2" fill="white" />
                <rect x="18" y="74" width="8" height="8" rx="1" fill="#0F172A" />
                {/* Random QR Grid Data Blocks */}
                <rect x="42" y="12" width="6" height="6" fill="#0F172A" />
                <rect x="52" y="12" width="6" height="6" fill="#0F172A" />
                <rect x="40" y="24" width="8" height="8" fill="#0F172A" />
                <rect x="12" y="42" width="6" height="6" fill="#0F172A" />
                <rect x="22" y="42" width="6" height="6" fill="#0F172A" />
                <rect x="32" y="42" width="8" height="8" fill="#0F172A" />
                <rect x="46" y="42" width="8" height="8" fill="#FF6B6B" />
                <rect x="62" y="42" width="6" height="6" fill="#0F172A" />
                <rect x="74" y="42" width="12" height="6" fill="#0F172A" />
                <rect x="42" y="56" width="8" height="8" fill="#0F172A" />
                <rect x="56" y="56" width="8" height="8" fill="#0F172A" />
                <rect x="72" y="56" width="6" height="6" fill="#0F172A" />
                <rect x="42" y="70" width="8" height="16" fill="#0F172A" />
                <rect x="56" y="70" width="16" height="8" fill="#0F172A" />
                <rect x="76" y="76" width="12" height="12" fill="#0F172A" />
              </svg>
              <span className="text-[11px] font-bold text-dark mt-1">KASIR BAKSOKU</span>
              <span className="text-[9px] text-gray-400">NMID: ID102003920192</span>
            </div>

            <p className="text-[11px] font-medium text-gray-500 mt-2">
              Scan via GoPay, OVO, Dana, ShopeePay, BCA, atau M-Banking
            </p>
          </div>

          {/* Instruksi */}
          <div className="bg-gray-50 p-4 rounded-2xl text-left border border-gray-100 text-xs space-y-1.5 text-gray-600">
            <p className="font-bold text-dark">Langkah Pembayaran:</p>
            <p>1. Buka aplikasi e-wallet atau mobile banking Anda.</p>
            <p>2. Scan kode QRIS statis di atas.</p>
            <p>3. Masukkan nominal transfer: <strong className="text-primary">{formatRupiah(totalHarga)}</strong>.</p>
            <p>4. Setelah transfer berhasil, klik tombol di bawah untuk mengirim pesanan ke dapur.</p>
          </div>

          {/* Konfirmasi Bayar */}
          <button
            disabled={isSubmitting}
            onClick={handleSubmitOrder}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-black text-base shadow-lg shadow-emerald-600/20 hover:shadow-xl transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 size={20} strokeWidth={3} />
                <span>Saya Sudah Bayar (Kirim Pesanan)</span>
              </>
            )}
          </button>
        </div>
      </Modal>

      {/* ===== Success Order Ticket Modal ===== */}
      <Modal isOpen={isSuccessModalOpen} onClose={() => setIsSuccessModalOpen(false)} title="Pesanan Berhasil Masuk!" size="md">
        {successOrder && (
          <div className="text-center space-y-5">
            {/* Ticket Animation */}
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 size={36} strokeWidth={2.5} />
            </div>

            <div>
              <span className="text-xs uppercase font-bold tracking-widest text-gray-400">Nomor Antrean Anda</span>
              <div className="text-6xl font-black text-primary my-1 tracking-tight">
                #{successOrder.nomorAntrian}
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                <Clock size={14} className="animate-spin" /> Sedang Disiapkan di Dapur
              </span>
            </div>

            {/* Notification reminder */}
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-800 text-left space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <Phone size={14} /> Notifikasi WhatsApp Aktif
              </div>
              <p>
                Ketika bakso Anda selesai disajikan, kami akan mengirimkan pesan pemberitahuan ke nomor WhatsApp: <strong>{successOrder.nomorHp}</strong>.
              </p>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-2xl p-4 text-left border border-gray-100 text-xs space-y-2">
              <div className="flex justify-between font-bold text-dark">
                <span>Pemesan:</span>
                <span>{successOrder.namaPembeli}</span>
              </div>
              <div className="border-t border-gray-200/60 my-1" />
              <div className="space-y-1">
                {successOrder.detailPesanan?.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-gray-600">
                    <span>{item.produk?.namaProduk} x{item.jumlah}</span>
                    <span>{formatRupiah(item.subtotal)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200/60 pt-2 flex justify-between font-black text-dark text-sm">
                <span>Total:</span>
                <span className="text-primary">{formatRupiah(successOrder.totalHarga)}</span>
              </div>
            </div>

            {/* Close / New Order */}
            <div className="pt-2 flex gap-3">
              <Button 
                variant="primary" 
                className="flex-1"
                onClick={() => {
                  setIsSuccessModalOpen(false);
                  setSuccessOrder(null);
                }}
              >
                Pesan Menu Lain
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OrderOnline;
