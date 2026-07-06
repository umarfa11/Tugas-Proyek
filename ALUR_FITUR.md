# Alur Fitur Aplikasi Sistem Kasir / Pemesanan

Dokumen ini menjelaskan alur lengkap dari semua fitur yang ada di dalam aplikasi ini, dibagi berdasarkan peran pengguna (Role) dan fungsionalitas utamanya.

## 1. Sistem Otentikasi dan Otorisasi (Authentication)
Aplikasi ini memiliki sistem login dan manajemen pengguna berbasis peran (Role-Based Access Control).
*   **Peran (Roles):** Terdapat beberapa peran utama seperti `super_admin`, `admin`, dan `kasir`.
*   **Alur Login:** Pengguna memasukkan username dan password di halaman **Login**. Sistem akan memverifikasi kredensial dan memberikan akses (token) berdasarkan peran pengguna.
*   **Manajemen Pengguna (Kelola Akun):** Halaman **Kelola User** (hanya untuk `super_admin`) memungkinkan pembuatan akun baru, pengeditan data akun, dan penghapusan akun staf (seperti kasir atau admin lain).

## 2. Alur Pengguna: Admin (Manajemen Data)
Admin (atau Super Admin) memiliki akses ke fitur-fitur pengelolaan data master aplikasi.

### a. Dashboard
*   Menampilkan ringkasan informasi dan statistik penting seperti total penjualan hari ini, jumlah pesanan aktif, pendapatan bulanan, dan produk terlaris.

### b. Kelola Produk
*   **Lihat Produk:** Admin dapat melihat daftar semua produk yang aktif beserta detail harga, stok, dan kategori.
*   **Tambah Produk:** Admin dapat menambahkan produk baru ke dalam sistem.
*   **Edit Produk:** Admin dapat mengubah detail produk seperti nama, harga, atau gambar.
*   **Nonaktifkan Produk:** Admin dapat menonaktifkan produk yang sudah tidak dijual atau habis (Soft Delete).
*   **Produk Deaktif:** Terdapat halaman khusus (**Produk Deaktif**) untuk melihat daftar produk yang telah dinonaktifkan, di mana admin dapat mengaktifkannya kembali jika diperlukan.

## 3. Alur Pengguna: Kasir (Operasional Pemesanan)
Kasir adalah peran yang berinteraksi langsung dengan pelanggan untuk memproses pesanan.

### a. Input Pesanan
*   Kasir membuka halaman **Input Pesanan**.
*   **Pilih Produk:** Kasir melihat daftar produk yang tersedia dan memilih produk yang dipesan pelanggan beserta jumlahnya.
*   **Detail Pesanan:** Kasir memasukkan nama pelanggan atau nomor meja/antrian.
*   **Checkout/Simpan:** Kasir mengkonfirmasi pesanan dan menyimpannya ke dalam sistem. Pesanan ini akan masuk ke dalam antrian.

### b. Monitor Antrian
*   Halaman **Monitor Antrian** menampilkan daftar pesanan yang sedang diproses (aktif).
*   **Status Pesanan:** Kasir (atau bagian dapur/penyiapan) dapat melihat pesanan mana yang harus disiapkan.
*   **Selesaikan Pesanan:** Setelah pesanan selesai disiapkan dan diserahkan ke pelanggan, kasir dapat menekan tombol untuk mengubah status pesanan menjadi "Selesai". Pesanan akan hilang dari antrian aktif dan masuk ke riwayat penjualan.

## 4. Pelaporan dan Riwayat
Fitur ini digunakan untuk memantau kinerja penjualan.

### a. Riwayat Penjualan
*   Halaman **Riwayat Penjualan** menampilkan seluruh data pesanan yang telah berstatus "Selesai".
*   Admin atau pihak manajemen dapat melihat detail transaksi masa lalu, filter berdasarkan tanggal, dan melihat total pendapatan dari transaksi-transaksi tersebut.

---
**Ringkasan Alur Pemesanan Utama (End-to-End):**
1. Pelanggan datang -> 2. **Kasir** input pesanan (`InputPesanan.jsx`) -> 3. Pesanan masuk ke **Monitor Antrian** (`MonitorAntrian.jsx`) -> 4. Pesanan disiapkan -> 5. Pesanan ditandai "Selesai" di Monitor Antrian -> 6. Pesanan masuk ke **Riwayat Penjualan** (`RiwayatPenjualan.jsx`) dan data pendapatan masuk ke **Dashboard** (`Dashboard.jsx`).