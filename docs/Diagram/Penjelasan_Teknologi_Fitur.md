# Laporan Penjelasan Teknologi dan Fitur Aplikasi Kasir Baksoku

Dokumen ini merincikan spesifikasi teknologi, arsitektur sistem, dan deskripsi fungsionalitas fitur-fitur yang diterapkan pada aplikasi **Kasir Baksoku**. Sistem ini merupakan aplikasi *Point of Sales* (POS) dan manajemen inventaris berbasis web yang dikembangkan menggunakan arsitektur *Client-Server* modern.

---

## 1. Spesifikasi Teknologi Sistem (Tech Stack)

Sistem dibangun menggunakan pendekatan pengembangan aplikasi modern berbasis *Full-Stack JavaScript/TypeScript* untuk memastikan performa yang cepat, interaktivitas tinggi, serta skalabilitas sistem dalam jangka panjang.

### 1.1 Front-End (Antarmuka Pengguna)
Bagian antarmuka pengguna (Frontend) dibangun sebagai *Single Page Application* (SPA) dengan teknologi berikut:
- **React.js (v19) via Vite (v8):** *Library* JavaScript utama yang digunakan untuk membangun antarmuka pengguna secara modular (berbasis komponen) dengan *Virtual DOM* untuk render performa tinggi. Penggunaan *bundler* Vite memberikan proses *Build* dan *Hot Module Replacement* (HMR) yang sangat cepat.
- **Tailwind CSS (v4) & PostCSS (v8):** *Framework* CSS berbasis *utility-first* yang digunakan untuk penataan gaya visual antarmuka secara responsif, modern, dan konsisten tanpa perlu menulis file CSS eksternal secara ekstensif.
- **Zustand (v5):** *State Management library* yang ringan dan cepat untuk mengelola *global state* aplikasi, seperti data pengguna yang sedang login (*auth state*), manajemen data keranjang (POS), dan state antrean UI tanpa terjadi masalah *prop-drilling* antar komponen.
- **React Router DOM (v7):** Digunakan untuk manajemen rute aplikasi secara internal di sisi klien, memungkinkan perpindahan halaman tanpa *reload* secara penuh (*seamless navigation*).
- **Axios:** *HTTP Client* berbasis *Promise* yang digunakan untuk melakukan komunikasi asinkron (pengiriman dan pengambilan data API) dari *Frontend* ke *Backend*.
- **Recharts:** *Library* charting berbasis React yang dipakai untuk menghasilkan grafik interaktif pada halaman laporan (*Dashboard* dan *Riwayat Penjualan*) untuk menganalisis statistik bisnis.
- **XLSX:** Modul tambahan yang digunakan untuk memproses manipulasi data dan ekspor laporan rekapitulasi penjualan ke format dokumen Excel.
- **Lucide React:** Pustaka ikon *open-source* bervektor (SVG) untuk kebutuhan navigasi dan elemen antarmuka yang tajam di berbagai resolusi layar.

### 1.2 Back-End (Sisi Server)
Bagian pemrosesan data, logika bisnis, dan pengolahan antarmuka *Application Programming Interface* (API) dibangun dengan teknologi berikut:
- **Node.js & Express.js (v5):** *Runtime environment* dan *framework server-side* yang ringan serta efisien untuk menangani *request* HTTP secara asinkron (*non-blocking I/O*). Ini memfasilitasi pembuatan *RESTful API* yang stabil.
- **Prisma ORM (v5):** *Object-Relational Mapping* modern berbasis *type-safe* yang menjembatani komunikasi antara kode backend dan database, memudahkan operasi CRUD (Create, Read, Update, Delete) dengan penulisan *query* yang intuitif, serta mendukung migrasi skema database yang terstruktur.
- **Multer:** *Middleware* Node.js yang dikhususkan untuk menangani pemrosesan data berbasis `multipart/form-data`, yang diimplementasikan pada fitur unggah file (misal: foto produk/menu bakso).
- **CORS & Dotenv:** Pengelolaan *Cross-Origin Resource Sharing* (CORS) untuk kebijakan keamanan pengaksesan API oleh domain *frontend*, serta penggunaan *Dotenv* untuk melindungi variabel rahasia (*environment variables*) di sisi *server*.

### 1.3 Basis Data & Keamanan Sistem
- **Database Engine - MySQL (via Aiven Cloud):** Basis data relasional (*Relational Database Management System*/RDBMS) handal yang berjalan dalam ekosistem *Cloud (Aiven)* untuk mendukung manajemen data berskala besar, menjamin persistensi entitas, relasi antar tabel (Pesanan, Produk, Akun), serta tingkat ketersediaan (*availability*) data yang tinggi.
- **JSON Web Token (JWT):** Standar otentikasi terenkripsi (RFC 7519) untuk mengelola sesi pengguna secara *stateless*. Setiap *request* dari *frontend* akan dilampirkan *token bearer* yang harus divalidasi oleh *middleware* *backend*.
- **Bcrypt:** Algoritma fungsi *hash* kriptografi searah yang kuat (*salt and hash*) untuk mengenkripsi kata sandi pengguna secara aman sebelum disimpan di dalam basis data (mencegah eksploitasi data kredensial).

---

## 2. Deskripsi Fungsionalitas Fitur Aplikasi

Aplikasi Kasir Baksoku dirancang untuk menjawab spesifikasi kebutuhan bisnis kuliner berbasis antrean cepat. Berikut adalah rincian fitur yang tersedia:

### 2.1 Manajemen Akses dan Keamanan Multi-Role
Sistem mengadopsi konsep *Role-Based Access Control* (RBAC) dengan pemisahan hak akses:
- **Super Admin:** Memiliki kontrol absolut atas seluruh entitas sistem. Meliputi pengelolaan akun pengguna, pengelolaan master data menu, penetapan harga produk, dan akses penuh atas analisis data laporan operasional.
- **Kasir:** Memiliki otoritas yang dibatasi pada operasional harian. Fokus utama pada modul operasional POS (pemrosesan pesanan), pencetakan struk pembayaran, dan halaman monitor pemantauan antrean.

### 2.2 Sistem *Point of Sales* (POS) Berbasis Algoritma FIFO
- **Penerapan Antrean First-In-First-Out (FIFO):** Setiap transaksi yang diselesaikan kasir secara otomatis akan dicetak ke dalam struktur antrean terurut berdasarkan waktu pemesanan (*timestamp*). Metode ini memastikan tingkat keadilan dalam pelayanan (pesanan yang masuk paling awal, dikerjakan paling awal oleh dapur).
- **Proses Transaksi Cepat:** Antarmuka kasir yang dirancang reaktif dengan pencarian cepat produk, perhitungan kalkulasi otomatis (total belanja, pajak, dan kembalian), serta pemilihan jenis pembayaran yang dinamis.
- **Pencetakan Struk Otomatis:** Fitur untuk mendemonstrasikan integrasi pencetakan struk transaksi, disesuaikan untuk kompatibilitas ukuran kertas struk *thermal*.

### 2.3 Live Dashboard Monitor Antrean Dapur
- **Pemantauan Pesanan Aktif:** Fitur layar sekunder khusus bagi karyawan dapur untuk memantau status semua pesanan masuk (Pending / Sedang Diproses).
- **Sinkronisasi Waktu Nyata:** Mengoptimalkan koordinasi komunikasi visual dari kasir menuju dapur untuk menekan resiko kehilangan tiket pesanan atau salah urutan dalam meracik bahan bakso.

### 2.4 Manajemen Inventaris, Menu, dan Stok
- **Kontrol *Inventory* Produk:** Modul pengelolaan CRUD (*Create, Read, Update, Delete*) pada data produk. Meliputi manipulasi harga dasar, harga jual, nama menu, ketersediaan stok, hingga unggah foto produk.
- **Sistem Penangguhan Data (*Soft Delete* / Arsip):** Sistem tidak langsung menghapus data menu secara permanen saat dilakukan eksekusi penghapusan. Menu tersebut dialihkan sementara waktu ke dalam sistem arsip atau **Penangguhan Menu (Deaktivasi 30 Hari)**.
  - *Recovery Data:* Dalam kurun waktu 30 hari, admin dapat memulihkan kembali (*restore*) menu tersebut sehingga dapat ditayangkan di layar kasir kembali.
  - *Hard Delete Otomatis:* Pembersihan permanen akan dilakukan pasca kadaluarsa 30 hari untuk menjaga performa optimisasi *database*.

### 2.5 Sistem Riwayat dan Pelaporan Analitik Penjualan
- **Rekam Jejak (*History*) Transaksi Harian:** Pencatatan komprehensif setiap faktur penjualan yang terjadi. Admin dan kasir dapat mencari, memfilter, serta mereview transaksi masa lalu.
- **Perubahan Metode Pembayaran Instan:** Adanya fitur operasional korektif, memungkinkan perubahan status atau metode pembayaran (contoh: dari *Cash* ke QRIS) secara langsung melalui *dropdown* riwayat tanpa menghapus transaksi awal.
- **Laporan Visual dan Statistik Harian/Bulanan:** Visualisasi ringkasan kinerja penjualan dari waktu ke waktu secara interaktif dengan **Grafik Analitik (Recharts)**. Mengklasifikasikan data pendapatan kotor, keuntungan, serta kuantitas produk yang paling laris (*Best Seller*).
- **Export Data Operasional:** Didukung dengan kapabilitas konversi dan pengunduhan tabel riwayat transaksi/pelaporan keuangan langsung ke dalam format dokumen pengolah angka (*Excel / .xlsx*) untuk mempermudah perhitungan laporan akuntansi (*Buku Besar*) di luar sistem.

---
*Dokumen ini disusun untuk merepresentasikan kerangka konseptual serta detail arsitektur teknis dari pengembangan proyek skripsi Kasir Baksoku.*
