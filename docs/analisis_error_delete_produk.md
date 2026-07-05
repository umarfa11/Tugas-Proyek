# Analisis Masalah: Gagal Hapus Produk Berelasi

Dokumen ini menjelaskan mengapa sistem memunculkan peringatan **"Cannot delete product: it is referenced in an order"** saat Anda mencoba menghapus produk tertentu, disertai dengan alur logika (Flowchart), aliran pengguna (User Flow), dan diagram kegagalan (Error Diagram).

---

## 1. Analisis Penyebab

Peringatan tersebut muncul karena adanya sistem **Constraint Foreign Key (Batasan Kunci Asing)** di dalam database MySQL. Hubungan ini diatur melalui Prisma ORM dalam skema relasi berikut:

*   Tabel `produk` memiliki relasi *one-to-many* ke tabel `detail_pesanan` (`DetailPesanan`).
*   Setiap kali kasir membuat pesanan baru yang berisi produk tersebut, data transaksi akan disimpan ke dalam tabel `detail_pesanan` dengan mereferensikan `produk_id` dari produk tersebut.
*   Secara default, MySQL menerapkan aturan `ON DELETE RESTRICT` pada kunci asing tersebut. Artinya, **produk tidak boleh dihapus selama masih ada riwayat transaksi yang mereferensikannya**.

### Mengapa Aturan Ini Penting?
Jika sistem memperbolehkan penghapusan produk yang sudah pernah dibeli:
1.  **Kerusakan Laporan (Data Orphan):** Tabel riwayat penjualan (`detail_pesanan`) akan merujuk ke ID produk yang sudah tidak ada di tabel `produk`. Hal ini menyebabkan error saat aplikasi memuat halaman riwayat penjualan atau dasbor grafik karena produk tidak ditemukan.
2.  **Kehilangan Audit Penjualan:** Data laporan keuangan menjadi tidak akurat karena detail produk yang terjual hilang dari database.

---

## 2. Flowchart Penghapusan Produk (Hapus vs Tolak)

Flowchart berikut menggambarkan logika yang terjadi di dalam backend Express.js ketika menerima permintaan hapus produk:

```mermaid
flowchart TD
    Start["Mulai: Admin klik Hapus Produk"] --> Request["Kirim DELETE /api/produk/:id"]
    Request --> Find["Cari Produk berdasarkan ID di Database"]
    
    Find --> ExistCheck{"Apakah Produk Ditemukan?"}
    ExistCheck -- "Tidak" --> Err404["Kembalikan Response 404 (Not Found)"]
    ExistCheck -- "Ya" --> ExecDelete["Jalankan Kueri: prisma.produk.delete()"]
    
    ExecDelete --> DBExecution{"Eksekusi di MySQL"}
    
    DBExecution -- "Ada Relasi di detail_pesanan (Gagal)" --> ErrorP2003["Tangkap Error Prisma P2003 (Foreign Key Constraint Failed)"]
    ErrorP2003 --> Err400["Kembalikan Response 400 (Cannot delete product: it is referenced in an order)"]
    
    DBExecution -- "Tidak Ada Relasi (Sukses)" --> Success["Hapus Baris Produk dari Database"]
    Success --> Res200["Kembalikan Response 200 (Produk deleted)"]
    
    Err404 --> End["Selesai"]
    Err400 --> Alert["Frontend Menampilkan Alert Pesan Error"]
    Alert --> End
    Res200 --> Refresh["Frontend Memperbarui Daftar Produk"]
    Refresh --> End
```

---

## 3. Aliran Pengguna (User Flow)

Berikut adalah navigasi layar dan respons pengguna saat menghadapi error penghapusan produk:

```mermaid
flowchart TD
    AdminDashboard["Halaman Dasbor Super Admin"] --> Navigate["Navigasi ke Halaman Kelola Produk"]
    Navigate --> UserList["Melihat Daftar Produk"]
    UserList --> ClickDelete["Klik Tombol Ikon Hapus pada Baris Produk"]
    ClickDelete --> ConfirmModal["Tampilkan Modal Konfirmasi Hapus"]
    
    ConfirmModal --> Action{"Pilih Tindakan"}
    Action -- "Batal" --> UserList
    Action -- "Ya, Hapus" --> SendAPI["Kirim Permintaan ke Backend"]
    
    SendAPI --> ResponseCheck{"Menerima Respon HTTP"}
    ResponseCheck -- "Status 200 (Sukses)" --> ToastSuccess["Tampilkan Notifikasi Berhasil & Refresh List"]
    ResponseCheck -- "Status 400 (Gagal/Constraint)" --> ToastError["Tampilkan Alert: Cannot delete product: it is referenced in an order"]
    
    ToastSuccess --> UserList
    ToastError --> UserList
```

---

## 4. Diagram Kegagalan Relasi (Error Diagram)

Diagram berikut memvisualisasikan bagaimana database MySQL memblokir aksi penghapusan untuk menjaga integritas data:

```mermaid
sequenceDiagram
    autonumber
    actor Admin as 👤 Super Admin
    participant FE as Frontend (React.js)
    participant BE as Backend (Express.js)
    participant DB as Database (MySQL)

    Admin->>FE: Klik "Hapus" pada Produk A (Misal ID: 10)
    FE->>BE: DELETE /api/produk/10
    BE->>DB: Kueri: DELETE FROM produk WHERE id = 10
    
    Note over DB: Evaluasi Integritas Data:<br/>Apakah ID 10 ada di tabel detail_pesanan?
    
    DB-->>DB: Ditemukan baris di detail_pesanan dengan produk_id = 10
    
    Note over DB: Batasan Terlanggar (ON DELETE RESTRICT)!<br/>Hapus dibatalkan untuk mencegah data yatim (orphan data)
    
    DB-->>BE: Error P2003 (Foreign Key Constraint Failed)
    BE->>BE: Deteksi kode error P2003
    BE-->>FE: HTTP 400 Bad Request {"message": "Cannot delete product: it is referenced in an order"}
    FE-->>Admin: Menampilkan dialog alert pesan error
```

---

## 5. Rekomendasi Solusi Alternatif (Soft Delete / Archive)

Jika Anda tetap ingin menyembunyikan produk tersebut dari halaman penjualan kasir tanpa merusak data penjualan masa lalu, solusi terbaik adalah menerapkan metode **Soft Delete (Arsip/Nonaktifkan)**:

1.  **Tambah Kolom Status Keaktifan:** Tambahkan kolom boolean `isAvailable` atau `isActive` pada skema database produk.
    ```prisma
    model Produk {
      ...
      isActive Boolean @default(true) @map("is_active")
    }
    ```
2.  **Ubah Tombol Hapus Menjadi Nonaktifkan:** Alih-alih menghapus data secara permanen (`DELETE`), sistem hanya mengubah nilai `isActive` menjadi `false` (`UPDATE`).
3.  **Saring Menu Penjualan:** Halaman transaksi kasir (`InputPesanan.jsx`) hanya akan memuat produk yang memiliki nilai `isActive: true`. Dengan cara ini, produk tidak muncul saat membuat pesanan baru, namun riwayat penjualan lama Anda tetap aman dan utuh.
