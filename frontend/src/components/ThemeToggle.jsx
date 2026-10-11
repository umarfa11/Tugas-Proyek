import React from 'react';
import { Sun, Moon, Smartphone } from 'lucide-react';
import useThemeStore from '../store/themeStore';

const ThemeToggle = ({ variant = 'segmented', className = '' }) => {
  const { theme, setTheme } = useThemeStore();

  const options = [
    { id: 'light', label: 'Terang', icon: Sun },
    { id: 'dark', label: 'Gelap', icon: Moon },
    { id: 'system', label: 'Sistem', icon: Smartphone },
  ];

  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center p-1 bg-gray-100 dark:bg-slate-800 rounded-xl border border-gray-200/80 dark:border-slate-700/80 shadow-2xs ${className}`}>
        {options.map((opt) => {
          const Icon = opt.icon;
          const isActive = theme === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setTheme(opt.id)}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-slate-700 text-primary dark:text-primary shadow-xs font-bold'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
              }`}
              title={`Mode ${opt.label}`}
            >
              <Icon size={14} />
            </button>
          );
        })}
      </div>
    );
  }

  // Segmented Variant (with icons and labels)
  return (
    <div className={`w-full p-1 bg-gray-100 dark:bg-slate-800/90 rounded-xl border border-gray-200/70 dark:border-slate-700/70 flex items-center gap-1 shadow-2xs ${className}`}>
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = theme === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => setTheme(opt.id)}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              isActive
                ? 'bg-white dark:bg-slate-700 text-primary dark:text-rose-400 shadow-xs'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-slate-700/40'
            }`}
            title={`Pilih Mode ${opt.label}`}
          >
            <Icon size={13} className={isActive ? 'text-primary dark:text-rose-400' : ''} />
            <span className="text-[11px] font-bold">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ThemeToggle;
