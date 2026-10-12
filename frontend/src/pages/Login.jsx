import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { 
  User, Lock, LogIn, ChefHat, Soup, Smartphone, Store, 
  ArrowRight, Sparkles, CheckCircle2, ShieldCheck, QrCode
} from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import ThemeToggle from '../components/ThemeToggle';
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
    <div className="min-h-screen w-full flex bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans overflow-hidden">
      
      {/* Left Column - Portal & Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 md:px-16 lg:px-16 xl:px-24 py-8 relative z-10 bg-white dark:bg-slate-900 overflow-y-auto border-r border-slate-200/80 dark:border-slate-800">
        <div className="w-full max-w-md mx-auto relative z-10 py-6">
          {/* Brand Logo & Name + Theme Toggle */}
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-rose-50 dark:bg-rose-950/60 rounded-xl flex items-center justify-center border border-rose-200/70 dark:border-rose-900/40 shrink-0">
                <ChefHat size={24} className="text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                  KASIR BAKSOKU
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Pemesanan Mandiri & Kasir POS
                </p>
              </div>
            </div>

            <ThemeToggle variant="compact" />
          </div>

          {/* DUAL PORTAL SWITCHER: Bersih, Jelas, Tanpa Gradasi */}
          <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl flex items-center mb-6 gap-1.5 border border-slate-200 dark:border-slate-700">
            {/* Tab 1: Pelanggan (Pesan Online) */}
            <button
              type="button"
              onClick={() => { setActiveTab('order'); setError(''); }}
              className={`flex-1 py-2.5 px-3 rounded-lg font-bold text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 transition-all cursor-pointer ${
                activeTab === 'order'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <Soup size={18} />
              <div className="text-center sm:text-left leading-tight">
                <span className="block font-bold">Pesan Online</span>
                <span className="text-[10px] opacity-80 font-normal hidden sm:inline">Khusus Pembeli</span>
              </div>
            </button>

            {/* Tab 2: Kasir / Karyawan */}
            <button
              type="button"
              onClick={() => { setActiveTab('kasir'); setError(''); }}
              className={`flex-1 py-2.5 px-3 rounded-lg font-bold text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 transition-all cursor-pointer ${
                activeTab === 'kasir'
                  ? 'bg-slate-900 dark:bg-slate-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <Store size={18} />
              <div className="text-center sm:text-left leading-tight">
                <span className="block font-bold">Sistem Kasir</span>
                <span className="text-[10px] opacity-80 font-normal hidden sm:inline">Khusus Staf</span>
              </div>
            </button>
          </div>

          {/* ======================================================== */}
          {/* VIEW 1: PORTAL PELANGGAN / ORDER ONLINE (TANPA LOGIN) */}
          {/* ======================================================== */}
          {activeTab === 'order' && (
            <div className="space-y-5">
              {/* Header Khusus Pelanggan */}
              <div className="text-left">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-bold mb-2.5">
                  <Sparkles size={13} />
                  <span>Untuk Pelanggan & Pembeli</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                  Mau Pesan Bakso? 🍜
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 leading-relaxed">
                  Pelanggan <strong className="text-slate-900 dark:text-white font-semibold">tidak perlu login akun</strong>. Cukup buka menu langsung dari HP Anda!
                </p>
              </div>

              {/* Card Informasi Pelanggan - Solid & Nyaman */}
              <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3.5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Smartphone size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">Pesan Mandiri Cepat</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-normal mt-0.5">
                      Lihat foto menu bakso, varian, dan stok yang selalu update secara langsung.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                    <QrCode size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">Bayar Praktis via QRIS</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-normal mt-0.5">
                      Scan kode QRIS dari e-wallet (GoPay, OVO, Dana) atau Mobile Banking favorit Anda.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">Status Notifikasi WhatsApp</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-normal mt-0.5">
                      Nomor antrean langsung terdaftar di kasir, dan notifikasi dikirim ke WA saat siap.
                    </p>
                  </div>
                </div>
              </div>

              {/* TOMBOL BESAR ORDER ONLINE - Solid Rose Color (Tanpa Gradasi) */}
              <Link
                to="/order"
                className="w-full py-3.5 px-6 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-base flex items-center justify-center gap-2.5 shadow-sm transition-colors text-center group cursor-pointer"
              >
                <Soup size={20} />
                <span>Buka Menu & Pesan Sekarang</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>

              {/* Beralih ke Staf */}
              <div className="text-center pt-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Staf atau kasir restoran?{' '}
                  <button
                    type="button"
                    onClick={() => setActiveTab('kasir')}
                    className="font-semibold text-slate-800 dark:text-slate-200 hover:underline cursor-pointer"
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
            <div className="space-y-5">
              {/* Header Khusus Kasir */}
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold mb-2.5">
                  <ShieldCheck size={13} className="text-emerald-600 dark:text-emerald-400" />
                  <span>Khusus Staf & Admin Toko</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Login Kasir POS
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                  Masukkan akun kasir atau administrator untuk mengelola pesanan & stok.
                </p>
              </div>

              {/* Pengingat Jika Pelanggan Nyasar ke Tab Kasir */}
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 flex items-start gap-2.5">
                <Soup size={18} className="text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                  <span className="font-bold block mb-0.5 text-amber-950 dark:text-amber-100">Pelanggan yang ingin memesan?</span>
                  Anda <span className="font-semibold">tidak perlu akun login</span>.{' '}
                  <button 
                    type="button" 
                    onClick={() => setActiveTab('order')}
                    className="font-bold underline text-rose-600 dark:text-rose-400 hover:text-rose-700 cursor-pointer"
                  >
                    Buka menu pesan online di sini ➔
                  </button>
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs sm:text-sm flex items-start gap-2.5 shadow-2xs">
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
                  className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:bg-white text-slate-900 dark:text-slate-100"
                />

                <Input
                  icon={Lock}
                  label="Password Akun"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:bg-white text-slate-900 dark:text-slate-100"
                />

                <div className="pt-1">
                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full font-bold text-base rounded-xl !bg-rose-600 hover:!bg-rose-700 active:!bg-rose-800 text-white shadow-xs transition-colors border-transparent cursor-pointer"
                    isLoading={isLoading}
                    icon={LogIn}
                  >
                    Masuk ke Sistem Kasir
                  </Button>
                </div>
              </form>

              {/* Link Switcher */}
              <div className="text-center pt-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Bukan kasir?{' '}
                  <button
                    type="button"
                    onClick={() => setActiveTab('order')}
                    className="font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                  >
                    Beralih ke Pemesanan Online Pelanggan 🍜
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-slate-400 dark:text-slate-500 font-medium">
            Sistem Kasir & Antrian Cerdas &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>

      {/* Right Column - Clean Showcase (Solid Dark, Tanpa Gradasi) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 dark:bg-slate-950 items-center justify-center p-12 overflow-hidden">
        {/* Background Image with Solid Dark Overlay */}
        <img 
          src="/bakso_login_bg.png" 
          alt="Bakso Background" 
          className="absolute inset-0 w-full h-full object-cover opacity-25"
        />
        
        {/* Solid Dark Overlay (Tanpa Gradasi) */}
        <div className="absolute inset-0 bg-slate-950/70" />
        
        {/* Content Showcase Card - Solid, Rapi & Nyaman */}
        <div className="relative z-10 max-w-lg w-full bg-slate-900/90 border border-slate-800 p-8 xl:p-10 rounded-2xl shadow-xl space-y-6 text-white">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Sistem Kasir & Pemesanan Online Aktif
          </div>

          <div>
            <h2 className="text-2xl xl:text-3xl font-extrabold leading-tight text-white">
              Satu Sistem Terpadu,<br />Dua Pengalaman Mudah.
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed mt-3">
              Pelanggan memesan mandiri via smartphone tanpa antre, sementara staf kasir memproses pesanan dan memantau stok secara rapi dan akurat.
            </p>
          </div>

          {/* 2 Feature Badges - Solid */}
          <div className="grid grid-cols-2 gap-3.5 text-left pt-1">
            <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700/80">
              <div className="text-rose-400 font-bold text-xs uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Soup size={15} /> Pelanggan
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Scan QR menu, bayar QRIS, & terima notifikasi WhatsApp saat pesanan siap.
              </p>
            </div>

            <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700/80">
              <div className="text-sky-400 font-bold text-xs uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Store size={15} /> Kasir POS
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Monitor antrean pesanan real-time, pantau stok bahan, & cetak struk transaksi.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
