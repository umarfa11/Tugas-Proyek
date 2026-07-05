import React, { useState, useEffect } from 'react';
import { Search, RotateCcw, PackageOpen, RefreshCw, AlertTriangle } from 'lucide-react';
import api from '../services/api';

const ProdukDeaktif = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [notification, setNotification] = useState(null);

  const fetchDeactivatedProducts = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/produk/deactivated');
      setProducts(res.data);
    } catch (err) {
      console.error('Error fetching deactivated products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDeactivatedProducts();
  }, []);

  const handleRestore = async (id, namaProduk) => {
    try {
      await api.post(`/produk/${id}/restore`);
      
      // Show notification
      setNotification({
        type: 'success',
        message: `Produk "${namaProduk}" berhasil dipulihkan ke inventaris aktif!`
      });

      // Clear notification after 3 seconds
      setTimeout(() => setNotification(null), 3000);

      // Refresh list
      fetchDeactivatedProducts();
    } catch (err) {
      console.error('Error restoring product:', err);
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Gagal memulihkan produk'
      });
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const getRemainingDays = (deactivatedAtStr) => {
    const deactivatedAt = new Date(deactivatedAtStr);
    const now = new Date();
    
    // Difference in milliseconds
    const diffTime = now - deactivatedAt;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    const remaining = 30 - diffDays;
    return remaining > 0 ? remaining : 0;
  };

  const filteredProducts = products.filter(product =>
    product.namaProduk.toLowerCase().includes(search.toLowerCase()) ||
    product.kategori.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark">Produk Deaktif</h1>
          <p className="text-gray-400 text-sm mt-1">Daftar produk yang diarsipkan sementara selama 30 hari sebelum dihapus permanen</p>
        </div>
        <button
          onClick={fetchDeactivatedProducts}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:text-dark hover:border-gray-300 transition-colors shadow-sm"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          Segarkan
        </button>
      </div>

      {/* Global Notification */}
      {notification && (
        <div className={`p-4 rounded-xl mb-6 border text-sm font-semibold flex items-center gap-3 animate-fade-in ${
          notification.type === 'success' 
            ? 'bg-teal-50 border-teal-100 text-teal-700' 
            : 'bg-rose-50 border-rose-100 text-rose-700'
        }`}>
          <AlertTriangle size={18} className="shrink-0" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Search Filter */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama produk atau kategori..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm text-dark placeholder-gray-400"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-50/80 text-gray-500 font-semibold border-b border-gray-100">
                <th className="px-6 py-4">Nama Produk</th>
                <th className="px-6 py-4 w-28">Kategori</th>
                <th className="px-6 py-4 w-28">Harga</th>
                <th className="px-6 py-4 w-36">Sisa Penangguhan</th>
                <th className="px-6 py-4 w-24 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      <span>Memuat produk deaktif...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <PackageOpen size={36} className="text-gray-300" />
                      <span>Tidak ada produk deaktif saat ini</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const remaining = getRemainingDays(product.deactivatedAt);
                  return (
                    <tr key={product.id} className="hover:bg-gray-50/30 transition-colors">
                      {/* Name */}
                      <td className="px-6 py-4 font-semibold text-dark">
                        {product.namaProduk}
                      </td>
                      
                      {/* Category */}
                      <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                        {product.kategori}
                      </td>

                      {/* Price */}
                      <td className="px-6 py-4 font-semibold text-dark whitespace-nowrap">
                        Rp {Number(product.harga).toLocaleString('id-ID')}
                      </td>

                      {/* Remaining Days Countdown */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          remaining <= 3 
                            ? 'bg-rose-50 text-rose-700 border-rose-100' 
                            : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          {remaining} Hari Lagi
                        </span>
                      </td>

                      {/* Action Restore */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleRestore(product.id, product.namaProduk)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 border border-teal-100 text-teal-700 hover:bg-teal-100 hover:border-teal-200 transition-all rounded-lg text-xs font-bold"
                        >
                          <RotateCcw size={13} />
                          Pulihkan
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProdukDeaktif;
