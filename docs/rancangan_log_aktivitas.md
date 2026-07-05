# Rancangan Fitur: Modul Log Aktivitas Detail

Dokumen ini berisi rancangan teknis untuk menambahkan **Modul Log Aktivitas** terperinci pada aplikasi Kasir Baksoku. Modul ini mencatat semua tindakan penting yang dilakukan oleh Super Admin dan Kasir demi transparansi audit operasional.

---

## 1. Perubahan Basis Data (Database Schema)

Menambahkan model baru `ActivityLog` ke dalam tabel database MySQL via Prisma ORM:

```prisma
model ActivityLog {
  id          Int      @id @default(autoincrement())
  userId      Int?     @map("user_id") // Nullable jika user dihapus
  username    String   @db.VarChar(50)  // Tetap menyimpan nama user untuk audit historis
  action      String   @db.VarChar(100) // Kategori tindakan (e.g., LOGIN, CHECKOUT, CREATE_PRODUCT)
  description String   @db.VarChar(255) // Deskripsi detail aktivitas
  ipAddress   String?  @map("ip_address") @db.VarChar(45)
  createdAt   DateTime @default(now()) @map("created_at")

  user        User?    @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@map("activity_logs")
}
```

### 1.1 Tindakan yang Dicatat (Logged Activities)
1.  **Autentikasi:** Login sukses, login gagal, dan logout.
2.  **Manajemen Produk:** Tambah produk, edit detail produk, deaktivasi (soft-delete), dan pemulihan (*restore*) produk.
3.  **Operasional Kasir (POS):** Transaksi pesanan baru (checkout) lengkap dengan total harga, dan penyelesaian antrian makanan (FIFO).
4.  **Manajemen Pengguna:** Penambahan akun kasir/admin baru, dan penghapusan akun.

---

## 2. Arsitektur Logging Backend

Pencatatan log diletakkan pada layer servis helper (`logger.js`) sehingga tidak mengganggu alur utama aplikasi (*non-blocking*):

```javascript
// logger.js
const logActivity = async (action, description, req, userOverride = null) => {
  try {
    const userId = userOverride ? userOverride.id : (req?.user ? req.user.id : null);
    const username = userOverride ? userOverride.username : (req?.user ? req.user.username : 'system');
    const ipAddress = req ? (req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '') : '';

    await prisma.activityLog.create({
      data: { userId, username, action, description, ipAddress }
    });
  } catch (error) {
    console.error("[LOGGER ERROR] Gagal menulis log aktivitas:", error);
  }
};
```

---

## 3. Flowchart Alur Pencatatan Log

Diagram berikut menunjukkan bagaimana backend memproses request utama (misal: Checkout) sambil menulis log aktivitas secara paralel:

```mermaid
flowchart TD
    Start["Mulai: Request dari Klien (e.g., POST /api/pesanan)"] --> APIAuth["Verifikasi Token JWT via Middleware"]
    APIAuth --> Controller["Jalankan Controller (pesananController.js)"]
    
    subgraph Alur_Transaksi["Logika Utama Transaksi"]
        Controller --> CheckStock["Validasi Stok Produk"]
        CheckStock -- "Stok Cukup" --> InsertOrder["Simpan Pesanan ke DB"]
        CheckStock -- "Stok Kurang" --> Err400["Kembalikan Error 400"]
    end
    
    InsertOrder --> LogAction["Panggil logActivity('CHECKOUT', 'Membuat pesanan baru...', req)"]
    
    subgraph Alur_Logging["Log Aktivitas (Non-Blocking)"]
        LogAction --> GetIP["Deteksi IP Address & User Session"]
        GetIP --> WriteLog["Simpan Baris Log ke Tabel activity_logs"]
        WriteLog --> LogSuccess["Log Berhasil Tersimpan"]
        WriteLog -- "Gagal (DB Error)" --> CatchErr["Tangkap Error (Console.warn) & Jangan Hambat Transaksi"]
    end
    
    LogAction --> ReturnRes["Kembalikan Response 201 (Pesanan Dibuat & Cetak Struk)"]
    ReturnRes --> End(["Selesai"])
    Err400 --> End
```

---

## 4. Aliran Pengguna (User Flow - Super Admin)

User Flow ini menggambarkan bagaimana Super Admin mengakses dan menyaring data log aktivitas:

```mermaid
flowchart TD
    AdminDashboard["Halaman Dasbor Super Admin"] --> ClickSidebar["Klik Menu 'Log Aktivitas' di Sidebar"]
    ClickSidebar --> LogsPage["Masuk Halaman Log Aktivitas"]
    LogsPage --> FetchAPI["Sistem Memuat Data dari /api/riwayat/logs (Terbaru Dahulu)"]
    
    FetchAPI --> RenderTable["Menampilkan Tabel Timeline Log"]
    RenderTable --> FilterSearch["Ketik Nama User / Deskripsi di Input Search"]
    FilterSearch --> RenderFiltered["Tabel Diperbarui secara Real-time"]
    
    RenderTable --> FilterCategory["Pilih Dropdown Kategori (e.g., PRODUK, CHECKOUT, AUTH)"]
    FilterCategory --> RenderFiltered
```

---

## 5. Diagram Penanganan Hambatan (Integritas Data)

Diagram ini menunjukkan bagaimana modul log tetap aman dan tidak rusak meskipun user yang melakukan tindakan di masa lalu dihapus dari sistem (*Referential Integrity*):

```mermaid
sequenceDiagram
    autonumber
    actor Admin as 👤 Super Admin
    participant BE as Backend API
    participant DB as Database (MySQL)
    
    Note over Admin, DB: Fase 1: Kasir "fadil" (ID: 5) membuat transaksi
    BE->>DB: INSERT INTO activity_logs (user_id, username, action, description) VALUES (5, 'fadil', 'CHECKOUT', 'Membuat pesanan...')
    DB-->>BE: OK (Log tersimpan)

    Note over Admin, DB: Fase 2: Super Admin menghapus akun Kasir "fadil" (ID: 5)
    Admin->>BE: DELETE /api/auth/users/5
    BE->>DB: DELETE FROM users WHERE id = 5
    
    Note over DB: Evaluasi Relasi onDelete: SetNull<br/>Ubah user_id di activity_logs menjadi NULL<br/>Kolom username 'fadil' tetap utuh.
    
    DB-->>BE: Sukses Hapus User & Update Relasi Log
    BE-->>Admin: HTTP 200 OK (User berhasil dihapus)
    
    Note over Admin, DB: Fase 3: Admin membuka Log Aktivitas
    Admin->>BE: GET /api/riwayat/logs
    BE->>DB: SELECT * FROM activity_logs ORDER BY created_at DESC
    DB-->>BE: Mengembalikan data log (user_id: null, username: 'fadil', action: 'CHECKOUT')
    BE-->>Admin: Menampilkan riwayat: "fadil membuat pesanan..." meskipun akun fadil sudah tidak ada
```
