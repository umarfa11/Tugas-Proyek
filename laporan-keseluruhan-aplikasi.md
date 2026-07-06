# Laporan Implementasi Sistem: KASIR BAKSOKU

Dokumen ini memuat uraian komprehensif namun ringkas mengenai keseluruhan arsitektur, teknologi, serta fitur yang diimplementasikan pada aplikasi KASIR BAKSOKU. Bahasa yang digunakan telah disesuaikan dengan standar penulisan laporan akademik/skripsi.

## 1. Arsitektur dan Teknologi (*Tech Stack*)
Sistem ini dikembangkan menggunakan pendekatan aplikasi berbasis web modern dengan arsitektur *Client-Server*. Pemilihan teknologi dirancang agar sistem berjalan cepat, aman, dan mudah dikelola (*scalable*).
*   **Antarmuka Pengguna (*Frontend*):** Dikembangkan menggunakan **React.js** (didukung *build-tool* Vite) guna mencapai performa yang optimal. Penataan visual (*styling*) memanfaatkan kerangka kerja **Tailwind CSS**, sementara pengelolaan status (*state management*) secara terpusat menggunakan **Zustand**. Pengaturan rute halaman ditangani oleh pustaka **React Router DOM**.
*   **Sistem Sisi Server (*Backend*):** Dibangun di atas lingkungan **Node.js** dengan *framework* **Express.js**, memfasilitasi penyediaan dan pengolahan API yang responsif.
*   **Manajemen Basis Data:** Menggunakan **MySQL** sebagai sistem manajemen basis data relasional (RDBMS). Basis data ini diintegrasikan dengan aplikasi menggunakan **Prisma ORM** (*Object-Relational Mapping*) untuk memastikan operasi *query* berjalan aman dan mencegah anomali skema.

## 2. Fitur Inti Sistem
Aplikasi KASIR BAKSOKU menyediakan serangkaian fitur yang dirancang secara khusus untuk memenuhi kebutuhan operasional:
*   **Autentikasi dan Hak Akses (*Role-Based Access Control*):** Menggunakan token JWT (*JSON Web Token*) untuk mengamankan sesi pengguna. Sistem memisahkan peran dengan tegas; **Super Admin** memiliki kontrol penuh atas manajemen data dan laporan, sedangkan **Kasir** hanya berwenang mengakses modul operasional seperti pembuatan pesanan dan pemantauan antrian.
*   **Dasbor Analitik (*Real-Time Dashboard*):** Menampilkan ringkasan metrik kinerja operasional, termasuk total pendapatan dan visualisasi tren penjualan berbasis grafik batang (*Bar Chart*).
*   **Manajemen Produk Berbasis *Soft-Delete*:** Modul CRUD (Tambah, Baca, Ubah, Hapus) menu. Produk yang dihapus hanya disembunyikan (*soft-delete*) demi mempertahankan integritas data pada struk transaksi terdahulu. Sistem secara otomatis akan membersihkan data produk secara permanen apabila telah dinonaktifkan lebih dari 30 hari.
*   **Sistem Kasir (*Point of Sale*) dan Antrian:** Mesin kasir yang terintegrasi dengan penghitungan subtotal cerdas dan validasi stok otomatis. Tersedia dukungan berbagai metode pembayaran, mulai dari tunai hingga QRIS. Sistem ini mampu mencetak struk secara presisi melalui **Printer Thermal Bluetooth 58mm**.
*   **Manajemen Antrian Berurut:** Sistem alokasi nomor antrian berjalan otomatis menggunakan prinsip FIFO (*First-In-First-Out*). Nomor antrian akan tereset secara otomatis (*auto-reset*) ke angka satu setiap pergantian hari.
*   **Laporan Historis:** Fitur riwayat transaksi yang memfasilitasi penyaringan laporan berdasarkan rentang tanggal dan metode pembayaran, serta pencetakan ulang salinan struk transaksi masa lampau.

## 3. Optimalisasi Logika dan Keamanan (*Backend Security*)
Guna mencegah terjadinya kecurangan dan anomali data, sistem menerapkan lapisan pengamanan pada tingkat layanan *backend*:
*   **Anti-Manipulasi Harga:** Kalkulasi total tagihan secara mutlak dilakukan oleh *backend* dengan merujuk pada harga asli dari basis data. Sistem mengabaikan beban harga yang dikirimkan oleh klien, sehingga secara efektif meniadakan celah kerentanan modifikasi muatan data (*payload*).
*   **Transaksi Atomik (*Database Transaction*):** Operasi yang saling bergantung—seperti pembuatan riwayat pesanan, perekaman pembayaran, dan pengurangan nilai stok (*decrement*)—dieksekusi secara bersamaan dalam satu blok tunggal (*atomic*). Pendekatan ini merupakan langkah mitigasi absolut terhadap kendala *Race-Condition*, misalnya kejadian stok bernilai negatif akibat dua kasir memproses pesanan di waktu yang bersamaan.

## 4. Desain Antarmuka dan Pengalaman Pengguna (UI/UX)
Antarmuka sistem mengadopsi prinsip desain perangkat lunak modern tingkat korporat (*SaaS-Grade*) yang berorientasi pada kepuasan pengguna:
*   **Pendekatan *Mobile-First*:** Modul interaksi pada perangkat seluler/ponsel pintar menggunakan bilah navigasi bawah (*Bottom Navigation Bar*) dan mekanisme Laci Geser (*Drawer*) untuk keranjang pesanan. Struktur ini meniru standar kenyamanan pemakaian sistem operasi populer seperti Android dan iOS.
*   **Visual yang Responsif dan Intuitif:** Desain tata letak dirancang agar responsif pada berbagai ukuran layar (*viewport*), menampilkan tipografi yang jelas, serta kartu elemen berbasis ruang kosong (*white-space*) agar mudah dipahami oleh pengguna, termasuk pada bagian *popup modal* transaksi yang memastikan tombol fungsional tidak pernah terpotong di layar yang kecil.
