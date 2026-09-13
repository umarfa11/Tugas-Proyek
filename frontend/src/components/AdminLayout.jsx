import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { WifiOff, Wifi, Download, CheckCircle2 } from 'lucide-react';
import { usePWAStatus } from '../services/pwaService';

const AdminLayout = ({ children }) => {
  const { isOnline, isInstallable, installPWA } = usePWAStatus();
  const [showOnlineToast, setShowOnlineToast] = useState(false);
  const [prevOnlineState, setPrevOnlineState] = useState(isOnline);

  useEffect(() => {
    if (!prevOnlineState && isOnline) {
      setShowOnlineToast(true);
      const timer = setTimeout(() => setShowOnlineToast(false), 4000);
      return () => clearTimeout(timer);
    }
    setPrevOnlineState(isOnline);
  }, [isOnline]);

  return (
    <div className="min-h-screen bg-light">
      {/* Offline Alert Banner */}
      {!isOnline && (
        <div className="bg-amber-500 text-white px-4 py-2 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 sticky top-0 z-50 shadow-md animate-pulse">
          <WifiOff size={16} className="shrink-0" />
          <span>Anda sedang dalam <strong>Mode Offline</strong>. Menampilkan data cache lokal yang aman.</span>
        </div>
      )}

      {/* Online Restored Toast */}
      {showOnlineToast && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 sticky top-0 z-50 shadow-md">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>Koneksi internet kembali normal. Data tersinkronisasi otomatis.</span>
        </div>
      )}

      {/* Mobile Topbar */}
      <div className="lg:hidden bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-sm">
            B
          </div>
          <div>
            <h1 className="font-bold text-dark text-sm tracking-tight leading-tight">KASIR BAKSOKU</h1>
            <p className="text-[10px] text-gray-400">Point of Sale & Finance</p>
          </div>
        </div>

        {/* PWA Install Button Mobile */}
        {isInstallable && (
          <button
            onClick={installPWA}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-xl text-xs font-semibold shadow-sm hover:bg-primary/90 transition-all"
          >
            <Download size={13} />
            <span>Install App</span>
          </button>
        )}
      </div>

      <Sidebar />
      
      <main className="lg:ml-64 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 transition-all duration-300">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
