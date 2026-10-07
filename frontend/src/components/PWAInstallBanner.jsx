import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Wifi, Zap, Share, PlusSquare, CheckCircle2, Sparkles } from 'lucide-react';
import { usePWAStatus } from '../services/pwaService';

const PWAInstallBanner = () => {
  const { isInstallable, isInstalled, installPWA } = usePWAStatus();
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  useEffect(() => {
    // Deteksi iOS Safari
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIosDevice);

    // Cek apakah sudah pernah ditutup dalam sesi ini
    const dismissed = sessionStorage.getItem('pwa_prompt_dismissed');

    // Jika belum terinstal dan belum ditutup, munculkan banner setelah 1 detik
    if (!isInstalled && !dismissed) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [isInstalled]);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (isInstallable) {
      const success = await installPWA();
      if (success) {
        setInstalledSuccess(true);
        setTimeout(() => {
          setIsVisible(false);
        }, 2500);
      }
    } else {
      // Browser desktop Chrome/Edge jika prompt belum terpanggil langsung
      setShowIOSGuide(true);
    }
  };

  if (!isVisible || isInstalled) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-[420px] z-50 animate-fade-in">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-5 shadow-2xl border border-gray-100/80 ring-1 ring-black/5 relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-orange-400 to-secondary" />

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3.5 right-3.5 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          title="Tutup"
        >
          <X size={18} />
        </button>

        {installedSuccess ? (
          <div className="py-4 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 size={28} />
            </div>
            <h4 className="font-bold text-dark text-base">Aplikasi Berhasil Dipasang!</h4>
            <p className="text-xs text-gray-500">
              Kasir Baksoku sekarang siap dibuka langsung dari layar utama atau desktop Anda.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header / Brand */}
            <div className="flex items-start gap-3.5 pr-6">
              <img
                src="/pwa-192x192.png"
                alt="Kasir Baksoku"
                className="w-12 h-12 rounded-2xl object-cover shadow-md border border-gray-100 shrink-0"
              />
              <div className="min-w-0">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold tracking-wide uppercase mb-0.5">
                  <Sparkles size={11} />
                  <span>Aplikasi Kasir Siap Pasang</span>
                </div>
                <h3 className="font-extrabold text-dark text-base tracking-tight leading-snug">
                  Pasang Kasir Baksoku
                </h3>
                <p className="text-xs text-gray-400">
                  Instal di HP atau Komputer Anda untuk akses instan
                </p>
              </div>
            </div>

            {/* Value Highlights */}
            <div className="grid grid-cols-3 gap-2 py-2 border-y border-gray-100/80 text-[11px]">
              <div className="flex flex-col items-center text-center p-1.5 rounded-xl bg-gray-50/60">
                <Zap size={16} className="text-amber-500 mb-1" />
                <span className="font-semibold text-dark">Akses Kilat</span>
                <span className="text-[10px] text-gray-400">Tanpa Browser</span>
              </div>
              <div className="flex flex-col items-center text-center p-1.5 rounded-xl bg-gray-50/60">
                <Wifi size={16} className="text-emerald-500 mb-1" />
                <span className="font-semibold text-dark">Dukung Offline</span>
                <span className="text-[10px] text-gray-400">Data Tetap Aman</span>
              </div>
              <div className="flex flex-col items-center text-center p-1.5 rounded-xl bg-gray-50/60">
                <Smartphone size={16} className="text-blue-500 mb-1" />
                <span className="font-semibold text-dark">Layar Penuh</span>
                <span className="text-[10px] text-gray-400">Seperti Aplikasi</span>
              </div>
            </div>

            {/* Panduan Manual (Khusus iOS Safari atau Browser Tertentu) */}
            {showIOSGuide && (
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5 animate-fade-in">
                <p className="font-bold flex items-center gap-1.5">
                  <Share size={14} className="text-amber-700" />
                  <span>Petunjuk Pemasangan Cepat:</span>
                </p>
                {isIOS ? (
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-amber-800">
                    <li>Ketuk ikon <strong>Bagikan (Share)</strong> 📤 di bilah bawah Safari.</li>
                    <li>Gulir ke bawah, lalu pilih <strong>'Tambah ke Layar Utama' (Add to Home Screen)</strong> ➕.</li>
                    <li>Ketuk <strong>Tambah (Add)</strong> di pojok kanan atas.</li>
                  </ol>
                ) : (
                  <p className="text-[11px] text-amber-800">
                    Klik ikon instalasi <strong>(➕ atau 💻)</strong> pada bilah alamat URL browser Anda untuk menginstal aplikasi ke desktop.
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleInstallClick}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary text-white font-bold text-xs shadow-md shadow-primary/20 hover:bg-primary/90 active:scale-[0.98] transition-all"
              >
                <Download size={15} />
                <span>{isIOS ? 'Lihat Cara Pasang' : 'Pasang Aplikasi'}</span>
              </button>
              <button
                onClick={handleDismiss}
                className="py-2.5 px-3.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Nanti Saja
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PWAInstallBanner;
