# Rancangan Fitur: Modul Produk Deaktif (Pengganti Log Aktivitas)

Dokumen ini berisi rancangan teknis untuk menghapus Modul Log Aktivitas dan menggantinya dengan **Modul Produk Deaktif** khusus di sidebar admin. Modul ini memudahkan Super Admin memantau menu apa saja yang sedang dinonaktifkan sementara serta sisa waktu penangguhannya sebelum dihapus permanen oleh sistem.

---

## 1. Pembersihan Modul Log Aktivitas (Revert Log Module)

Semua komponen terkait Log Aktivitas akan dibersihkan agar basis kode tetap ringkas dan bersih:
*   **Database:** Menghapus model `ActivityLog` dari `schema.prisma`.
*   **Backend:** Menghapus servis `logger.js`, `logController.js`, router `log.routes.js`, serta menghapus pemanggilan `logActivity` di seluruh *controllers*.
*   **Frontend:** Menghapus halaman `LogAktivitas.jsx` dan rutenya di `App.jsx`.

---

## 2. Implementasi Modul Produk Deaktif

### 2.1 API Backend yang Digunakan
Sistem akan memanfaatkan endpoint produk deaktif yang sudah kita buat sebelumnya:
1.  **`GET /api/produk/deactivated`**: Mengambil daftar produk dengan `deactivatedAt != null`.
2.  **`POST /api/produk/:id/restore`**: Mengaktifkan kembali produk deaktif (mengosongkan `deactivatedAt`).

### 2.2 Tampilan Baru Frontend (`ProdukDeaktif.jsx`)
Halaman baru akan menampilkan data produk deaktif dalam bentuk tabel atau grid kartu modern:
*   **Kolom Tabel:** Nama Produk, Kategori, Harga, Tanggal Dinonaktifkan, Sisa Hari Penangguhan (Hitung mundur dari 30 hari), dan Kolom Aksi.
*   **Aksi:** Tombol **Pulihkan** berikon `RotateCcw` untuk mengaktifkan kembali produk.
*   **Filter Pencarian:** Kolom pencarian real-time untuk mempermudah pencarian nama produk yang dinonaktifkan.
*   *Desain:* Konsisten dengan palet warna brand (Salmon & Teal), menggunakan ikon pendukung, dan **tidak menggunakan emoji**.

---

## 3. Flowchart Alur Produk Deaktif & Pemulihan

```mermaid
flowchart TD
    subgraph Deaktivasi["1. Proses Deaktivasi"]
        AdminDelete["Super Admin Klik Hapus Produk"] --> RequestDeact["Kirim DELETE /api/produk/:id"]
        RequestDeact --> DBUpdate["Set deactivated_at = NOW() di Database"]
        DBUpdate --> SuccessDeact["Produk Hilang dari POS & Inventaris Aktif"]
    end

    subgraph Modul_Deaktif["2. Mengakses Modul Produk Deaktif"]
        SidebarClick["Super Admin Klik Menu 'Produk Deaktif'"] --> FetchDeact["Kirim GET /api/produk/deactivated"]
        FetchDeact --> RenderTable["Tampilkan Tabel Produk Deaktif & Sisa Hari (30 Hari)"]
    end

    subgraph Pemulihan["3. Pemulihan (Restore)"]
        RestoreClick["Klik Tombol Pulihkan"] --> RequestRestore["Kirim POST /api/produk/:id/restore"]
        RequestRestore --> DBNull["Set deactivated_at = NULL"]
        DBNull --> SuccessRestore["Produk Aktif Kembali & Muncul di POS/Inventaris Aktif"]
    end
    
    SuccessDeact --> RenderTable
    SuccessRestore --> SidebarClick
```

---

## 4. Aliran Pengguna (User Flow - Super Admin)

User Flow ini menggambarkan bagaimana Super Admin mengelola produk yang terarsip di menu khusus:

```mermaid
flowchart TD
    AdminDashboard["Dashboard Super Admin"] --> NavigateDeact["Klik 'Produk Deaktif' di Sidebar"]
    NavigateDeact --> ViewList["Melihat Daftar Menu Terarsip (Nama, Harga, Sisa Hari)"]
    
    ViewList --> Action{"Pilih Tindakan"}
    
    Action -- "Cari Nama Menu" --> SearchBox["Ketik di Input Pencarian"]
    SearchBox --> FilteredTable["Tabel Menyaring secara Instan"]
    
    Action -- "Pulihkan Menu" --> ClickRestore["Klik Tombol Pulihkan (RotateCcw)"]
    ClickRestore --> RestoreSuccess["Notifikasi Sukses: Produk Kembali Aktif"]
    RestoreSuccess --> NavigateDeact
```

---

## 5. Diagram Penanganan Hambatan (Diagram Error)

Diagram berikut menjelaskan mitigasi kesalahan ketika Admin mencoba memulihkan produk yang sudah kedaluwarsa dan terhapus permanen oleh pembersihan otomatis (*race condition*):

```mermaid
sequenceDiagram
    autonumber
    actor Admin as 👤 Super Admin
    participant FE as Frontend (ProdukDeaktif.jsx)
    participant BE as Backend API (produkController.js)
    participant DB as Database (MySQL)
    
    Note over Admin, DB: Skenario: Produk A dideaktivasi 30 hari yang lalu.<br/>Admin sedang melihat tabel, dan pada saat yang sama pembersihan otomatis dijalankan.
    
    BE->>DB: Cleanup task menghapus Produk A karena > 30 hari
    DB-->>BE: Sukses Hapus Permanen
    
    Admin->>FE: Klik "Pulihkan" untuk Produk A (tampilan belum di-refresh)
    FE->>BE: POST /api/produk/A/restore
    
    BE->>DB: SELECT * FROM produk WHERE id = A
    DB-->>BE: NULL (Data tidak ditemukan)
    
    Note over BE: Tangkap Error 404:<br/>Produk tidak ditemukan atau telah kedaluwarsa.
    
    BE-->>FE: HTTP 404 Not Found { message: "Produk tidak ditemukan" }
    Note over FE: Tampilkan alert info:<br/>"Gagal memulihkan! Produk sudah kedaluwarsa dan terhapus permanen."
    FE->>FE: Jalankan fetch ulang untuk menyinkronkan tabel
```
