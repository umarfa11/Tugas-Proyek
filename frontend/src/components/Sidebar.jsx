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

const Sidebar = ({ isOpen, onClose }) => {
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

  const linkBaseClass = "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200";
  const activeLinkClass = "bg-primary/10 text-primary shadow-sm";
  const inactiveLinkClass = "text-gray-500 hover:bg-gray-100 hover:text-gray-700";

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed left-0 top-0 h-dvh w-64 bg-white border-r border-gray-100 flex flex-col z-40 shadow-sm transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
      {/* Brand */}
      <div className="px-6 py-6 border-b border-gray-100">
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
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/admin' || link.to === '/kasir'}
            className={({ isActive }) =>
              `${linkBaseClass} ${isActive ? activeLinkClass : inactiveLinkClass}`
            }
          >
            <link.icon size={20} />
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 pb-8 sm:pb-4 border-t border-gray-100">
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
