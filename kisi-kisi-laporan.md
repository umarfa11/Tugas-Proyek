# Kisi-Kisi Laporan Proyek: KASIR BAKSOKU (Sistem POS & Antrian Cerdas)

Dokumen ini berisi poin-poin utama (*outline*) dari semua fitur, logika, dan penyempurnaan yang telah dikerjakan di dalam proyek ini. Anda dapat menggunakan poin-poin ini sebagai bahan/kerangka acuan untuk menyusun Laporan Proyek/Tugas Akhir.

---

## 1. Arsitektur & Teknologi (Tech Stack)
*   **Frontend**: React.js (Vite)
*   **Styling**: Tailwind CSS (Utility-first CSS framework untuk UI/UX modern & responsif)
*   **State Management**: Zustand (Cepat, ringan, dan terpusat)
*   **Routing**: React Router DOM
*   **Backend**: Node.js dengan Express.js
*   **Database**: MySQL
*   **ORM (Object-Relational Mapping)**: Prisma (Untuk keamanan *query* dan skema *database* yang terstruktur)

---

## 2. Fitur Inti (Core Features)

### A. Autentikasi & Keamanan (Role-Based Access Control)
*   Menerapkan **JWT (JSON Web Token)** untuk sesi *login* yang aman.
*   Pemisahan hak akses yang ketat antara **Admin (super_admin)** dan **Kasir (kasir)**.
*   Kasir hanya dapat mengakses halaman Input Pesanan dan Monitor Antrian, sementara Admin memiliki kontrol penuh atas seluruh sistem (Laporan, Manajemen User, dsb).

### B. Manajemen Produk (CRUD & Keamanan Data)
*   Fasilitas Tambah, Edit, dan Hapus menu produk beserta unggah (*upload*) gambar.
*   **Logika Soft-Delete (Produk Deaktif)**: Jika produk dihapus, produk tersebut tidak serta-merta hilang dari *database* (untuk mencegah *error/crash* pada Riwayat Penjualan lama), melainkan disembunyikan.
*   **Pembersihan Otomatis (Auto-Cleanup)**: Sistem *backend* akan secara otomatis menghapus permanen (*hard delete*) produk beserta file gambarnya jika produk tersebut sudah dinonaktifkan lebih dari 30 hari.

### C. Sistem Point of Sale / Kasir (Input Pesanan)
*   Antarmuka interaktif untuk memilih produk dan memasukkannya ke keranjang belanja.
*   **Validasi Stok Real-time**: Kasir tidak dapat memasukkan pesanan jika jumlah melebihi stok yang tersedia di *database*.
*   Dukungan metode pembayaran: **Tunai (Cash)** dengan kalkulator otomatis uang kembalian, dan **QRIS (Nontunai)**.
*   **Integrasi Printer Thermal 58mm**: Fitur **Cetak Struk** yang telah dioptimalkan secara presisi menggunakan CSS Print Media (`@page { margin: 0; }`) agar struk langsung tercetak rapi lewat *Bluetooth Printer*.

### D. Sistem Antrian (Monitor Antrian)
*   Papan antrian (*dashboard*) yang menampilkan pesanan berstatus *diproses* dengan metode *First In First Out* (FIFO).
*   **Reset Antrian Otomatis**: Nomor antrian dihitung secara dinamis dan akan kembali (*reset*) ke angka 1 setiap pergantian hari (jam 00:00).
*   Tombol aksi untuk mengubah status pesanan menjadi selesai.

### E. Riwayat Penjualan & Laporan
*   Menampilkan data transaksi masa lalu yang berstatus *selesai*.
*   Fasilitas **Filter Laporan** berdasarkan rentang tanggal (*Start Date* & *End Date*) dan Metode Pembayaran.
*   Fitur untuk melihat detail nota masa lalu dan melakukan **Cetak Struk Ulang**.

---

## 3. Optimalisasi Logic & Keamanan Tingkat Lanjut (Backend)
*   **Anti-Tampering Harga**: *Backend* **tidak** menggunakan total harga yang dikirim dari aplikasi *browser*. *Backend* menghitung ulang total pesanan secara mandiri berdasarkan harga asli dari *database* (`harga x jumlah`). Hal ini menutup celah keamanan peretasan/manipulasi harga dari sisi klien.
*   **Database Transaction (Atomic Operations)**: Menggunakan `prisma.$transaction` saat membuat pesanan baru. Pembuatan nota, pencatatan pembayaran, dan pemotongan stok (`decrement`) dilakukan secara bersamaan secara atomik. Hal ini 100% mencegah **Race-Condition** (seperti bug stok minus jika 2 kasir menekan bayar secara bersamaan).

---

## 4. UI / UX Design & Responsivitas (SaaS-Grade Frontend)
*   **Dashboard Modern**: Memiliki *Dashboard* bergaya *SaaS (Software as a Service)* premium dengan *Bar Chart* berujung bulat, komponen tata letak yang bersih (*clean white cards*), *typography* tebal yang modern, dan efek bayangan (*shadow*) halus yang interaktif.
*   **Mobile-First Experience**: 
    *   Navigasi utama pada perangkat *mobile* tidak menggunakan menu hamburger yang kaku, melainkan menggunakan **Bottom Navigation Bar** (mirip standar navigasi aplikasi Android/iOS pada umumnya).
    *   Sistem Keranjang (*Cart*) pada perangkat *mobile* diimplementasikan menggunakan antarmuka **Floating Action Button (Tombol Melayang)** yang memunculkan **Drawer (Laci Geser)** dari bawah ke atas.
    *   *Modal Popup* Pembayaran dirancang agar bisa di-*scroll* mulus, sehingga tombol *Cetak Struk/Selesai* tidak akan pernah terpotong (off-screen) di layar HP yang paling kecil sekalipun.
*   **Penyelesaian Bug Duplikasi UI**: Penyempurnaan ikonologi pada navigasi untuk membedakan antara ikon Input Pesanan (Toko/Store) dan Keranjang (Troli) sehingga intuitif bagi pengguna awam.

---

*Catatan: Segala implementasi di atas telah berhasil menjadikan aplikasi Kasir Baksoku bukan sekadar aplikasi prototipe tugas biasa, melainkan aplikasi yang "Production-Ready" (siap rilis ke dunia nyata).*
