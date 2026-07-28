# Kisi-Kisi Laporan Skripsi / Tugas Akhir
**Judul Skripsi (Saran):** Rancang Bangun Sistem Informasi Kasir (Point of Sales) Berbasis Web dengan Implementasi Antrean FIFO pada Kedai Bakso
**Studi Kasus:** Kasir Baksoku

Dokumen ini adalah kerangka (outline) lengkap yang dirancang khusus menyesuaikan dengan kode dan fitur yang telah dikembangkan di proyek **Kasir Baksoku**. Kerangka ini menggunakan standar penulisan skripsi/tugas akhir bidang Informatika atau Sistem Informasi di Indonesia.

---

## BAB I: PENDAHULUAN

### 1.1 Latar Belakang Masalah
*   **Kondisi Saat Ini:** Pencatatan pesanan di kedai bakso umumnya masih manual (kertas) dan sering terjadi antrean yang tidak teratur, terutama pada jam sibuk.
*   **Permasalahan:**
    *   Pesanan sering tidak sesuai urutan (kurangnya sistem *First-In-First-Out* / FIFO).
    *   Sering hilangnya data draf pesanan kasir karena ketidaksengajaan (misal: *refresh* halaman).
    *   Sulitnya melacak ketersediaan stok menu secara *real-time*.
    *   Pembuatan laporan penjualan (harian/bulanan) membutuhkan waktu lama dan rentan *human-error*.
*   **Solusi (Sistem yang Dibangun):** Membangun aplikasi kasir web (POS) yang memiliki antarmuka premium, integrasi sistem antrean FIFO otomatis, manajemen stok menu yang aman (fitur *soft-delete*), dan fitur dasbor pelaporan.

### 1.2 Rumusan Masalah
1.  Bagaimana merancang dan membangun sistem informasi kasir berbasis web yang responsif untuk kedai bakso?
2.  Bagaimana menerapkan sistem antrean dengan algoritma *First-In-First-Out* (FIFO) yang mereset otomatis setiap harinya?
3.  Bagaimana mengimplementasikan fitur persistensi data keranjang (draf) menggunakan *Local Storage* agar data kasir tidak hilang?
4.  Bagaimana membangun sistem manajemen menu yang aman dengan fitur pengarsipan (*deactivation/soft-delete*)?

### 1.3 Batasan Masalah
1.  Sistem dibangun berbasis web menggunakan stack **React.js** (Frontend) dan **Node.js + Express** (Backend).
2.  Pengguna sistem terbagi menjadi dua hak akses utama: **Super Admin** dan **Kasir**.
3.  Sistem pembayaran masih berfokus pada pencatatan (Tunai dan QRIS manual), tidak terintegrasi dengan Payment Gateway (pihak ketiga).

### 1.4 Tujuan Penelitian
1.  Menghasilkan aplikasi Point of Sales (POS) yang mempercepat proses transaksi di kedai bakso.
2.  Menerapkan mekanisme antrean FIFO untuk pelayanan yang lebih adil dan terstruktur.
3.  Mencegah hilangnya data keranjang pesanan kasir yang belum selesai (*checkout*).
4.  Menghasilkan sistem pelaporan penjualan dan manajemen produk yang akurat untuk evaluasi bisnis.

### 1.5 Manfaat Penelitian
*   **Bagi Pemilik (Owner/Super Admin):** Mempermudah pemantauan omset penjualan melalui dasbor dan menjaga keamanan data (hak akses khusus).
*   **Bagi Kasir:** Mempercepat proses pelayanan pelanggan dengan antarmuka yang intuitif dan sistem keranjang anti-hilang.
*   **Bagi Pelanggan:** Mendapatkan pelayanan yang lebih cepat, transparan, dan adil sesuai urutan kedatangan.

---

## BAB II: TINJAUAN PUSTAKA (LANDASAN TEORI)

### 2.1 Konsep Point of Sales (POS)
*   Definisi POS, fungsi utamanya dalam bisnis ritel/F&B, dan perbedaannya dengan mesin kasir tradisional.

### 2.2 Algoritma First-In-First-Out (FIFO) dalam Sistem Antrean
*   Konsep FIFO (pesanan yang masuk lebih dulu akan diproses dan diselesaikan lebih dulu).
*   Penerapannya dalam antarmuka `MonitorAntrian.jsx` dan pembuatan penomoran antrean (*auto-reset* per hari).

### 2.3 Teknologi Web Modern yang Digunakan (Stack)
*   **Frontend:**
    *   **React.js & Vite:** Konsep *Single Page Application* (SPA), *Virtual DOM*, dan kecepatan *build*.
    *   **Tailwind CSS:** Konsep *utility-first* CSS, dan bagaimana Tailwind digunakan untuk membuat desain premium yang dinamis (*gradasi, hover effects*).
    *   **Zustand:** Manajemen *state* untuk sesi login (*Authentication*).
    *   **Local Storage:** Untuk menyimpan *draft cart* (`bakso_draft_cart`).
*   **Backend & Database:**
    *   **Node.js & Express.js:** Arsitektur *backend* berbasis *event-driven* dan RESTful API.
    *   **Prisma ORM:** *Object-Relational Mapping* untuk keamanan kueri, migrasi skema, dan optimasi *N+1 queries*.
    *   **MySQL:** Sistem manajemen basis data relasional.

---

## BAB III: METODOLOGI DAN PERANCANGAN SISTEM

### 3.1 Metode Pengembangan Perangkat Lunak
*   *Sebutkan metode yang Anda gunakan (contoh: Waterfall, Agile, atau Prototyping).*
*   Jelaskan tahapan yang Anda lakukan: Analisis Kebutuhan $\rightarrow$ Desain $\rightarrow$ Implementasi (Coding) $\rightarrow$ Pengujian.

### 3.2 Analisis Kebutuhan Sistem
*   **Kebutuhan Fungsional (Functional Requirements):**
    *   Sistem dapat membedakan akses *Login* untuk Super Admin dan Kasir.
    *   Kasir dapat melakukan *input* pesanan, memasukkan ke keranjang, dan mencetak struk.
    *   Sistem dapat memunculkan nomor antrean yang otomatis mereset di hari berikutnya.
    *   Admin dapat menonaktifkan (*deactive*) produk yang mana produk akan diarsipkan sementara selama 30 hari, bukan dihapus permanen.
*   **Kebutuhan Non-Fungsional (Non-Functional Requirements):**
    *   *User Interface* (UI) harus premium, mudah dibaca, dan responsif.
    *   Sistem harus memuat data dengan cepat menggunakan kueri basis data yang dioptimasi (mengatasi masalah *N+1 query*).

### 3.3 Perancangan Basis Data (ERD - Entity Relationship Diagram)
*Jelaskan 4 tabel utama beserta relasinya sesuai skema Prisma:*
1.  **User:** Menyimpan kredensial (`role`, `username`, `password`).
2.  **Produk:** Menyimpan data menu (`stok`, `harga`, `deactivatedAt`).
3.  **Pesanan:** Menyimpan data transaksi utama, nama pembeli, nomor antrean, dan status pesanan.
4.  **DetailPesanan:** Relasi *many-to-many* untuk mencatat *item* apa saja yang dibeli pada sebuah pesanan.
5.  **Pembayaran:** Mencatat detail bayar (Tunai/QRIS, nominal, kembalian).

### 3.4 Perancangan Sistem (UML / Alur Sistem)
*   **Use Case Diagram:** Gambarkan interaksi Aktor (Kasir vs Super Admin) terhadap fitur-fitur (Kelola Menu, Input Pesanan, Monitor, Dasbor).
*   **Activity Diagram:** (Pilih salah satu fitur utama, misalnya Alur Transaksi Kasir dari *Input* $\rightarrow$ *Checkout* $\rightarrow$ *Struk*).

---

## BAB IV: HASIL DAN PEMBAHASAN (IMPLEMENTASI)

### 4.1 Implementasi Antarmuka (User Interface) Premium
*   Jelaskan bagaimana pendekatan estetik digunakan (gradasi warna *Salmon & Teal*, efek bayangan/*glow*, micro-animasi transisi).
*   **Screenshot 1:** Halaman *Input Pesanan* (Tunjukkan visual keranjang, kategori, dan tombol yang dinamis).
*   **Screenshot 2:** Halaman *Dasbor* (Tunjukkan grafik analitik dan panel riwayat interaktif).

### 4.2 Implementasi Fitur-Fitur Utama (Core Logic)
*   **Fitur Draft Pesanan Anti-Hilang:** Pembahasan logika di `InputPesanan.jsx` yang memanfaatkan `localStorage.getItem('bakso_draft_cart')` untuk menyimpan *state cart* meskipun halaman dimuat ulang.
*   **Fitur Antrean & Monitor:** Pembahasan bagaimana nomor antrean di-*generate* di *backend* (`createPesanan`) dan ditampilkan di layar `MonitorAntrian.jsx`.
*   **Fitur Soft-Delete (Deaktivasi Produk):** Pembahasan logika *backend* produk di mana data tidak langsung di `DELETE`, melainkan kolom `deactivatedAt` diisi dengan waktu sekarang.

### 4.3 Optimasi Performa Sistem (Performance Tuning)
*   **Penyelesaian Masalah N+1:** Tunjukkan perbedaan kode yang semula melakukan pencarian berulang pada pengecekan stok barang, diganti dengan menggunakan metode *batch query* pada Prisma (`id: { in: ids }`).
*   **Database Indexing:** Jelaskan penambahan indeks pada skema Prisma (`@@index([statusPesanan])`) yang membuat proses memuat riwayat transaksi jauh lebih cepat.

### 4.4 Pengujian Sistem (Testing)
*   **Metode:** *Black Box Testing*.
*   **Skenario Uji (Contoh Tabel):**
    *   *Skenario:* Kasir me-refresh halaman web saat sedang menginput pesanan. $\rightarrow$ *Ekspektasi:* Item keranjang tidak hilang. $\rightarrow$ *Hasil:* Sesuai (Lulus).
    *   *Skenario:* Transaksi melebihi stok yang tersedia. $\rightarrow$ *Ekspektasi:* Sistem menolak transaksi dan memunculkan *alert*. $\rightarrow$ *Hasil:* Sesuai (Lulus).
    *   *Skenario:* Mengubah *Role* saat *Login*. $\rightarrow$ *Ekspektasi:* Kasir tidak bisa mengakses halaman Kelola User. $\rightarrow$ *Hasil:* Sesuai (Lulus).

---

## BAB V: KESIMPULAN DAN SARAN

### 5.1 Kesimpulan
1.  Sistem Kasir Baksoku berhasil dibangun dan berjalan dengan stabil menggunakan *stack* React.js dan Node.js.
2.  Penggunaan algoritma *First-In-First-Out* pada sistem antrean sangat membantu dapur untuk fokus pada pesanan yang lebih dulu masuk secara otomatis.
3.  Fitur penyimpanan draf berbasis *Local Storage* sukses mengamankan data transaksi agar tidak terhapus apabila kasir berpindah halaman.
4.  Pemisahan *role* (Super Admin dan Kasir) berfungsi dengan baik untuk keamanan operasional dan sistem dapat berjalan cepat karena adanya optimasi *N+1 query* dan indeks basis data.

### 5.2 Saran
1.  Sistem ke depannya dapat diintegrasikan dengan *Payment Gateway* resmi untuk verifikasi pembayaran QRIS yang otomatis.
2.  Perluasan sistem untuk mendukung cetak struk langsung ke *printer thermal* melalui *bluetooth* atau koneksi LAN *printer*.
3.  Penambahan modul resep masakan untuk memotong stok bahan baku (inventaris *raw material*), bukan hanya stok produk jadi.

---
**Catatan untuk Mahasiswa:**
Gunakan struktur di atas sebagai acuan penyusunan Daftar Isi. Pada Bab IV (Hasil dan Pembahasan), pastikan Anda **melampirkan screenshot kode asli** (contoh kueri Prisma Anda atau komponen React Anda) serta **screenshot tampilan UI aplikasi** untuk memperkuat laporan Anda.
