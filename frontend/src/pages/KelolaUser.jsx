import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, AlertTriangle, ShieldCheck, User, Pencil } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import api from '../services/api';
import useAuthStore from '../store/authStore';

const KelolaUser = () => {
  const { user: currentUser } = useAuthStore();
  const [userList, setUserList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [formData, setFormData] = useState({ nama: '', username: '', password: '', role: 'kasir' });
  const [formError, setFormError] = useState('');

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/auth/users');
      setUserList(res.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAdd = () => {
    setEditingUser(null);
    setFormData({ nama: '', username: '', password: '', role: 'kasir' });
    setFormError('');
    setIsFormOpen(true);
  };

  const handleEdit = (userData) => {
    setEditingUser(userData);
    setFormData({ 
      nama: userData.nama, 
      username: userData.username, 
      password: '', // Leave blank unless they want to change
      role: userData.role 
    });
    setFormError('');
    setIsFormOpen(true);
  };

  const handleDeleteConfirm = (userData) => {
    setDeletingUser(userData);
    setIsDeleteOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.nama || !formData.username || (!editingUser && !formData.password)) {
      setFormError('Field Nama dan Username wajib diisi');
      return;
    }

    setIsSaving(true);
    try {
      if (editingUser) {
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password;
        await api.put(`/auth/users/${editingUser.id}`, updateData);
      } else {
        await api.post('/auth/register', formData);
      }
      setIsFormOpen(false);
      fetchUsers();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Gagal menyimpan data akun');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsSaving(true);
    try {
      await api.delete(`/auth/users/${deletingUser.id}`);
      setIsDeleteOpen(false);
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Gagal menghapus akun');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-dark tracking-tight">Kelola Akun</h1>
          <p className="text-gray-400 text-sm mt-1">Buat atau hapus akun akses untuk Kasir & Admin</p>
        </div>
        <Button 
          icon={Plus} 
          onClick={handleAdd}
          className="bg-gradient-to-r from-primary to-rose-500 text-white shadow-md shadow-primary/30 border-transparent hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5 transition-all py-3 px-6 rounded-xl"
        >
          Buat Akun Baru
        </Button>
      </div>

      {/* List (Redesigned to Modern Grid) */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48 bg-white/50 rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : userList.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-300 bg-white/50 rounded-2xl border border-dashed border-gray-200 p-8 shadow-sm">
          <Users size={48} className="mb-2 text-gray-300" />
          <p className="font-semibold text-gray-400">Belum ada akun terdaftar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userList.map((usr) => (
            <div 
              key={usr.id} 
              className="relative bg-gradient-to-br from-white to-gray-50/50 rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div className="flex justify-between items-start">
                {/* User Avatar & Info */}
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${
                    usr.role === 'super_admin' 
                      ? 'bg-gradient-to-br from-primary/20 to-primary/5 text-primary' 
                      : 'bg-gradient-to-br from-secondary/20 to-secondary/5 text-secondary'
                  }`}>
                    {usr.role === 'super_admin' ? <ShieldCheck size={24} /> : <User size={24} />}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-dark flex items-center gap-2 text-base">
                      {usr.nama}
                      {currentUser?.id === usr.id && (
                        <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full font-semibold">Anda</span>
                      )}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">@{usr.username}</p>
                  </div>
                </div>
              </div>

              {/* Bottom Card Area */}
              <div className="mt-6 pt-4 border-t border-gray-100/60 flex items-center justify-between">
                <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
                  usr.role === 'super_admin' 
                    ? 'bg-primary/10 text-primary border border-primary/20' 
                    : 'bg-secondary/10 text-secondary border border-secondary/20'
                }`}>
                  {usr.role.replace('_', ' ')}
                </span>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-gray-400 font-medium">
                    Dibuat: {formatDate(usr.createdAt)}
                  </span>
                  <button
                    onClick={() => handleEdit(usr)}
                    className="p-2 rounded-xl transition-all text-gray-400 hover:text-secondary hover:bg-secondary/10"
                    title="Edit Akun"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteConfirm(usr)}
                    disabled={currentUser?.id === usr.id}
                    className={`p-2 rounded-xl transition-all ${
                      currentUser?.id === usr.id 
                        ? 'text-gray-200 cursor-not-allowed opacity-30'
                        : 'text-gray-400 hover:text-primary hover:bg-primary/10'
                    }`}
                    title="Hapus Akun"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit User Modal */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingUser ? "Edit Akun" : "Buat Akun Baru"} size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
              {formError}
            </div>
          )}
          
          <Input
            label="Nama Lengkap"
            icon={User}
            placeholder="Contoh: Budi Santoso"
            value={formData.nama}
            onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
          />
          
          <Input
            label="Username"
            placeholder="Username untuk login"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          />
          
          <Input
            label="Password"
            type="password"
            placeholder={editingUser ? "Kosongkan jika tidak diubah" : "Minimal 6 karakter"}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Pilih Role Akses</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'kasir' })}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                  formData.role === 'kasir'
                    ? 'border-secondary bg-secondary/5 text-secondary shadow-sm'
                    : 'border-gray-100 text-gray-400 hover:border-gray-200 hover:bg-gray-50'
                }`}
              >
                <User size={22} />
                <span className="font-bold text-sm">Kasir</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'super_admin' })}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                  formData.role === 'super_admin'
                    ? 'border-primary bg-primary/5 text-primary shadow-sm'
                    : 'border-gray-100 text-gray-400 hover:border-gray-200 hover:bg-gray-50'
                }`}
              >
                <ShieldCheck size={22} />
                <span className="font-bold text-sm">Super Admin</span>
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsFormOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" className="flex-1 bg-gradient-to-r from-primary to-rose-500 border-transparent text-white" isLoading={isSaving}>
              {editingUser ? "Simpan" : "Buat Akun"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Hapus Akun" size="sm">
        <div className="text-center py-2">
          <div className="mx-auto w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <AlertTriangle size={28} className="text-primary" />
          </div>
          <p className="text-dark font-medium mb-1">Hapus akun secara permanen?</p>
          <p className="text-gray-400 text-sm mb-6">
            Akun <span className="font-semibold text-dark">@{deletingUser?.username}</span> tidak akan bisa login lagi ke sistem.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setIsDeleteOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" className="flex-1 bg-gradient-to-r from-primary to-rose-500 border-transparent text-white" isLoading={isSaving} onClick={handleDelete}>
              Ya, Hapus
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default KelolaUser;
