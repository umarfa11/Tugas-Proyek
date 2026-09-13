// PWA and Connectivity Management Service
import { useState, useEffect } from 'react';

// Key for local storage caching of financial reports
const LABA_RUGI_CACHE_KEY = 'kasir_baksoku_laba_rugi_cache_';

export const saveLabaRugiCache = (periodKey, data) => {
  try {
    const payload = {
      timestamp: new Date().toISOString(),
      data
    };
    localStorage.setItem(`${LABA_RUGI_CACHE_KEY}${periodKey}`, JSON.stringify(payload));
  } catch (err) {
    console.warn('Gagal menyimpan cache offline Laba Rugi:', err);
  }
};

export const getLabaRugiCache = (periodKey) => {
  try {
    const raw = localStorage.getItem(`${LABA_RUGI_CACHE_KEY}${periodKey}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Gagal membaca cache offline Laba Rugi:', err);
    return null;
  }
};

// Hook for online/offline status and PWA installation
export const usePWAStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check if app is already running as standalone PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstallable(false);
      setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installPWA = async () => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setIsInstallable(false);
    return outcome === 'accepted';
  };

  return {
    isOnline,
    isInstallable,
    isInstalled,
    installPWA
  };
};
