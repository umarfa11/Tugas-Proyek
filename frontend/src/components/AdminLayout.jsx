import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';

const AdminLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-light">
      {/* Mobile Topbar */}
      <div className="lg:hidden bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <h1 className="font-bold text-dark text-base tracking-tight">KASIR BAKSOKU</h1>
      </div>

      <Sidebar />
      
      <main className="lg:ml-64 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 transition-all duration-300">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
