# Penjelasan Teknologi dan Fitur Aplikasi "Kasir Baksoku"

Dokumen ini berisi rincian lengkap mengenai fitur-fitur yang tersedia serta teknologi (stack) yang digunakan pada pengembangan aplikasi **Kasir Baksoku** (Sistem Point of Sales & Manajemen Inventaris).

---

## 🌟 Fitur Utama Aplikasi

Aplikasi ini dirancang untuk mempermudah operasional kedai bakso dengan beberapa fitur unggulan:

### 1. Sistem POS Berbasis FIFO (First-In-First-Out)
- Sistem pemrosesan pesanan yang adil dengan memprioritaskan pesanan yang masuk lebih awal.
- Membantu kasir dan dapur bekerja lebih terstruktur dan efisien.

### 2. Monitor Antrean Dapur (Real-time)
- Halaman antarmuka khusus untuk tim dapur.
- Menampilkan daftar pesanan yang sedang aktif secara interaktif dan *real-time* sehingga tim dapur dapat segera menyiapkan hidangan.

### 3. Manajemen Menu & Stok Barang
- Pengelolaan daftar menu dan ketersediaan stok bahan.
- **Fitur Penangguhan (Soft Delete/Arsip):** Menu yang dihapus tidak langsung hilang, melainkan diarsipkan selama 30 hari. Dalam masa ini, menu dapat dipulihkan kembali sebelum dihapus secara permanen oleh sistem.

### 4. Riwayat & Rekap Penjualan
- Pencatatan semua transaksi yang telah selesai.
- **Laporan Visual:** Menyediakan laporan penjualan harian dan bulanan yang dilengkapi dengan grafik interaktif.
- **Ubah Metode Pembayaran:** Memungkinkan perubahan metode pembayaran transaksi langsung melalui *dropdown* riwayat.
- **Cetak Struk:** Mendukung pencetakan struk belanja (thermal/kertas biasa).
- **Export Data:** Terdapat kemampuan integrasi pengunduhan data (menggunakan pustaka `xlsx`).

### 5. Multi-Role User & Keamanan Akses
- Terdapat sistem autentikasi dan pembagian hak akses pengguna.
- **Super Admin:** Memiliki akses penuh untuk mengelola menu, mengatur akun pengguna, dan melihat laporan/rekap bisnis.
- **Kasir:** Berfokus pada operasional kasir (POS), transaksi, dan monitor antrean.

---

## 🛠️ Teknologi yang Digunakan (Tech Stack)

Aplikasi ini dibangun menggunakan arsitektur *Client-Server* modern yang memisahkan antara *Frontend* dan *Backend*.

### 💻 Frontend (Tampilan & Interaksi Pengguna)
Bagian depan aplikasi dibangun menggunakan **Vite** dan **React.js** dengan ekosistem berikut:

| Teknologi | Fungsi / Kegunaan |
| --- | --- |
| **React.js (v19)** | *Library* utama untuk membangun antarmuka pengguna (UI) berbasis komponen. |
| **Vite (v8)** | *Build tool* dan *dev server* yang sangat cepat untuk menjalankan proyek React. |
| **TailwindCSS (v4)** | *Framework* CSS berbasis *utility-class* untuk *styling* dan desain responsif dengan cepat. |
| **Zustand (v5)** | *State management* yang ringan dan efisien, digunakan (misalnya) untuk mengelola *state auth/login* pengguna. |
| **React Router DOM (v7)** | Mengelola sistem navigasi dan perutean (*routing*) antar halaman (SPA). |
| **Axios** | *HTTP Client* untuk melakukan permintaan data (API request) dari Frontend ke Backend. |
| **Lucide React** | Kumpulan ikon SVG yang bersih dan modern untuk melengkapi antarmuka aplikasi. |
| **Recharts** | *Library* untuk membuat grafik interaktif (digunakan pada fitur laporan penjualan). |
| **XLSX** | *Library* untuk memproses dan mengekspor data ke format Excel (spreadsheet). |

### ⚙️ Backend (Server API & Logika Bisnis)
Bagian belakang aplikasi (API) berjalan di atas lingkungan **Node.js** dengan ekosistem berikut:

| Teknologi | Fungsi / Kegunaan |
| --- | --- |
| **Express.js (v5)** | *Framework* web untuk Node.js yang mempermudah pembuatan *endpoint* RESTful API dan *routing*. |
| **Prisma ORM (v5)** | *Object-Relational Mapping* (ORM) modern untuk berinteraksi dengan database secara lebih aman dan mudah (Type-safe database client). |
| **MySQL** | Sistem Manajemen Basis Data Relasional (RDBMS) yang digunakan untuk menyimpan seluruh data aplikasi (di-hosting melalui Aiven Cloud). |
| **JSON Web Token (JWT)** | Digunakan untuk proses autentikasi dan otorisasi. Token akan diberikan setelah pengguna berhasil login. |
| **Bcrypt** | *Library* enkripsi/hashing yang digunakan untuk mengamankan *password* pengguna di dalam database. |
| **Multer** | *Middleware* Node.js untuk menangani *multipart/form-data*, utamanya digunakan untuk fitur unggah gambar/file (seperti foto menu). |
| **Cors** | *Middleware* untuk mengatur kebijakan *Cross-Origin Resource Sharing* agar Frontend dapat mengakses API Backend dengan aman. |
| **Dotenv** | Mengelola dan memuat variabel lingkungan (*environment variables*) dari file `.env`. |

---

## 📂 Struktur Arsitektur Singkat

- **Frontend** berkomunikasi dengan **Backend** secara asinkron menggunakan format **JSON** via **Axios**.
- **Backend** mengatur logika bisnis, melindungi *route* API dengan *middleware* berbasis **JWT**, dan melakukan kueri ke basis data **MySQL** menggunakan **Prisma**.
- **Keamanan:** Kata sandi disimpan dalam bentuk *hash* (**Bcrypt**) untuk mencegah kebocoran data. Data-data rahasia seperti kunci database disembunyikan menggunakan *environment variables*.
