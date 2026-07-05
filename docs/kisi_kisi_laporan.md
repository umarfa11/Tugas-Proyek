# Kisi-Kisi Penulisan Laporan Proyek: Aplikasi KASIR BAKSOKU

Dokumen ini berisi kerangka (kisi-kisi) komprehensif, arsitektur teknis, dan struktur proyek **KASIR BAKSOKU** untuk mempermudah Anda dalam menyusun laporan tugas akhir, skripsi, atau laporan proyek pengembangan perangkat lunak.

---

## BAB I: PENDAHULUAN

### 1.1 Latar Belakang Masalah
*   **Konteks Operasional:** Proses pelayanan dan pemesanan di warung bakso umumnya masih bersifat manual atau belum terkomputerisasi dengan baik (menggunakan kertas, antrian rawan diserobot pelanggan lain).
*   **Identifikasi Masalah:**
    *   Ketidakakuratan urutan pelayanan pesanan (*first-come, first-served*) terutama pada jam sibuk.
    *   Kehilangan draf pesanan apabila kasir tidak sengaja berpindah halaman web sebelum transaksi selesai.
    *   Lambatnya pemuatan data transaksi masa lalu karena pembacaan data yang tidak efisien (*N+1 query issue*).
    *   Pencatatan laporan keuangan harian dan stok produk yang rentan salah hitung.
*   **Solusi:** Membangun aplikasi kasir (*Point of Sale*) digital berbasis web yang dilengkapi dengan sistem antrian FIFO (*First In First Out*), retensi draf pesanan lokal (*localStorage persistence*), optimasi performa database, dan antarmuka premium berbasis gradasi warna brand (Salmon & Teal).

### 1.2 Rumusan Masalah
1.  Bagaimana merancang sistem kasir yang dapat mengelola antrian secara otomatis berdasarkan urutan masuk (FIFO)?
2.  Bagaimana mencegah hilangnya draf pesanan kasir ketika berpindah halaman web secara tidak sengaja?
3.  Bagaimana mengoptimalkan query database agar pemuatan laporan penjualan dan performa transaksi tetap cepat meskipun database berada di cloud dengan latensi tinggi?
4.  Bagaimana mengimplementasikan sistem multi-hak akses (Super Admin dan Kasir) untuk keamanan data?

### 1.3 Tujuan Proyek
*   Mengembangkan aplikasi kasir digital terintegrasi dengan penomoran antrian yang mereset secara otomatis setiap 24 jam.
*   Menerapkan penyimpanan draf transaksi secara otomatis untuk meningkatkan efisiensi operasional kasir.
*   Menerapkan teknik optimasi database (batching queries, date filtering, indexing) untuk mengatasi masalah performa sistem.

---

## BAB II: LANDASAN TEORI

### 2.1 Konsep dan Metodologi
*   **Algoritma Antrian FIFO (First In First Out):** Metode antrian di mana pesanan yang pertama kali masuk akan diproses dan diselesaikan terlebih dahulu untuk menjaga keadilan pelayanan.
*   **Role-Based Access Control (RBAC):** Pembagian hak akses pengguna ke dalam role tertentu (Super Admin untuk kelola produk/user/laporan, Kasir untuk transaksi/monitor antrian).
*   **Database Indexing:** Struktur data khusus untuk mempercepat pencarian data di database tanpa melakukan pemindaian menyeluruh (*full table scan*).
*   **Optimasi N+1 Query:** Menggabungkan pencarian berulang dalam perulangan (*loop*) menjadi satu query massal (*batch query*) menggunakan operator `IN` pada database.

### 2.2 Teknologi yang Digunakan
*   **Frontend:**
    *   **React.js & Vite:** Library UI berbasis komponen dan bundler super cepat untuk Single Page Application (SPA).
    *   **Tailwind CSS (v4):** Framework CSS berbasis utilitas untuk mendesain antarmuka premium dengan gradasi warna modern.
    *   **Zustand:** State management sederhana dan ringan untuk autentikasi user.
*   **Backend:**
    *   **Node.js & Express.js:** Runtime environment dan web framework untuk RESTful API.
    *   **Prisma ORM:** Object-Relational Mapping modern untuk interaksi aman dengan MySQL.
*   **Database:**
    *   **MySQL:** Sistem manajemen database relasional (RDBMS) untuk menyimpan data produk, transaksi, dan user.

---

## BAB III: ARSITEKTUR DAN PERANCANGAN SISTEM

### 3.1 Struktur Proyek (Directory Structure)
Sistem ini menggunakan arsitektur monorepo yang memisahkan frontend dan backend secara bersih:

```text
App Kasir/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Skema database dan relasi tabel (Prisma)
│   │   └── seed.js             # Seed data awal untuk pengujian
│   ├── src/
│   │   ├── controllers/        # Logika bisnis (pesanan, produk, riwayat, auth)
│   │   ├── routes/             # Defini endpoint API Express.js
│   │   ├── services/           # Helper utilitas backend
│   │   └── server.js           # Entrypoint server Express
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/         # Komponen UI reusable (Button, Input, Modal, Sidebar)
│   │   ├── pages/              # Halaman utama aplikasi (Dashboard, POS, Antrian, dll)
│   │   ├── services/           # Koneksi API menggunakan Axios
│   │   ├── store/              # State management auth (Zustand)
│   │   ├── App.jsx             # Router utama aplikasi
│   │   └── index.css           # Styling Tailwind CSS v4 & custom animations
│   └── package.json
└── docs/
    └── kisi_kisi_laporan.md    # Dokumen panduan laporan ini
```

### 3.2 Relasi Database (Entity Relationship Diagram - ERD)
Sistem memiliki 4 entitas utama di dalam database:
1.  **User (Akun):** Menyimpan informasi autentikasi (`id`, `nama`, `username`, `password`, `role`).
2.  **Produk:** Menyimpan data menu bakso (`id`, `namaProduk`, `harga`, `stok`, `kategori`).
3.  **Pesanan:** Menyimpan master transaksi (`id`, `namaPembeli`, `totalHarga`, `nominalDiterima`, `kembalian`, `nomorAntrian`, `statusPesanan`, `enteredAt`, `completedAt`).
4.  **DetailPesanan:** Relasi *many-to-many* antara pesanan dan produk (`id`, `pesananId`, `produkId`, `jumlah`, `subtotal`).

---

## BAB IV: IMPLEMENTASI DAN FITUR UNGGULAN

### 4.1 Redesign POS Antarmuka Premium
*   Desain visual yang ditingkatkan dengan memadukan warna gradasi pada elemen-elemen penting:
    *   **Body Background:** Gradasi diagonal lembut (`linear-gradient`) dari rona Salmon (`#fff5f5`) ke Teal (`#f0fdfa`) untuk menghilangkan kesan putih polos.
    *   **Tombol Interaktif:** Tombol kategori aktif dan tombol checkout kasir menggunakan gradasi warna *brand* yang dinamis (`bg-gradient-to-r from-primary to-rose-500`) dengan efek hover mengangkat (*translate-y*) dan bayangan pendar (*glow shadow*).
    *   **Digital Receipt Panel:** Panel struk belanja kasir dihiasi gradasi diagonal putih ke abu-abu transparan untuk pemisahan layout yang elegan.

### 4.2 Retensi Draf Pemesanan (localStorage)
*   Menggunakan state terintegrasi dengan `localStorage` (`bakso_draft_cart` dan `bakso_draft_name`).
*   Jika kasir tidak sengaja menutup tab browser atau berpindah halaman (misal ke halaman produk), draf keranjang belanjaan dan nama pembeli akan tetap utuh saat kasir kembali. Draf otomatis dihapus hanya setelah tombol *Cetak Struk/Bayar* sukses dijalankan.

### 4.3 Reset Antrian Otomatis 24 Jam
*   Logika backend pada `createPesanan` dikonfigurasi untuk memeriksa waktu lokal server hari berjalan sejak jam `00:00:00`.
*   Jika transaksi pertama pada hari tersebut masuk, nomor antrian akan diset ulang menjadi `1`. Transaksi berikutnya pada hari yang sama akan bertambah secara berurutan (`2`, `3`, dst.).

### 4.4 Optimasi Kueri & Database (Performance Tuning)
*   **Penyelesaian Masalah N+1:** Pada pengecekan stok produk saat pemesanan, kueri database yang sebelumnya berjalan di dalam perulangan `for` diganti menjadi satu kali kueri massal menggunakan filter `in` (`prisma.produk.findMany({ where: { id: { in: ids } } })`). Hal ini memangkas waktu checkout dari database cloud.
*   **Pembatasan Range Dasbor:** Pemuatan halaman dasbor dibatasi secara otomatis hanya menarik data riwayat transaksi tahun berjalan (`startDate=${currentYear}-01-01`), mengurangi transfer data *payload* API secara masif.
*   **Database Indexing:** Menambahkan indeks khusus pada tabel MySQL menggunakan Prisma:
    ```prisma
    @@index([statusPesanan])
    @@index([completedAt])
    ```
    Indeks ini mempercepat proses filter grafik dasbor dan pencarian riwayat penjualan harian.

---

## BAB V: PENGUJIAN DAN KESIMPULAN

### 5.1 Skenario Pengujian (Blackbox Testing)
1.  **Pengujian Autentikasi:** Mencoba masuk dengan kredensial salah (Ekspektasi: Penolakan API JWT -> Hasil: Sesuai).
2.  **Pengujian Pembatasan Stok:** Menginput pesanan melebihi jumlah sisa stok produk (Ekspektasi: Validasi backend menolak transaksi -> Hasil: Sesuai).
3.  **Pengujian Pindah Halaman POS:** Memasukkan menu ke keranjang belanja, pindah ke halaman kelola akun, lalu kembali ke halaman input pesanan (Ekspektasi: Item belanjaan masih tersimpan di keranjang -> Hasil: Sesuai).
4.  **Pengujian Pergantian Hari Antrian:** Mengubah tanggal server ke hari esok lalu melakukan transaksi (Ekspektasi: Nomor antrian mencetak angka 1 -> Hasil: Sesuai).

### 5.2 Kesimpulan
*   Aplikasi kasir berhasil dioptimalkan baik dari segi tampilan visual (modern premium dengan gradasi brand) maupun performa backend (bebas dari isu kueri N+1 dan lambatnya load database cloud).
*   Fitur penomoran antrian FIFO harian mempermudah manajemen antrian fisik di warung bakso secara terstruktur dan adil.
