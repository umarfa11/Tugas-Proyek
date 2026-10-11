import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { 
  User, Lock, LogIn, ChefHat, Soup, Smartphone, Store, 
  ArrowRight, Sparkles, CheckCircle2, ShieldCheck, QrCode
} from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import useAuthStore from '../store/authStore';
import api from '../services/api';

const Login = () => {
  const [searchParams] = useSearchParams();
  // Default tab: 'order' untuk pelanggan, atau 'kasir' jika URL memiliki ?tab=kasir
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') === 'kasir' ? 'kasir' : 'order');
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Mohon isi username dan password');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', { username, password });
      
      const { token, user } = response.data;
      
      // Simpan di zustand & localStorage
      login(user, token);

      // Redirect berdasarkan role
      if (user.role === 'super_admin') {
        navigate('/admin');
      } else {
        navigate('/kasir');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Username atau password salah');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-50 text-dark font-sans overflow-hidden">
      
      {/* Left Column - Portal & Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 md:px-16 lg:px-16 xl:px-24 py-8 relative z-10 animate-fade-in bg-gradient-to-tr from-slate-50 via-white to-primary/5 overflow-y-auto">
        {/* Subtle decorative background glow circles */}
        <div className="absolute top-[-15%] left-[-15%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-15%] right-[-15%] w-[50%] h-[50%] rounded-full bg-secondary/10 blur-[120px] pointer-events-none" />
        
        <div className="w-full max-w-md mx-auto relative z-10 py-6">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center ring-1 ring-primary/20 shadow-xs shrink-0">
              <ChefHat size={28} className="text-primary" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-dark tracking-tight leading-tight">
                KASIR BAKSOKU
              </h1>
              <p className="text-xs text-gray-400 font-medium">
                Pemesanan Mandiri & Kasir Cerdas
              </p>
            </div>
          </div>

          {/* DUAL PORTAL SWITCHER: Sangat Jelas & Mudah Dibedakan */}
          <div className="bg-gray-100/90 p-1.5 rounded-2xl flex items-center mb-6 gap-1.5 border border-gray-200/80 shadow-inner">
            {/* Tab 1: Pelanggan (Pesan Online) */}
            <button
              type="button"
              onClick={() => { setActiveTab('order'); setError(''); }}
              className={`flex-1 py-3 px-2 sm:px-3 rounded-xl font-black text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 transition-all cursor-pointer ${
                activeTab === 'order'
                  ? 'bg-gradient-to-r from-primary to-rose-600 text-white shadow-md shadow-primary/25 scale-[1.01]'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-white/60'
              }`}
            >
              <Soup size={18} className={activeTab === 'order' ? 'animate-bounce' : ''} />
              <div className="text-center sm:text-left leading-tight">
                <span className="block font-black">Pesan Online</span>
                <span className="text-[10px] opacity-80 font-normal hidden sm:inline">Khusus Pembeli</span>
              </div>
            </button>

            {/* Tab 2: Kasir / Karyawan */}
            <button
              type="button"
              onClick={() => { setActiveTab('kasir'); setError(''); }}
              className={`flex-1 py-3 px-2 sm:px-3 rounded-xl font-black text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 transition-all cursor-pointer ${
                activeTab === 'kasir'
                  ? 'bg-gray-900 text-white shadow-md shadow-gray-900/25 scale-[1.01]'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-white/60'
              }`}
            >
              <Store size={18} />
              <div className="text-center sm:text-left leading-tight">
                <span className="block font-black">Sistem Kasir</span>
                <span className="text-[10px] opacity-80 font-normal hidden sm:inline">Khusus Staf</span>
              </div>
            </button>
          </div>

          {/* ======================================================== */}
          {/* VIEW 1: PORTAL PELANGGAN / ORDER ONLINE (TANPA LOGIN) */}
          {/* ======================================================== */}
          {activeTab === 'order' && (
            <div className="animate-fade-in space-y-5">
              {/* Header Khusus Pelanggan */}
              <div className="text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-wider mb-2.5">
                  <Sparkles size={13} />
                  <span>Untuk Pelanggan & Pembeli</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-dark tracking-tight leading-tight">
                  Mau Pesan Bakso? 🍜
                </h2>
                <p className="text-gray-500 text-sm mt-1 leading-relaxed">
                  Pelanggan <strong className="text-primary font-bold">tidak perlu login akun</strong>. Cukup buka menu langsung dari HP Anda!
                </p>
              </div>

              {/* Card Informasi Pelanggan */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-rose-50/80 via-white to-amber-50/60 border border-rose-200/80 shadow-xs space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Smartphone size={18} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-gray-900 text-sm">Pesan Mandiri Cepat</h3>
                    <p className="text-xs text-gray-500 leading-tight mt-0.5">
                      Lihat foto menu bakso, harga, varian, dan stok yang tersedia secara real-time.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <QrCode size={18} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-gray-900 text-sm">Bayar Online via QRIS</h3>
                    <p className="text-xs text-gray-500 leading-tight mt-0.5">
                      Scan kode QRIS langsung dari aplikasi e-wallet (GoPay, OVO, Dana) atau Mobile Banking.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-gray-900 text-sm">Notifikasi WhatsApp Otomatis</h3>
                    <p className="text-xs text-gray-500 leading-tight mt-0.5">
                      Nomor antrean langsung masuk kasir, dan Anda akan dikabari via WhatsApp saat bakso siap!
                    </p>
                  </div>
                </div>
              </div>

              {/* TOMBOL BESAR ORDER ONLINE */}
              <Link
                to="/order"
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-primary via-rose-500 to-rose-600 hover:from-primary/95 hover:to-rose-700 text-white font-black text-base sm:text-lg flex items-center justify-center gap-3 shadow-xl shadow-primary/30 hover:shadow-primary/45 hover:-translate-y-0.5 active:translate-y-0 transition-all text-center group cursor-pointer"
              >
                <Soup size={22} className="group-hover:rotate-12 transition-transform" />
                <span>Buka Menu & Pesan Sekarang</span>
                <ArrowRight size={20} className="group-hover:translate-x-1.5 transition-transform" />
              </Link>

              {/* Beralih ke Staf */}
              <div className="text-center pt-2">
                <p className="text-xs text-gray-400">
                  Anda kasir atau staf restoran?{' '}
                  <button
                    type="button"
                    onClick={() => setActiveTab('kasir')}
                    className="font-bold text-gray-700 hover:text-dark underline cursor-pointer"
                  >
                    Masuk ke Sistem Kasir di sini
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW 2: PORTAL STAF & KASIR (LOGIN DENGAN AKUN) */}
          {/* ======================================================== */}
          {activeTab === 'kasir' && (
            <div className="animate-fade-in space-y-5">
              {/* Header Khusus Kasir */}
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-black uppercase tracking-wider mb-2.5">
                  <ShieldCheck size={13} className="text-emerald-400" />
                  <span>Khusus Staf & Admin Toko</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-dark tracking-tight">
                  Login Kasir POS
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  Masukkan akun kasir atau super admin untuk mengelola operasional toko.
                </p>
              </div>

              {/* Pengingat Jika Pelanggan Nyasar ke Tab Kasir */}
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 flex items-start gap-2.5">
                <Soup size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 leading-tight">
                  <span className="font-extrabold block mb-0.5 text-amber-950">Pelanggan yang ingin pesan makanan?</span>
                  Anda <span className="font-bold">tidak perlu login</span>.{' '}
                  <button 
                    type="button" 
                    onClick={() => setActiveTab('order')}
                    className="font-bold underline text-primary hover:text-rose-700 cursor-pointer"
                  >
                    Klik di sini untuk Order Online ➔
                  </button>
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs sm:text-sm flex items-start gap-2.5 animate-fade-in shadow-2xs">
                  <Lock size={16} className="mt-0.5 shrink-0" />
                  <span className="font-medium leading-tight">{error}</span>
                </div>
              )}

              {/* Form Login Kasir */}
              <form onSubmit={handleLogin} className="space-y-4">
                <Input
                  icon={User}
                  label="Username Kasir / Admin"
                  type="text"
                  placeholder="Contoh: admin atau kasir1"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-gray-50 border-gray-200 focus:bg-white text-dark"
                />

                <Input
                  icon={Lock}
                  label="Password Akun"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-gray-50 border-gray-200 focus:bg-white text-dark"
                />

                <div className="pt-1">
                  <Button 
                    type="submit" 
                    variant="primary" 
                    size="lg" 
                    className="w-full font-black text-base tracking-wide rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/35 transition-all"
                    isLoading={isLoading}
                    icon={LogIn}
                  >
                    Masuk ke Sistem Kasir
                  </Button>
                </div>
              </form>

              {/* Link Switcher */}
              <div className="text-center pt-2">
                <p className="text-xs text-gray-400">
                  Bukan kasir?{' '}
                  <button
                    type="button"
                    onClick={() => setActiveTab('order')}
                    className="font-bold text-primary hover:underline cursor-pointer"
                  >
                    Beralih ke Pemesanan Online Pelanggan 🍜
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-gray-400 font-medium">
            Sistem Kasir & Antrian Cerdas &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>

      {/* Right Column - Image Showcase */}
      <div className="hidden lg:block lg:w-1/2 relative bg-dark">
        {/* Background Image */}
        <img 
          src="/bakso_login_bg.png" 
          alt="Premium Bakso Background" 
          className="absolute inset-0 w-full h-full object-cover opacity-85 mix-blend-overlay"
        />
        
        {/* Modern Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-dark/95 via-dark/70 to-primary/40"></div>
        
        {/* Decorative Elements */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center text-white z-10">
          <div className="backdrop-blur-md bg-white/10 border border-white/20 p-8 xl:p-10 rounded-3xl shadow-2xl max-w-lg transform hover:scale-102 transition-transform duration-500 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Sistem Aktif & Terhubung Real-Time
            </div>

            <div>
              <h2 className="text-3xl xl:text-4xl font-black leading-tight text-white drop-shadow-md">
                Satu Sistem,<br/>Dua Pengalaman.
              </h2>
              <p className="text-gray-200 text-sm xl:text-base leading-relaxed text-opacity-90 mt-3">
                Pelanggan menikmati kemudahan order mandiri via HP, sementara staf kasir mengelola antrean FIFO dan stok secara akurat.
              </p>
            </div>

            {/* 2 Feature Badges */}
            <div className="grid grid-cols-2 gap-3 text-left pt-2">
              <div className="p-3 bg-white/10 rounded-2xl border border-white/15">
                <div className="text-rose-400 font-black text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Soup size={14} /> Pelanggan
                </div>
                <p className="text-[11px] text-gray-200 leading-tight">
                  Scan QR, pilih menu, bayar QRIS, & terima WA saat matang.
                </p>
              </div>

              <div className="p-3 bg-white/10 rounded-2xl border border-white/15">
                <div className="text-blue-400 font-black text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Store size={14} /> Kasir POS
                </div>
                <p className="text-[11px] text-gray-200 leading-tight">
                  Monitor antrean FIFO, kelola stok menu, & cetak laporan omzet.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Login;
