import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const applyThemeToDOM = (theme) => {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = theme === 'dark' || (theme === 'system' && systemPrefersDark);

  if (isDark) {
    root.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
  } else {
    root.classList.remove('dark');
    root.setAttribute('data-theme', 'light');
  }
};

export const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: 'system', // 'light' | 'dark' | 'system'

      setTheme: (newTheme) => {
        set({ theme: newTheme });
        applyThemeToDOM(newTheme);
      },

      initTheme: () => {
        const currentTheme = get().theme || 'system';
        applyThemeToDOM(currentTheme);

        // Listen for phone/OS system changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleSystemChange = () => {
          if (get().theme === 'system') {
            applyThemeToDOM('system');
          }
        };

        try {
          mediaQuery.addEventListener('change', handleSystemChange);
          return () => mediaQuery.removeEventListener('change', handleSystemChange);
        } catch (e) {
          // Fallback for older browsers
          mediaQuery.addListener(handleSystemChange);
          return () => mediaQuery.removeListener(handleSystemChange);
        }
      },
    }),
    {
      name: 'theme-storage',
    }
  )
);

export default useThemeStore;
