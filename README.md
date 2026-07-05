# Kasir Baksoku 🍜

**Kasir Baksoku** adalah aplikasi Point of Sales (POS) dan manajemen inventaris pintar yang dirancang khusus untuk kedai bakso dengan menerapkan sistem antrean **FIFO (First-In-First-Out)**. Aplikasi ini mempermudah pencatatan transaksi kasir, pengaturan ketersediaan bahan/stok menu, pemantauan nomor antrean dapur secara real-time, dan pembuatan laporan keuangan harian.

---

## 🌟 Fitur Utama

- **Sistem POS Berbasis FIFO:** Pemrosesan pesanan berjalan teratur sesuai urutan masuk (First-In-First-Out) untuk menjaga keadilan pelayanan pelanggan.
- **Monitor Antrean Dapur:** Halaman monitor antrean interaktif yang menyajikan daftar pesanan aktif untuk memudahkan tim dapur menyiapkan makanan secara cepat.
- **Manajemen Menu & Stok:** Dilengkapi dengan fitur **Penangguhan Menu (Deaktivasi Sementara 30 Hari)**. Menu yang dihapus akan disimpan selama 30 hari di tab arsip dan dapat dipulihkan kembali sebelum dihapus permanen oleh sistem.
- **Riwayat & Rekap Penjualan:** 
  - Laporan penjualan harian dan bulanan dilengkapi grafik interaktif.
  - Perubahan metode pembayaran instan langsung dari dropdown riwayat.
  - Pencetakan struk belanja thermal/kertas.
- **Multi-Role User & Keamanan:** Pembagian hak akses antara **Super Admin** (pengelola menu, akun, dan laporan bisnis) dan **Kasir** (operator transaksi & monitor antrean).

---

## 🛠️ Teknologi yang Digunakan

### Frontend
- **Framework:** React.js (Vite)
- **Styling:** TailwindCSS
- **State Management:** Zustand
- **Ikon:** Lucide React
- **HTTP Client:** Axios

### Backend & Database
- **Runtime:** Node.js (Express.js)
- **Database ORM:** Prisma
- **Database Engine:** MySQL (Aiven Cloud hosting)
- **Autentikasi:** JSON Web Token (JWT) & bcrypt

---

## ⚙️ Panduan Instalasi & Menjalankan Proyek

Pastikan Anda sudah menginstal **Node.js (LTS version)** dan **Git** di komputer Anda.

### 1. Kloning Repositori
```bash
git clone https://github.com/umarfa11/Tugas-Proyek.git
cd Tugas-Proyek
```

### 2. Konfigurasi Backend (Server API)
1. Masuk ke folder `backend`:
   ```bash
   cd backend
   ```
2. Buat file `.env` baru di dalam folder `backend/` dan isi dengan konfigurasi koneksi database Anda:
   ```env
   PORT=5000
   DATABASE_URL="mysql://username:password@host:port/dbname?ssl-mode=REQUIRED"
   JWT_SECRET="isi_kunci_rahasia_jwt_bebas"
   NODE_ENV="development"
   ```
3. Instal dependensi library backend:
   ```bash
   npm install
   ```
4. Sinkronisasikan skema Prisma ke database MySQL Anda:
   ```bash
   npx prisma db push
   ```
5. Isi database dengan data akun bawaan awal (seeding):
   ```bash
   npx prisma db seed
   ```
   *(Data login default setelah seed: Username `admin` / Password `admin123`)*
6. Jalankan server backend:
   ```bash
   npm run dev
   ```

### 3. Konfigurasi Frontend (Tampilan Aplikasi)
1. Buka terminal baru, lalu masuk ke folder `frontend`:
   ```bash
   cd frontend
   ```
2. Instal dependensi library frontend:
   ```bash
   npm install
   ```
3. Jalankan server frontend:
   ```bash
   npm run dev
   ```
4. Aplikasi Anda kini dapat diakses di browser melalui alamat default **`http://localhost:5173`** atau **`http://localhost:5174`**.

---

## 📂 Struktur Direktori Proyek

```text
Tugas-Proyek/
├── backend/
│   ├── prisma/             # Schema & Seed Prisma ORM
│   ├── src/
│   │   ├── config/         # Konfigurasi database
│   │   ├── controllers/    # Logika bisnis endpoint API
│   │   ├── middlewares/    # Proteksi hak akses token JWT
│   │   ├── routes/         # Pemetaan rute URL API
│   │   └── server.js       # Entry point Express backend
│   └── package.json
├── frontend/
│   ├── public/             # Aset gambar login & ikon static
│   ├── src/
│   │   ├── assets/         # Aset lokal ilustrasi
│   │   ├── components/     # Komponen UI bersama (Sidebar, Layout, Struk)
│   │   ├── pages/          # Halaman utama aplikasi (POS, Dashboard, Inventory)
│   │   ├── services/       # Integrasi API Axios
│   │   └── store/          # Zustand auth state
│   └── package.json
└── README.md
```
