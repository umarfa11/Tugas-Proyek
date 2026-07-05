import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, Package, AlertTriangle, RotateCcw, Bell } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import api from '../services/api';

const KelolaProduk = () => {
  const [produkList, setProdukList] = useState([]);
  const [deactivatedProduk, setDeactivatedProduk] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingProduk, setEditingProduk] = useState(null);
  const [deletingProduk, setDeletingProduk] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [formData, setFormData] = useState({ namaProduk: '', harga: '', stok: '', kategori: 'Makanan' });
  const [formError, setFormError] = useState('');

  // Fetch active products
  const fetchProduk = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/produk');
      setProdukList(res.data);
    } catch (err) {
      console.error('Error fetching produk:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch deactivated products
  const fetchDeactivated = async () => {
    try {
      const res = await api.get('/produk/deactivated');
      setDeactivatedProduk(res.data);
    } catch (err) {
      console.error('Error fetching deactivated products:', err);
    }
  };

  useEffect(() => {
    fetchProduk();
    fetchDeactivated();
  }, []);

  // Filter by search
  const filteredProduk = produkList.filter(p =>
    p.namaProduk.toLowerCase().includes(search.toLowerCase())
  );

  // Open Add Modal
  const handleAdd = () => {
    setEditingProduk(null);
    setFormData({ namaProduk: '', harga: '', stok: '', kategori: 'Makanan' });
    setFormError('');
    setIsFormOpen(true);
  };

  // Open Edit Modal
  const handleEdit = (produk) => {
    setEditingProduk(produk);
    setFormData({
      namaProduk: produk.namaProduk,
      kategori: produk.kategori || 'Makanan',
      harga: String(produk.harga),
      stok: String(produk.stok),
    });
    setFormError('');
    setIsFormOpen(true);
  };

  // Open Delete Confirm
  const handleDeleteConfirm = (produk) => {
    setDeletingProduk(produk);
    setIsDeleteOpen(true);
  };

  // Submit Create / Update
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.namaProduk || !formData.harga || formData.stok === '' || !formData.kategori) {
      setFormError('Semua field wajib diisi');
      return;
    }

    setIsSaving(true);
    try {
      if (editingProduk) {
        await api.put(`/produk/${editingProduk.id}`, formData);
      } else {
        await api.post('/produk', formData);
      }
      setIsFormOpen(false);
      fetchProduk();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Gagal menyimpan data');
    } finally {
      setIsSaving(false);
    }
  };

  // Execute Deactivation (Soft Delete)
  const handleDelete = async () => {
    setIsSaving(true);
    try {
      await api.delete(`/produk/${deletingProduk.id}`);
      setIsDeleteOpen(false);
      fetchProduk();
      fetchDeactivated();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Gagal menonaktifkan produk');
    } finally {
      setIsSaving(false);
    }
  };

  // Restore Product
  const handleRestore = async (id) => {
    try {
      await api.post(`/produk/${id}/restore`);
      fetchProduk();
      fetchDeactivated();
    } catch (err) {
      console.error('Error restoring product:', err);
      alert(err.response?.data?.message || 'Gagal memulihkan produk');
    }
  };

  // Format currency
  const formatRupiah = (num) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  // Check low stock
  const lowStockProducts = produkList.filter(p => p.stok < 10);

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark">Kelola Produk</h1>
          <p className="text-gray-400 text-sm mt-1">Tambah, edit, atau hapus data menu bakso</p>
        </div>
        <Button icon={Plus} onClick={handleAdd}>Tambah Produk</Button>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-orange-50 border border-orange-200 flex items-start gap-3 shadow-sm animate-fade-in">
          <AlertTriangle size={20} className="text-orange-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-bold text-orange-800">Peringatan Stok Menipis!</h3>
            {lowStockProducts.length === 1 ? (
              <p className="text-sm text-orange-700 mt-1">
                Stok <b>{lowStockProducts[0].namaProduk}</b> tersisa {lowStockProducts[0].stok}. Segera lakukan restok agar pesanan tidak terhambat.
              </p>
            ) : (
              <div className="text-sm text-orange-700 mt-1">
                <p className="mb-1">Terdapat {lowStockProducts.length} produk yang stoknya hampir habis:</p>
                <ul className="list-disc pl-5 space-y-0.5 font-medium">
                  {lowStockProducts.map(p => (
                    <li key={p.id}>{p.namaProduk} <span className="font-normal opacity-80">(sisa {p.stok})</span></li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Deactivated Products Notification (Soft Delete) */}
      {deactivatedProduk.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 shadow-sm animate-fade-in">
          <Bell size={20} className="text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-bold text-red-800">Notifikasi Produk Dinonaktifkan (Arsip 30 Hari)</h3>
            <div className="text-sm text-red-700 mt-2 space-y-2">
              <p>Produk berikut disembunyikan dari POS/Inventory dan akan dihapus permanen setelah 30 hari:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                {deactivatedProduk.map(p => {
                  // Calculate remaining days
                  const deactDate = new Date(p.deactivatedAt);
                  const expiryDate = new Date(deactDate.getTime() + 30 * 24 * 60 * 60 * 1000);
                  const diffTime = expiryDate.getTime() - new Date().getTime();
                  const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
                  
                  return (
                    <div key={p.id} className="flex items-center justify-between bg-white/60 p-3 rounded-lg border border-red-100">
                      <div>
                        <p className="font-semibold text-gray-800">{p.namaProduk}</p>
                        <p className="text-xs text-red-500 font-medium">Hapus otomatis dalam {diffDays} hari</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleRestore(p.id)}
                        className="py-1.5 px-3 text-xs bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white flex items-center gap-1 shadow-sm border-transparent"
                      >
                        <RotateCcw size={12} />
                        Pulihkan
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-6 max-w-sm">
        <Input
          icon={Search}
          placeholder="Cari nama produk..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 text-gray-500 text-left">
                <th className="px-6 py-4 font-semibold">No</th>
                <th className="px-6 py-4 font-semibold">Nama Produk</th>
                <th className="px-6 py-4 font-semibold">Kategori</th>
                <th className="px-6 py-4 font-semibold">Harga</th>
                <th className="px-6 py-4 font-semibold">Stok</th>
                <th className="px-6 py-4 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      <span>Memuat data produk...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredProduk.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <Package size={36} className="text-gray-300" />
                      <span>Belum ada data produk aktif</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProduk.map((produk, index) => (
                  <tr key={produk.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-gray-400 font-medium">{index + 1}</td>
                    <td className="px-6 py-4 font-semibold text-dark">{produk.namaProduk}</td>
                    <td className="px-6 py-4 text-gray-500">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                        {produk.kategori || 'Makanan'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{formatRupiah(produk.harga)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        produk.stok > 10 ? 'bg-green-100 text-green-700' :
                        produk.stok > 0 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {produk.stok}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(produk)}
                          className="p-2 rounded-lg text-gray-400 hover:text-secondary hover:bg-secondary/10 transition-colors"
                          title="Edit Produk"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteConfirm(produk)}
                          className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
                          title="Nonaktifkan Produk"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingProduk ? 'Edit Produk' : 'Tambah Produk Baru'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
              {formError}
            </div>
          )}
          <Input
            label="Nama Produk"
            icon={Package}
            placeholder="Contoh: Bakso Urat"
            value={formData.namaProduk}
            onChange={(e) => setFormData({ ...formData, namaProduk: e.target.value })}
          />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-dark block">Kategori</label>
            <select
              value={formData.kategori}
              onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
            >
              <option value="Makanan">Makanan</option>
              <option value="Minuman">Minuman</option>
              <option value="Dessert">Dessert</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>
          <Input
            label="Harga (Rp)"
            type="text"
            placeholder="Contoh: 15.000"
            value={formData.harga ? new Intl.NumberFormat('id-ID').format(formData.harga) : ''}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, '');
              setFormData({ ...formData, harga: raw });
            }}
          />
          <Input
            label="Stok"
            type="number"
            placeholder="Contoh: 50"
            value={formData.stok}
            onChange={(e) => setFormData({ ...formData, stok: e.target.value })}
          />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsFormOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" className="flex-1" isLoading={isSaving}>
              {editingProduk ? 'Simpan Perubahan' : 'Tambah Produk'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete/Deactivate Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Konfirmasi Penonaktifan"
        size="sm"
      >
        <div className="text-center py-2">
          <div className="mx-auto w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <AlertTriangle size={28} className="text-primary" />
          </div>
          <p className="text-dark font-medium mb-1">Nonaktifkan produk ini?</p>
          <p className="text-gray-400 text-sm mb-6 animate-fade-in">
            <span className="font-semibold text-dark">{deletingProduk?.namaProduk}</span> akan dinonaktifkan (diarsipkan) selama 30 hari sebelum dihapus permanen.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setIsDeleteOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" className="flex-1" isLoading={isSaving} onClick={handleDelete}>
              Ya, Nonaktifkan
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default KelolaProduk;
