# Kerangka Laporan Singkat: KASIR BAKSOKU

Berikut adalah *kisi-kisi* atau kerangka singkat yang bisa Anda jadikan panduan utama (daftar isi/poin bahasan) saat menyusun bab pembahasan dalam laporan skripsi:

## 1. Teknologi & Arsitektur Utama
*   **Frontend**: React.js (Vite), Tailwind CSS (Desain), Zustand (State Management).
*   **Backend**: Node.js & Express.js (Pemrosesan API).
*   **Database**: MySQL dengan Prisma ORM.

## 2. Fitur Inti Aplikasi
*   **Manajemen Hak Akses (Role-Based)**: Pemisahan akses aman dengan JWT untuk **Super Admin** (Pemilik) dan **Kasir**.
*   **Manajemen Katalog (Soft-Delete)**: Fitur CRUD menu yang tidak menghapus data secara langsung untuk mencegah hilangnya detail struk transaksi lama.
*   **Sistem Kasir (POS) & Pembayaran**: Fitur keranjang cerdas dengan validasi stok *real-time*, mendukung pembayaran Tunai dan Nontunai (QRIS).
*   **Manajemen Antrian**: Nomor urut otomatis (FIFO) yang diatur ulang (reset) secara otomatis setiap jam 00:00.
*   **Riwayat & Cetak Struk**: Laporan dapat difilter (berdasarkan tanggal/pembayaran), cetak ulang nota, serta kompatibel 100% dengan **Printer Thermal 58mm**.

## 3. Keunggulan Keamanan (Backend)
*   **Anti-Manipulasi Harga**: Perhitungan biaya dihitung sepenuhnya oleh *database/backend*, mencegah celah kecurangan.
*   **Transaksi Atomik (Prisma Transaction)**: Melindungi dari *error Race-Condition* (contoh: stok menjadi minus saat kasir menekan tombol secara serentak).

## 4. Keunggulan Desain (UI/UX)
*   **Tampilan Modern (SaaS-Grade)**: Visual bersih, grafis interaktif (*Bar Chart*), dan adaptif.
*   **Pendekatan Mobile-First**: Navigasi nyaman berbasis ponsel (*Bottom Navigation & Drawer*) yang memastikan tidak ada tombol yang terpotong di layar kecil.
