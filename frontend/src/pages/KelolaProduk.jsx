import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Pencil, Trash2, Search, Soup, AlertTriangle, RotateCcw, Bell, 
  Image as ImageIcon, Upload, X, ChevronDown, ChevronUp, Camera, 
  RefreshCw, Check, Smartphone
} from 'lucide-react';
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
  const [isArsipOpen, setIsArsipOpen] = useState(false);

  // Camera & Image states
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraFacing, setCameraFacing] = useState('environment'); // 'environment' (belakang) atau 'user' (depan)
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef(null);
  const nativeCameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  // Form states
  const [formData, setFormData] = useState({ namaProduk: '', harga: '', hargaModal: '', stok: '', kategori: 'Makanan', gambar: null });
  const [previewUrl, setPreviewUrl] = useState(null);
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

  // Camera handlers
  const startCamera = async (facing = 'environment') => {
    setCameraError('');
    setIsCameraOpen(true);
    setCameraFacing(facing);

    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Kamera langsung tidak didukung di browser ini. Silakan gunakan tombol Buka Kamera HP.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      let errMsg = 'Gagal mengakses kamera. Pastikan izin kamera telah diberikan di browser.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errMsg = 'Izin kamera ditolak. Silakan izinkan akses kamera di pengaturan browser.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errMsg = 'Perangkat kamera tidak ditemukan.';
      }
      setCameraError(errMsg);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraOpen(false);
    setCameraError('');
  };

  const switchCamera = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    startCamera(nextFacing);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) {
        setFormError('Gagal memproses gambar dari kamera');
        return;
      }
      const fileName = `foto-produk-${Date.now()}.jpg`;
      const file = new File([blob], fileName, { type: 'image/jpeg' });
      setFormData(prev => ({ ...prev, gambar: file }));
      setPreviewUrl(URL.createObjectURL(file));
      setFormError('');
      stopCamera();
    }, 'image/jpeg', 0.9);
  };

  // Cleanup camera stream
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Attach video stream when modal opened
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream, isCameraOpen]);

  // Open Add Modal
  const handleAdd = () => {
    stopCamera();
    setEditingProduk(null);
    setFormData({ namaProduk: '', harga: '', hargaModal: '', stok: '', kategori: 'Makanan', gambar: null });
    setPreviewUrl(null);
    setFormError('');
    setIsFormOpen(true);
  };

  // Open Edit Modal
  const handleEdit = (produk) => {
    stopCamera();
    setEditingProduk(produk);
    setFormData({
      namaProduk: produk.namaProduk,
      kategori: produk.kategori || 'Makanan',
      harga: String(produk.harga),
      hargaModal: produk.hargaModal ? String(produk.hargaModal) : '',
      stok: String(produk.stok),
      gambar: null,
    });
    // Jika gambar URL utuh (Cloudinary), pakai langsung, jika tidak tambahkan /uploads/
    const imgUrl = produk.gambar ? (produk.gambar.startsWith('http') ? produk.gambar : `/uploads/${produk.gambar}`) : null;
    setPreviewUrl(imgUrl);
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
      setFormError('Semua field (selain gambar) wajib diisi');
      return;
    }

    setIsSaving(true);
    try {
      const data = new FormData();
      data.append('namaProduk', formData.namaProduk);
      data.append('kategori', formData.kategori);
      data.append('harga', formData.harga);
      if (formData.hargaModal) data.append('hargaModal', formData.hargaModal);
      data.append('stok', formData.stok);
      if (formData.gambar) {
        data.append('gambar', formData.gambar);
      } else if (editingProduk && !previewUrl) {
        data.append('removeImage', 'true');
      }

      if (editingProduk) {
        await api.put(`/produk/${editingProduk.id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('/produk', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      setIsFormOpen(false);
      fetchProduk();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Gagal menyimpan data');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setFormError('Ukuran gambar maksimal 5MB');
        return;
      }
      setFormData(prev => ({ ...prev, gambar: file }));
      setPreviewUrl(URL.createObjectURL(file));
      setFormError('');
    }
    if (e.target) e.target.value = '';
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
        <div className="mb-6 rounded-xl bg-red-50 border border-red-200 shadow-sm animate-fade-in transition-all overflow-hidden">
          <div 
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-red-100/50 transition-colors"
            onClick={() => setIsArsipOpen(!isArsipOpen)}
          >
            <div className="flex items-center gap-3">
              <Bell size={20} className="text-red-500 shrink-0" />
              <h3 className="text-sm font-bold text-red-800">
                Notifikasi Produk Dinonaktifkan ({deactivatedProduk.length} Arsip)
              </h3>
            </div>
            {isArsipOpen ? (
              <ChevronUp size={20} className="text-red-500" />
            ) : (
              <ChevronDown size={20} className="text-red-500" />
            )}
          </div>

          {isArsipOpen && (
            <div className="px-4 pb-4 border-t border-red-100/50 pt-3">
              <div className="text-sm text-red-700 space-y-2">
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
          )}
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
                <th className="px-6 py-4 font-semibold">Gambar</th>
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
                  <td colSpan="7" className="px-6 py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      <span>Memuat data produk...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredProduk.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <Soup size={36} className="text-gray-300" />
                      <span>Belum ada data produk aktif</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProduk.map((produk, index) => (
                  <tr key={produk.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-gray-400 font-medium">{index + 1}</td>
                    <td className="px-6 py-4">
                      {produk.gambar ? (
                        <img 
                          src={produk.gambar.startsWith('http') ? produk.gambar : `/uploads/${produk.gambar}`} 
                          alt={produk.namaProduk} 
                          className="w-12 h-12 object-cover rounded-lg border border-gray-100"
                        />
                      ) : produk.kategori === 'Makanan' ? (
                        <img 
                          src="/logo-makanan.jpg"
                          alt={produk.namaProduk} 
                          className="w-12 h-12 object-cover rounded-lg border border-gray-100"
                        />
                      ) : produk.kategori === 'Minuman' ? (
                        <img 
                          src="/logo-minuman.jpg"
                          alt={produk.namaProduk} 
                          className="w-12 h-12 object-cover rounded-lg border border-gray-100"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100 text-gray-300">
                          <ImageIcon size={20} />
                        </div>
                      )}
                    </td>
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
                          className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none bg-emerald-500 hover:bg-emerald-600"
                          title="Nonaktifkan Produk"
                        >
                          <span
                            aria-hidden="true"
                            className="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-x-4"
                          />
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
            icon={Soup}
            placeholder="Contoh: Bakso Urat"
            value={formData.namaProduk}
            onChange={(e) => setFormData({ ...formData, namaProduk: e.target.value })}
          />
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-dark">Foto Produk (Opsional)</label>
              <span className="text-[11px] text-gray-400">Maks. 5MB</span>
            </div>

            {/* Hidden Inputs */}
            {/* 1. Native mobile camera input (langsung buka kamera HP saat disentuh) */}
            <input
              type="file"
              ref={nativeCameraInputRef}
              accept="image/*"
              capture="environment"
              onChange={handleImageChange}
              className="hidden"
            />
            {/* 2. Gallery / file picker input */}
            <input
              type="file"
              ref={galleryInputRef}
              accept="image/png, image/jpeg, image/webp"
              onChange={handleImageChange}
              className="hidden"
            />

            {previewUrl ? (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-2xl flex items-center gap-3.5">
                <div className="relative shrink-0">
                  <img 
                    src={previewUrl} 
                    alt="Preview Produk" 
                    className="w-20 h-20 object-cover rounded-xl border border-gray-200 shadow-2xs" 
                  />
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-xs">
                    <Check size={12} strokeWidth={3} />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-gray-800 block truncate">
                    {formData.gambar?.name || 'Foto Produk Terpasang'}
                  </span>
                  <span className="text-[11px] text-emerald-600 font-medium block mt-0.5">
                    ✓ Siap disimpan ke katalog
                  </span>

                  {/* Tombol ganti/ambil ulang */}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => nativeCameraInputRef.current?.click()}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:text-primary/80 bg-primary/10 px-2 py-1 rounded-md transition-colors cursor-pointer"
                      title="Ambil foto ulang menggunakan kamera HP"
                    >
                      <Camera size={12} /> Kamera HP
                    </button>
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-600 hover:text-gray-900 bg-gray-200/80 px-2 py-1 rounded-md transition-colors cursor-pointer"
                      title="Pilih foto lain dari galeri"
                    >
                      <Upload size={12} /> Galeri
                    </button>
                    <button
                      type="button"
                      onClick={() => { setPreviewUrl(null); setFormData({ ...formData, gambar: null }); }}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-500 hover:text-red-700 hover:underline cursor-pointer"
                    >
                      <X size={12} /> Hapus
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2.5">
                  {/* TOMBOL 1: AMBIL FOTO LANGSUNG DARI KAMERA HP */}
                  <button
                    type="button"
                    onClick={() => nativeCameraInputRef.current?.click()}
                    className="p-3.5 border-2 border-dashed border-primary/40 rounded-xl bg-primary/5 hover:bg-primary/10 hover:border-primary transition-all flex flex-col items-center justify-center text-center cursor-pointer group active:scale-98"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform shadow-2xs">
                      <Camera size={20} />
                    </div>
                    <span className="text-xs font-black text-primary">Kamera HP</span>
                    <span className="text-[10px] text-gray-500 mt-0.5 leading-tight">Ambil Foto Langsung</span>
                  </button>

                  {/* TOMBOL 2: PILIH DARI GALERI */}
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="p-3.5 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100 hover:border-gray-300 transition-all flex flex-col items-center justify-center text-center cursor-pointer group active:scale-98"
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform shadow-2xs">
                      <Upload size={18} />
                    </div>
                    <span className="text-xs font-bold text-gray-700">Pilih Galeri</span>
                    <span className="text-[10px] text-gray-400 mt-0.5 leading-tight">Album / File HP</span>
                  </button>
                </div>

                {/* Alternatif Live Viewfinder Kamera (Webcam / Layar) */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => startCamera('environment')}
                    className="text-[11px] font-semibold text-primary/80 hover:text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Smartphone size={12} /> Buka Bidikan Kamera Layar (Live Screen)
                  </button>
                </div>
              </div>
            )}
          </div>
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
            label="Harga Jual (Rp)"
            type="text"
            placeholder="Contoh: 15.000"
            value={formData.harga ? new Intl.NumberFormat('id-ID').format(formData.harga) : ''}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, '');
              setFormData({ ...formData, harga: raw });
            }}
          />
          <Input
            label="Harga Modal / HPP (Rp)"
            type="text"
            placeholder="Contoh: 10.000 (Opsional)"
            value={formData.hargaModal ? new Intl.NumberFormat('id-ID').format(formData.hargaModal) : ''}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, '');
              setFormData({ ...formData, hargaModal: raw });
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

      {/* Live Camera Modal (Webcam / Viewfinder) */}
      <Modal
        isOpen={isCameraOpen}
        onClose={stopCamera}
        title="Bidikan Kamera Langsung"
        size="md"
      >
        <div className="space-y-4">
          {cameraError ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center space-y-3">
              <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
              <p className="text-sm font-semibold text-red-700">{cameraError}</p>
              <div className="flex gap-2 justify-center pt-2">
                <Button 
                  size="sm" 
                  variant="primary"
                  onClick={() => {
                    stopCamera();
                    nativeCameraInputRef.current?.click();
                  }}
                >
                  Buka Kamera Bawaan HP
                </Button>
                <Button size="sm" variant="outline" onClick={stopCamera}>
                  Batal
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video sm:aspect-4/3 flex items-center justify-center shadow-inner">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted
                className="w-full h-full object-cover"
              />

              {/* Grid overlay for framing */}
              <div className="absolute inset-0 pointer-events-none border border-white/20 grid grid-cols-3 grid-rows-3">
                <div className="border-r border-b border-white/10" />
                <div className="border-r border-b border-white/10" />
                <div className="border-b border-white/10" />
                <div className="border-r border-b border-white/10" />
                <div className="border-r border-b border-white/10" />
                <div className="border-b border-white/10" />
                <div className="border-r border-b border-white/10" />
                <div className="border-r border-b border-white/10" />
                <div />
              </div>

              {/* Controls */}
              <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-6 px-4">
                {/* Switch Camera */}
                <button
                  type="button"
                  onClick={switchCamera}
                  className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/80 transition-all border border-white/20 active:scale-95 cursor-pointer"
                  title="Ganti Kamera Depan / Belakang"
                >
                  <RefreshCw size={18} />
                </button>

                {/* Shutter Button */}
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="w-16 h-16 rounded-full bg-white p-1 shadow-lg active:scale-90 transition-all cursor-pointer flex items-center justify-center group"
                  title="Jepret Foto Sekarang"
                >
                  <div className="w-full h-full rounded-full border-2 border-primary group-hover:bg-primary/10 transition-colors flex items-center justify-center">
                    <Camera size={26} className="text-primary" />
                  </div>
                </button>

                {/* Cancel Button */}
                <button
                  type="button"
                  onClick={stopCamera}
                  className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/80 transition-all border border-white/20 active:scale-95 cursor-pointer"
                  title="Batal"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-gray-400 px-1">
            <span>Arahkan ke produk lalu tekan tombol kamera</span>
            <button
              type="button"
              onClick={() => {
                stopCamera();
                nativeCameraInputRef.current?.click();
              }}
              className="text-primary font-semibold hover:underline cursor-pointer"
            >
              Gunakan Kamera Bawaan HP
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default KelolaProduk;
