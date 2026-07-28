# Wireframe Aplikasi Kasir

Dokumen ini berisi rancangan wireframe (tata letak) setiap modul dan fitur dari aplikasi, disusun berdasarkan urutan modul yang spesifik. Setiap elemen UI (seperti Logo, Tombol, Form, Tabel) direpresentasikan dengan keterangan teks dalam tanda kurung siku `[ ... ]`.

---

## 0. Tata Letak Utama (Global Layout)
*Struktur ini akan membungkus semua halaman, kecuali halaman Login dan Antrian FIFO.*

```text
+-----------------------+-------------------------------------------------+
|      [SIDEBAR]        |                    [HEADER]                     |
|                       | [Tombol Toggle Sidebar]    [Nama & Role Akun]   |
+-----------------------+-------------------------------------------------+
| [LOGO APLIKASI]       |                                                 |
|                       |                [AREA KONTEN UTAMA]              |
| [HIRARKI NAVIGASI]    |                                                 |
| 1. Dashboard          | - Area ini akan menampilkan isi dari modul      |
| 2. Kelola User        |   yang dipilih dari Sidebar (seperti tabel,     |
| 3. Kelola Produk      |   form input, atau keranjang pesanan).          |
| 4. Produk Deaktif     |                                                 |
| 5. Input Pesanan      |                                                 |
| 6. Antrian FIFO       |                                                 |
| 7. Riwayat Penjualan  |                                                 |
|                       |                                                 |
| [Tombol Logout]       |                                                 |
+-----------------------+-------------------------------------------------+
```

---

## 1. Modul Login (`Login.jsx`)
```text
+-------------------------------------------------------------------------+
|                                                                         |
|                            [LOGO APLIKASI]                              |
|                                                                         |
|                +---------------------------------------+                |
|                | [Judul: Form Login]                   |                |
|                |                                       |                |
|                | [Label: Username]                     |                |
|                | [Input Box: Teks Username]            |                |
|                |                                       |                |
|                | [Label: Password]                     |                |
|                | [Input Box: Teks Password]            |                |
|                |                                       |                |
|                | [Tombol: Masuk Sistem]                |                |
|                +---------------------------------------+                |
|                                                                         |
+-------------------------------------------------------------------------+
```

---

## 2. Modul Dashboard (`Dashboard.jsx`)
```text
+-------------------------------------------------------------------------+
| [Judul Halaman: Dashboard Analytics]                                    |
+-------------------------------------------------------------------------+
|                                                                         |
| [Kartu Info 1: Total Pendapatan]   [Kartu Info 2: Total Transaksi]      |
| [Kartu Info 3: Total Item Terjual]                                      |
|                                                                         |
+-------------------------------------------------------------------------+
|                                                                         |
| [Grafik Visual: Tren Penjualan Harian/Mingguan]                         |
|                                                                         |
+-------------------------------------------------------------------------+
|                                                                         |
| [Tabel Ringkas: Daftar Transaksi Terakhir]                              |
| - Kolom: ID Transaksi, Waktu, Total Belanja, Status Pesanan             |
|                                                                         |
+-------------------------------------------------------------------------+
```

---

## 3. Modul Kelola User (`KelolaUser.jsx`)
```text
+-------------------------------------------------------------------------+
| [Judul: Manajemen Pengguna]                  [Tombol: Tambah User Baru] |
+-------------------------------------------------------------------------+
| [Input Box: Cari Username / Nama Lengkap]                               |
+-------------------------------------------------------------------------+
| [Tabel Data Pengguna]                                                   |
| - Kolom 1: Username                                                     |
| - Kolom 2: Nama Lengkap                                                 |
| - Kolom 3: Role (Admin / Kasir)                                         |
| - Kolom 4: Status Akun (Aktif / Non-aktif)                              |
| - Kolom 5: [Fitur Aksi: Tombol Edit] [Fitur Aksi: Tombol Ubah Status]   |
+-------------------------------------------------------------------------+
| [Pagination: Navigasi Halaman Tabel]                                    |
+-------------------------------------------------------------------------+
```

---

## 4. Modul Kelola Produk (`KelolaProduk.jsx`)
```text
+-------------------------------------------------------------------------+
| [Judul: Manajemen Produk]                    [Tombol: Tambah Produk]    |
+-------------------------------------------------------------------------+
| [Input Box: Cari Nama Produk]                [Filter: Kategori Produk]  |
+-------------------------------------------------------------------------+
| [Tabel Data Produk]                                                     |
| - Kolom 1: Gambar Produk                                                |
| - Kolom 2: Nama Produk                                                  |
| - Kolom 3: Kategori Produk                                              |
| - Kolom 4: Harga Satuan                                                 |
| - Kolom 5: Stok Tersedia                                                |
| - Kolom 6: [Fitur Aksi: Tombol Edit] [Fitur Aksi: Tombol Non-aktifkan]  |
+-------------------------------------------------------------------------+
| [Pagination: Navigasi Halaman Tabel]                                    |
+-------------------------------------------------------------------------+
```

---

## 5. Modul Kelola Produk Deaktif (`ProdukDeaktif.jsx`)
```text
+-------------------------------------------------------------------------+
| [Judul: Arsip Produk Non-Aktif]              [Tombol: Kembali ke Produk]|
+-------------------------------------------------------------------------+
| [Input Box: Cari Nama Produk]                                           |
+-------------------------------------------------------------------------+
| [Tabel Data Arsip Produk]                                               |
| - Kolom 1: ID Produk / Kode                                             |
| - Kolom 2: Nama Produk                                                  |
| - Kolom 3: Kategori Produk                                              |
| - Kolom 4: Tanggal Dinonaktifkan                                        |
| - Kolom 5: [Fitur Aksi: Tombol Aktifkan Kembali / Restore]              |
+-------------------------------------------------------------------------+
| [Pagination: Navigasi Halaman Tabel]                                    |
+-------------------------------------------------------------------------+
```

---

## 6. Modul Input Pesanan / Kasir POS (`InputPesanan.jsx`)
```text
+----------------------------------------+--------------------------------+
| [Input Box: Cari Nama Produk]          | [Judul: Area Keranjang]        |
| [Filter: Kategori Makanan/Minuman]     | [Input Box: Nama Pelanggan]    |
+----------------------------------------+--------------------------------+
|                                        |                                |
| [Grid Daftar Produk Tersedia]          | [Daftar Item Pesanan Terpilih] |
| - [Kartu Produk: Gambar, Nama, Harga]  | - [Item 1: Nama, Qty, Harga]   |
| - [Kartu Produk: Gambar, Nama, Harga]  |   [Fitur: Tambah/Kurang Qty]   |
| - [Kartu Produk: Gambar, Nama, Harga]  | - [Fitur Aksi: Tombol Hapus]   |
| - ... dst                              |                                |
|                                        | [Info: Subtotal Biaya]         |
| [Pagination: Navigasi Halaman Produk]  | [Info: Pajak / Diskon (opsi)]  |
|                                        | [Info: Total Biaya Akhir]      |
|                                        |                                |
|                                        | [Tombol: Proses Pembayaran]    |
|                                        | [Tombol: Batalkan Pesanan]     |
|                                        |                                |
+----------------------------------------+--------------------------------+
```

---

## 7. Modul Antrian FIFO (`MonitorAntrian.jsx`)
*Catatan: Halaman ini tampil layar penuh (full-screen) untuk dipantau oleh pelanggan, memisahkan status pesanan secara FIFO (First In First Out).*
```text
+-------------------------------------------------------------------------+
|                            [LOGO APLIKASI]                              |
|                            [Judul: MONITOR ANTRIAN]                     |
+-----------------------------------+-------------------------------------+
| [Kolom Kiri: PESANAN DIPROSES]    | [Kolom Kanan: PESANAN SELESAI]      |
|                                   |                                     |
| - [Daftar: Nomor Antrian 1]       | - [Daftar: Nomor Antrian A]         |
| - [Daftar: Nomor Antrian 2]       | - [Daftar: Nomor Antrian B]         |
| - [Daftar: Nomor Antrian 3]       | - [Daftar: Nomor Antrian C]         |
|                                   |                                     |
+-----------------------------------+-------------------------------------+
| [Fitur Teks Berjalan: Informasi / Pengumuman untuk Pelanggan]           |
+-------------------------------------------------------------------------+
```

---

## 8. Modul Riwayat Penjualan (`RiwayatPenjualan.jsx`)
```text
+-------------------------------------------------------------------------+
| [Judul: Laporan & Riwayat Penjualan]                                    |
+-------------------------------------------------------------------------+
| [Filter: Rentang Tanggal Mulai s/d Selesai]          [Tombol: Cari]     |
|                                                      [Tombol: Ekspor]   |
+-------------------------------------------------------------------------+
| [Tabel Data Riwayat Transaksi]                                          |
| - Kolom 1: Nomor Nota / ID Transaksi                                    |
| - Kolom 2: Tanggal & Waktu                                              |
| - Kolom 3: Nama Pelanggan                                               |
| - Kolom 4: Total Jumlah Item                                            |
| - Kolom 5: Total Pembayaran (Rp)                                        |
| - Kolom 6: [Fitur Aksi: Tombol Cetak Ulang Nota]                        |
+-------------------------------------------------------------------------+
| [Pagination: Navigasi Halaman Tabel]                                    |
+-------------------------------------------------------------------------+
```
