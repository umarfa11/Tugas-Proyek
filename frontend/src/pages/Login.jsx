import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, LogIn, ChefHat } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import useAuthStore from '../store/authStore';
import api from '../services/api';

const Login = () => {
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
      setError(err.response?.data?.message || 'Gagal terhubung ke server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-50 text-dark font-sans overflow-hidden">
      
      {/* Left Column - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-24 xl:px-32 relative z-10 animate-fade-in bg-gradient-to-tr from-slate-50 via-white to-primary/10">
        {/* Subtle decorative background glow circles */}
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-secondary/5 blur-[120px] pointer-events-none" />
        
        <div className="w-full max-w-md mx-auto relative z-10">
          {/* Logo & Header */}
          <div className="mb-12">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-primary/20 shadow-sm">
              <ChefHat size={32} className="text-primary" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-dark mb-3">Selamat Datang</h1>
            <p className="text-gray-500 font-medium">Masuk ke KASIR BAKSOKU untuk melanjutkan operasional toko.</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-8 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-start gap-3 animate-fade-in shadow-sm">
              <Lock size={18} className="mt-0.5 shrink-0" />
              <span className="font-medium leading-tight">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-5">
              <Input
                icon={User}
                label="Username"
                type="text"
                placeholder="Masukkan username Anda"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-gray-50 border-gray-200 focus:bg-white text-dark"
              />
              
              <Input
                icon={Lock}
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-gray-50 border-gray-200 focus:bg-white text-dark"
              />
            </div>

            <div className="pt-2">
              <Button 
                type="submit" 
                variant="primary" 
                size="lg" 
                className="w-full font-bold text-lg tracking-wide rounded-xl shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300"
                isLoading={isLoading}
                icon={LogIn}
              >
                Masuk ke Sistem
              </Button>
            </div>
          </form>

          {/* Footer */}
          <p className="mt-10 text-center text-sm text-gray-400 font-medium">
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
          className="absolute inset-0 w-full h-full object-cover opacity-90 mix-blend-overlay"
        />
        
        {/* Modern Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-dark/95 via-dark/60 to-primary/30"></div>
        
        {/* Decorative Elements */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center text-white z-10">
          <div className="backdrop-blur-md bg-white/10 border border-white/20 p-10 rounded-3xl shadow-2xl max-w-lg transform hover:scale-105 transition-transform duration-500">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 border border-white/30 text-white text-sm font-semibold mb-6">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              Sistem Aktif & Terhubung
            </div>
            <h2 className="text-4xl font-bold leading-tight mb-4 text-white drop-shadow-md">
              Manajemen Cerdas,<br/>Pelayanan Cepat.
            </h2>
            <p className="text-gray-200 text-lg leading-relaxed text-opacity-90">
              Tingkatkan efisiensi restoran Anda dengan antrian FIFO otomatis dan pemrosesan pesanan yang akurat secara real-time.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Login;
