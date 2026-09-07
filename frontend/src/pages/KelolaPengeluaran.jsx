import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Receipt, AlertTriangle } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import api from '../services/api';

const KelolaPengeluaran = () => {
  const [pengeluaranList, setPengeluaranList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [deletingData, setDeletingData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [formData, setFormData] = useState({ keterangan: '', nominal: '', tanggal: '' });
  const [formError, setFormError] = useState('');

  const fetchPengeluaran = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/pengeluaran');
      setPengeluaranList(res.data);
    } catch (err) {
      console.error('Error fetching pengeluaran:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPengeluaran();
  }, []);

  const handleAdd = () => {
    setEditingData(null);
    const today = new Date().toISOString().split('T')[0];
    setFormData({ keterangan: '', nominal: '', tanggal: today });
    setFormError('');
    setIsFormOpen(true);
  };

  const handleEdit = (item) => {
    setEditingData(item);
    const dateStr = new Date(item.tanggal).toISOString().split('T')[0];
    setFormData({
      keterangan: item.keterangan,
      nominal: String(item.nominal),
      tanggal: dateStr
    });
    setFormError('');
    setIsFormOpen(true);
  };

  const handleDeleteConfirm = (item) => {
    setDeletingData(item);
    setIsDeleteOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.keterangan || !formData.nominal || !formData.tanggal) {
      setFormError('Semua field wajib diisi');
      return;
    }

    setIsSaving(true);
    try {
      if (editingData) {
        await api.put(`/pengeluaran/${editingData.id}`, formData);
      } else {
        await api.post('/pengeluaran', formData);
      }
      setIsFormOpen(false);
      fetchPengeluaran();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Gagal menyimpan data');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsSaving(true);
    try {
      await api.delete(`/pengeluaran/${deletingData.id}`);
      setIsDeleteOpen(false);
      fetchPengeluaran();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus data');
    } finally {
      setIsSaving(false);
    }
  };

  const formatRupiah = (num) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark">Kelola Pengeluaran</h1>
          <p className="text-gray-400 text-sm mt-1">Catat biaya operasional harian (listrik, bahan, dll)</p>
        </div>
        <Button icon={Plus} onClick={handleAdd}>Catat Pengeluaran</Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 text-gray-500 text-left">
                <th className="px-6 py-4 font-semibold">No</th>
                <th className="px-6 py-4 font-semibold">Tanggal</th>
                <th className="px-6 py-4 font-semibold">Keterangan</th>
                <th className="px-6 py-4 font-semibold">Nominal</th>
                <th className="px-6 py-4 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      <span>Memuat data pengeluaran...</span>
                    </div>
                  </td>
                </tr>
              ) : pengeluaranList.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <Receipt size={36} className="text-gray-300" />
                      <span>Belum ada data pengeluaran</span>
                    </div>
                  </td>
                </tr>
              ) : (
                pengeluaranList.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-gray-400 font-medium">{index + 1}</td>
                    <td className="px-6 py-4 text-gray-600">{formatDate(item.tanggal)}</td>
                    <td className="px-6 py-4 font-semibold text-dark">{item.keterangan}</td>
                    <td className="px-6 py-4 text-red-500 font-medium">{formatRupiah(item.nominal)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 rounded-lg text-gray-400 hover:text-secondary hover:bg-secondary/10 transition-colors"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteConfirm(item)}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Hapus"
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

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingData ? 'Edit Pengeluaran' : 'Catat Pengeluaran Baru'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
              {formError}
            </div>
          )}
          
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-dark block">Tanggal</label>
            <input
              type="date"
              value={formData.tanggal}
              onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
              required
            />
          </div>

          <Input
            label="Keterangan"
            icon={Receipt}
            placeholder="Contoh: Beli Gas 3kg"
            value={formData.keterangan}
            onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
          />
          
          <Input
            label="Nominal (Rp)"
            type="text"
            placeholder="Contoh: 25.000"
            value={formData.nominal ? new Intl.NumberFormat('id-ID').format(formData.nominal) : ''}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, '');
              setFormData({ ...formData, nominal: raw });
            }}
          />
          
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsFormOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" className="flex-1" isLoading={isSaving}>
              {editingData ? 'Simpan' : 'Catat'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Hapus Data"
        size="sm"
      >
        <div className="text-center py-2">
          <div className="mx-auto w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <AlertTriangle size={28} className="text-red-500" />
          </div>
          <p className="text-dark font-medium mb-1">Hapus pengeluaran ini?</p>
          <p className="text-gray-400 text-sm mb-6">
            Data pengeluaran "<span className="font-semibold text-dark">{deletingData?.keterangan}</span>" akan dihapus permanen.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setIsDeleteOpen(false)}>
              Batal
            </Button>
            <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white" isLoading={isSaving} onClick={handleDelete}>
              Ya, Hapus
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default KelolaPengeluaran;
