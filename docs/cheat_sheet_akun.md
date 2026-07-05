# Cheat Sheet Akun Akses Kasir Baksoku

Dokumen ini berisi daftar akun akses default yang dapat digunakan untuk login ke dalam sistem **Kasir Baksoku**.

---

## 🔑 Akun Super Admin (Default dari Seed)

Akun ini memiliki hak akses penuh ke seluruh fitur aplikasi, termasuk:
*   Melihat Dashboard & Laporan Keuangan
*   Mengelola Produk (Tambah, Edit, Hapus)
*   Mengelola Akun Kasir & Super Admin lainnya
*   Melihat Riwayat Penjualan Lengkap

| Parameter | Kredensial |
| :--- | :--- |
| **Username** | `admin` |
| **Password** | `admin123` |
| **Role** | `Super Admin` |

---

## 🧑‍🍳 Akun Kasir (Dibuat melalui Halaman Kelola Akun)

Akun Kasir digunakan khusus untuk operasional penjualan sehari-hari. Akun ini hanya memiliki akses ke:
*   Halaman Input Pesanan (POS)
*   Halaman Monitor Antrian

*Catatan: Akun Kasir dapat dibuat secara mandiri oleh akun Super Admin melalui halaman **Kelola Akun** di panel admin.*

---

## 🛠️ Langkah Mengatasi Gagal Login (Troubleshooting)

Jika Anda menemui error seperti **`net::ERR_CONNECTION_REFUSED`** atau **`Network Error`**:

1.  **Pastikan Server Backend Aktif:**
    Server backend harus berjalan pada port `5000`. Jika server mati, frontend tidak akan bisa melakukan autentikasi.
    *   Buka terminal di folder `backend`, jalankan:
        ```bash
        npm run dev
        ```
2.  **Pastikan Server Frontend Aktif:**
    *   Buka terminal di folder `frontend`, jalankan:
        ```bash
        npm run dev
        ```
    *   Akses aplikasi di browser melalui: `http://localhost:5173/`

3.  **Pastikan Database Terisi (Seeding):**
    Jika akun `admin` di atas tidak ditemukan, jalankan perintah seeding berikut di folder `backend`:
    ```bash
    npx prisma db seed
    ```
