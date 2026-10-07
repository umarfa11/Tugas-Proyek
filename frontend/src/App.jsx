import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import Login from './pages/Login';
import AdminLayout from './components/AdminLayout';
import KelolaProduk from './pages/KelolaProduk';
import InputPesanan from './pages/InputPesanan';
import MonitorAntrian from './pages/MonitorAntrian';
import RiwayatPenjualan from './pages/RiwayatPenjualan';
import KelolaUser from './pages/KelolaUser';
import ProdukDeaktif from './pages/ProdukDeaktif';

import Dashboard from './pages/Dashboard';

const NotFound = () => <div className="p-8 text-center text-red-500 text-xl font-bold">404 - Page Not Found</div>;

// Route Protector
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to={user?.role === 'super_admin' ? '/admin' : '/kasir'} replace />;
  }
  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (isAuthenticated) {
    return <Navigate to={user?.role === 'super_admin' ? '/admin' : '/kasir'} replace />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public */}
        <Route path="/login" element={
          <PublicRoute><Login /></PublicRoute>
        } />

        {/* ===== Admin Routes ===== */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <AdminLayout><Dashboard /></AdminLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/produk" element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <AdminLayout><KelolaProduk /></AdminLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/pesanan" element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <AdminLayout><InputPesanan /></AdminLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/antrian" element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <AdminLayout><MonitorAntrian /></AdminLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/riwayat" element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <AdminLayout><RiwayatPenjualan /></AdminLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/user" element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <AdminLayout><KelolaUser /></AdminLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/produk-deaktif" element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <AdminLayout><ProdukDeaktif /></AdminLayout>
          </ProtectedRoute>
        } />

        {/* ===== Kasir Routes ===== */}
        <Route path="/kasir" element={
          <ProtectedRoute allowedRoles={['kasir']}>
            <AdminLayout><InputPesanan /></AdminLayout>
          </ProtectedRoute>
        } />
        <Route path="/kasir/antrian" element={
          <ProtectedRoute allowedRoles={['kasir']}>
            <AdminLayout><MonitorAntrian /></AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
