# Rancangan Fitur: Deaktivasi & Pembersihan Produk Otomatis (30 Hari)

Dokumen ini berisi rancangan teknis untuk memperbarui logika penghapusan produk. Alih-alih menghapus data secara permanen yang memicu error relasi (*foreign key*), produk akan dinonaktifkan (*deactive*) selama 30 hari. Setelah 30 hari, produk akan dihapus secara otomatis jika aman dari relasi transaksi.

---

## 1. Perubahan Basis Data & Backend

### 1.1 Skema Database (`schema.prisma`)
Menambahkan kolom `deactivatedAt` pada tabel `Produk` untuk merekam tanggal penonaktifan:
```prisma
model Produk {
  id            Int             @id @default(autoincrement())
  namaProduk    String          @map("nama_produk") @db.VarChar(100)
  kategori      String          @default("Makanan") @db.VarChar(50)
  harga         Decimal         @db.Decimal(10, 2)
  stok          Int
  deactivatedAt DateTime?       @map("deactivated_at") // Kolom baru
  createdAt     DateTime        @default(now()) @map("created_at")
  updatedAt     DateTime        @updatedAt @map("updated_at")
  detailPesanan DetailPesanan[]

  @@map("produk")
}
```

### 1.2 Logika Penghapusan (`produkController.js` -> `deleteProduk`)
Ketika Admin menghapus produk:
*   Sistem tidak menjalankan `DELETE`, melainkan memperbarui `deactivatedAt` dengan waktu saat ini (`new Date()`).
*   Mengembalikan status `200 OK` dengan pesan `"Produk berhasil dinonaktifkan (arsip) selama 30 hari"`.

### 1.3 Logika Pemfilteran Daftar Produk (`produkController.js` -> `getAllProduk`)
*   Secara default, kueri hanya mengambil produk yang aktif (`deactivatedAt: null`).
*   Ini otomatis menyembunyikan produk deaktif dari daftar kasir (POS) dan daftar manajemen produk aktif.

### 1.4 API Baru untuk Notifikasi & Pemulihan
*   **`GET /api/produk/deactivated`**: Mengambil daftar produk yang dinonaktifkan beserta sisa hari sebelum penghapusan permanen.
*   **`POST /api/produk/:id/restore`**: Memulihkan kembali produk yang deaktif (`deactivatedAt: null`).

### 1.5 Logika Pembersihan Otomatis (Auto Cleanup)
Setiap kali data produk diakses, sistem menjalankan fungsi pembersihan secara asinkron (*background job*):
*   Mencari produk dengan `deactivatedAt` lebih tua dari 30 hari.
*   Mencoba menghapusnya secara permanen.
*   Jika produk memiliki transaksi (gagal karena *foreign key*), sistem membiarkannya tetap terarsip agar audit penjualan masa lalu aman. Jika tidak ada relasi transaksi, produk terhapus permanen dari database.

---

## 2. Flowchart Sistem (Logika Deaktivasi & Pembersihan)

```mermaid
flowchart TD
    subgraph Aksi_Delete["1. Aksi Hapus (Soft Delete)"]
        StartDel(["Admin Klik Hapus"]) --> reqDel["Kirim DELETE /api/produk/:id"]
        reqDel --> updateDb["Set deactivated_at = NOW()"]
        updateDb --> resSuccess["Respon 200 OK (Produk dinonaktifkan)"]
    end

    subgraph Pembersihan_Otomatis["2. Pembersihan Otomatis (Background Cleanup)"]
        FetchStart(["Request Data Produk"]) --> CheckDate["Cari Produk dengan deactivated_at < 30 Hari Lalu"]
        CheckDate --> LoopItems{"Apakah Ada Produk Kedaluwarsa?"}
        LoopItems -- "Tidak" --> Done["Selesai & Kembalikan Data Produk Aktif"]
        
        LoopItems -- "Ya (Ada ID: X)" --> TryDelete["Jalankan DELETE FROM produk WHERE id = X"]
        TryDelete --> DBExecution{"Eksekusi DB"}
        
        DBExecution -- "P2003 (Punya Transaksi)" --> KeepSoft["Biarkan Tetap Terarsip (Jaga Riwayat)"]
        DBExecution -- "Sukses (Tanpa Transaksi)" --> HardDelete["Hapus Permanen dari DB"]
        
        KeepSoft --> LoopItems
        HardDelete --> LoopItems
    end
```

---

## 3. Aliran Pengguna (User Flow)

User Flow ini menggambarkan bagaimana admin mengelola produk, melihat notifikasi produk deaktif, dan melakukan pemulihan (*restore*):

```mermaid
flowchart TD
    Dashboard["Halaman Kelola Produk"] --> ClickDelete["Klik Hapus Produk 'Bakso A'"]
    ClickDelete --> Confirm["Konfirmasi Hapus"]
    
    Confirm --> ProductHidden["'Bakso A' Hilang dari Tabel Produk & POS"]
    ProductHidden --> NotifBanner["Banner Notifikasi Muncul di Kelola Produk"]
    
    NotifBanner --> ViewNotif["Melihat: 'Bakso A (Akan dihapus permanen dalam 30 hari)'"]
    ViewNotif --> Action{"Pilih Tindakan"}
    
    Action -- "Biarkan Kedaluwarsa" --> AutoDelete["Terhapus Otomatis Setelah 30 Hari"]
    Action -- "Klik Pulihkan (Restore)" --> SendRestore["Kirim POST /api/produk/:id/restore"]
    
    SendRestore --> Restored["Produk Aktif Kembali & Muncul di List / POS"]
    Restored --> Dashboard
```

---

## 4. Diagram Penanganan Hambatan (Integritas Riwayat)

Diagram ini menunjukkan bagaimana sistem menangani benturan kueri agar tidak memicu error sistem sewaktu proses pembersihan 30 hari terjadi:

```mermaid
sequenceDiagram
    autonumber
    participant App as Background Cleanup Task
    participant DB as Database (MySQL)
    
    App->>DB: Kueri produk dengan deactivated_at > 30 hari
    DB-->>App: Mengembalikan daftar [Produk A (Ada Transaksi), Produk B (Baru/Tanpa Transaksi)]
    
    rect rgb(240, 240, 240)
        Note over App, DB: Memproses Produk A (Telah digunakan di riwayat pesanan)
        App->>DB: DELETE FROM produk WHERE id = A
        DB-->>App: Error P2003 (Foreign Key Constraint Failed)
        Note over App: Tangkap Error: Biarkan tetap disimpan sebagai arsip agar riwayat pesanan A tidak rusak
    end
    
    rect rgb(220, 255, 220)
        Note over App, DB: Memproses Produk B (Tidak memiliki riwayat pesanan)
        App->>DB: DELETE FROM produk WHERE id = B
        DB-->>App: Sukses (Deleted 1 row)
        Note over App: Produk B terhapus permanen dengan aman
    end
```
