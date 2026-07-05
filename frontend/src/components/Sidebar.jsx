import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  ListOrdered, 
  History, 
  LogOut,
  ChefHat,
  Users,
  Archive
} from 'lucide-react';
import useAuthStore from '../store/authStore';

const Sidebar = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const adminLinks = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/produk', label: 'Kelola Produk', icon: Package },
    { to: '/admin/pesanan', label: 'Input Pesanan', icon: ShoppingCart },
    { to: '/admin/antrian', label: 'Monitor Antrian', icon: ListOrdered },
    { to: '/admin/riwayat', label: 'Riwayat Penjualan', icon: History },
    { to: '/admin/user', label: 'Kelola Akun', icon: Users },
    { to: '/admin/produk-deaktif', label: 'Produk Deaktif', icon: Archive },
  ];

  const kasirLinks = [
    { to: '/kasir', label: 'Input Pesanan', icon: ShoppingCart },
    { to: '/kasir/antrian', label: 'Monitor Antrian', icon: ListOrdered },
  ];

  const links = user?.role === 'super_admin' ? adminLinks : kasirLinks;

  const linkBaseClass = "flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-1.5 lg:gap-3 px-3 lg:px-4 py-2 lg:py-3 min-w-[76px] lg:min-w-0 rounded-xl text-[11px] lg:text-sm font-medium transition-all duration-200 shrink-0";
  const activeLinkClass = "text-primary lg:bg-primary/10 lg:shadow-sm";
  const inactiveLinkClass = "text-gray-400 lg:text-gray-500 hover:text-gray-700 lg:hover:bg-gray-100";

  return (
    <>
      {/* Sidebar / Bottom Nav */}
      <aside 
        className="fixed bottom-0 lg:top-0 left-0 w-full lg:w-64 h-[64px] lg:h-dvh bg-white border-t lg:border-t-0 lg:border-r border-gray-100 flex flex-row lg:flex-col z-50 lg:z-40 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] lg:shadow-sm"
      >
      {/* Brand - Desktop Only */}
      <div className="hidden lg:block px-6 py-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2.5 rounded-xl">
            <ChefHat size={24} className="text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-dark text-base tracking-tight">KASIR BAKSOKU</h1>
            <p className="text-xs text-gray-400 capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-row lg:flex-col items-center lg:items-stretch overflow-x-auto lg:overflow-y-auto px-2 lg:p-4 gap-2 lg:space-y-1.5 scrollbar-hide">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/admin' || link.to === '/kasir'}
            className={({ isActive }) =>
              `${linkBaseClass} ${isActive ? activeLinkClass : inactiveLinkClass}`
            }
          >
            <link.icon className="w-5 h-5 lg:w-5 lg:h-5 shrink-0" />
            <span className="whitespace-nowrap">{link.label}</span>
          </NavLink>
        ))}

        {/* Logout - Mobile Only */}
        <button 
          onClick={handleLogout}
          className="lg:hidden flex flex-col items-center justify-center min-w-[76px] shrink-0 gap-1.5 px-3 py-2 text-[11px] font-medium text-red-500 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span>Keluar</span>
        </button>
      </nav>

      {/* User Info & Logout - Desktop Only */}
      <div className="hidden lg:block p-4 pb-8 sm:pb-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-secondary/20 flex items-center justify-center">
            <span className="text-secondary font-bold text-sm">
              {user?.nama?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-dark truncate">{user?.nama}</p>
            <p className="text-xs text-gray-400 truncate">@{user?.username}</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut size={18} />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;
