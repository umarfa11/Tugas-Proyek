import React from 'react';
import Sidebar from './Sidebar';

const AdminLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-light">
      <Sidebar />
      <main className="ml-64 p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
