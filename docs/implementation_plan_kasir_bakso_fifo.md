# IMPLEMENTATION PLAN
## Rancang Bangun Aplikasi Kasir Berbasis Web dengan Fitur Manajemen Antrian Menggunakan Metode FIFO Pada Usaha Bakso

| Atribut | Keterangan |
|---|---|
| Frontend | React.js |
| Backend | Express.js (Node.js) |
| Database | MySQL |
| Pola Arsitektur | Client-Server / REST API, 3-Tier Architecture |
| Aktor | Kasir, Super Admin |
| Metode Antrian | First-In-First-Out (FIFO) |

---

## Daftar Isi

1. [Pendahuluan](#1-pendahuluan)
2. [Arsitektur Sistem](#2-arsitektur-sistem)
3. [Software Modeling](#3-software-modeling)
4. [Flowchart Sistem](#4-flowchart-sistem)
5. [User Flow](#5-user-flow)
6. [ERD (Entity Relationship Diagram)](#6-erd-entity-relationship-diagram)
7. [Pemetaan REST API](#7-pemetaan-rest-api)
8. [Rencana Implementasi (Roadmap)](#8-rencana-implementasi-roadmap)
9. [Kesimpulan](#9-kesimpulan)

---

## 1. Pendahuluan

### 1.1 Ringkasan Proyek

Aplikasi yang dibangun adalah sistem kasir (*Point of Sale*) berbasis web untuk usaha bakso, dengan fitur utama:

- Login multi-role (Kasir & Super Admin)
- Manajemen data produk (CRUD)
- Input pesanan & nama pembeli oleh kasir
- Pembayaran di awal (*upfront payment*) — Tunai atau QRIS statis
- Pencetakan struk otomatis dengan nomor antrian
- Manajemen antrian dengan metode **FIFO** (*First-In-First-Out*) — status `diproses` → `selesai`
- Riwayat & rekapitulasi penjualan harian

### 1.2 Tech Stack

| Layer | Teknologi | Keterangan |
|---|---|---|
| **Frontend** | React.js, React Router, Axios, Context API / Zustand, TailwindCSS | SPA yang mengonsumsi REST API |
| **Backend** | Express.js (Node.js), JWT, bcrypt, Sequelize / Prisma / `mysql2` | REST API, autentikasi, logika bisnis FIFO |
| **Database** | MySQL | Menyimpan data users, produk, pesanan, pembayaran |
| **Pendukung** | QRIS statis (gambar/kode), Web Print (`window.print` / library cetak struk thermal) | Modul pembayaran & cetak struk |

### 1.3 Struktur Folder (Usulan)

```
frontend/
  src/
    components/        # Komponen UI re-usable (Button, Modal, Table, dll)
    pages/
      Login.jsx
      DashboardKasir.jsx
      DashboardAdmin.jsx
      KelolaProduk.jsx
      InputPesanan.jsx
      MonitorAntrian.jsx
      RiwayatPenjualan.jsx
    services/
      api.js           # instance axios + interceptor JWT
    context/
      AuthContext.jsx
    App.jsx

backend/
  src/
    controllers/
      authController.js
      produkController.js
      pesananController.js
      riwayatController.js
    models/
      User.js
      Produk.js
      Pesanan.js
      DetailPesanan.js
      Pembayaran.js
    routes/
      auth.routes.js
      produk.routes.js
      pesanan.routes.js
      riwayat.routes.js
    middlewares/
      authMiddleware.js   # verifikasi JWT & role
    config/
      db.js
    server.js
```

---

## 2. Arsitektur Sistem

Sistem menggunakan arsitektur **3-tier**: Frontend (React) berkomunikasi dengan Backend (Express REST API) melalui HTTP/JSON, dan Backend berkomunikasi dengan Database (MySQL) melalui query SQL.

```mermaid
flowchart LR
    subgraph Client["Client (Browser)"]
        UI["React.js SPA<br/>(Kasir / Super Admin)"]
    end

    subgraph Server["Application Server"]
        API["Express.js<br/>REST API"]
        AUTH["JWT Auth Middleware"]
        BL["Business Logic<br/>(Antrian FIFO, Hitung Transaksi)"]
    end

    subgraph Data["Database Server"]
        DB[("MySQL")]
    end

    UI <-->|"HTTP/JSON via Axios"| API
    API --> AUTH
    API --> BL
    BL <-->|"SQL Query"| DB
```

**Penjelasan alur:**
1. Pengguna (Kasir/Super Admin) berinteraksi dengan antarmuka React di browser.
2. Setiap aksi (login, input pesanan, update status, dst.) memicu request HTTP ke Express API.
3. Middleware JWT memverifikasi token & role sebelum request diteruskan ke controller.
4. Business logic (termasuk logika antrian FIFO) mengeksekusi query ke MySQL melalui ORM/driver.
5. Hasil dikembalikan sebagai response JSON ke frontend untuk dirender ulang (real-time update tampilan antrian, dsb).

---

## 3. Software Modeling

### 3.1 Use Case Diagram

```mermaid
flowchart LR
    Kasir(["👤 Kasir"])
    SuperAdmin(["👤 Super Admin"])

    UC1(("Login"))
    UC2(("Mengelola CRUD Produk"))
    UC3(("Input Pesanan &<br/>Nama Pembeli"))
    UC4(("Memilih Metode<br/>Pembayaran"))
    UC5(("Tunai"))
    UC6(("QRIS"))
    UC7(("Cetak Struk Otomatis"))
    UC8(("Memantau Antrian FIFO"))
    UC9(("Melihat Riwayat Penjualan"))

    Kasir --- UC1
    Kasir --- UC2
    Kasir --- UC3
    Kasir --- UC4
    Kasir --- UC8
    Kasir --- UC9

    SuperAdmin --- UC1
    SuperAdmin --- UC2
    SuperAdmin --- UC3
    SuperAdmin --- UC4
    SuperAdmin --- UC8
    SuperAdmin --- UC9

    UC1 --> UC2 --> UC3 --> UC4
    UC4 -. "extend" .-> UC5
    UC4 -. "extend" .-> UC6
    UC4 -. "include" .-> UC7
    UC4 --> UC8 --> UC9
```

**Deskripsi Use Case:**

| Use Case | Aktor | Deskripsi |
|---|---|---|
| Login | Kasir, Super Admin | Autentikasi pengguna sebelum mengakses sistem |
| Mengelola CRUD Produk | Kasir, Super Admin | Tambah, edit, hapus data produk bakso |
| Input Pesanan & Nama Pembeli | Kasir, Super Admin | Mencatat pesanan beserta identitas pembeli |
| Memilih Metode Pembayaran | Kasir, Super Admin | Menentukan metode bayar (Tunai/QRIS) saat transaksi |
| Tunai *(extend)* | Kasir, Super Admin | Varian pembayaran tunai, memicu hitung kembalian |
| QRIS *(extend)* | Kasir, Super Admin | Varian pembayaran non-tunai via kode QRIS statis |
| Cetak Struk Otomatis *(include)* | Kasir, Super Admin | Selalu dieksekusi setiap pembayaran berhasil dikonfirmasi |
| Memantau Antrian FIFO | Kasir, Super Admin | Melihat & memperbarui status antrian pesanan |
| Melihat Riwayat Penjualan | Kasir, Super Admin | Melihat & memfilter rekap transaksi harian |

> **Catatan praktik terbaik:** Walaupun pada rancangan use case kedua aktor memiliki akses yang sama, untuk keamanan produksi disarankan membatasi hak hapus/CRUD produk dan akses laporan hanya untuk **Super Admin**, sementara Kasir difokuskan pada operasional transaksi harian. Pembatasan ini dapat diterapkan melalui *role-based middleware* di Express.

---

### 3.2 Activity Diagram

#### 3.2.1 Login

```mermaid
flowchart TD
    subgraph User["Kasir / Super Admin"]
        LGstart(("Mulai")) --> LG1["Buka Halaman Login"]
        LG1 --> LG2["Input Username & Password"]
        LG2 --> LG3["Klik Tombol Login"]
    end
    subgraph Sistem["Sistem"]
        LG4["Autentikasi"] --> LG5{"Autentikasi Valid?"}
        LG5 -->|"Ya"| LG6["Generate Token JWT"]
        LG6 --> LG7["Redirect ke Dashboard"]
        LG7 --> LGend(("Selesai"))
        LG5 -->|"Tidak"| LG8["Tampilkan Pesan Error"]
    end
    LG3 --> LG4
    LG8 --> LG2
```

#### 3.2.2 Kelola Produk (CRUD)

```mermaid
flowchart TD
    subgraph User["Kasir / Super Admin"]
        CPstart(("Mulai")) --> CP1["Login Berhasil"]
        CP1 --> CP2["Buka Menu Kelola Produk"]
        CP2 --> CP3{"Pilih Aksi"}
        CP3 -->|"Tambah"| CP4["Isi Form Produk<br/>(Nama, Harga, Stok)"]
        CP4 --> CP5["Klik Simpan"]
        CP3 -->|"Edit"| CP6["Klik Edit Produk"]
        CP6 --> CP7["Ubah Data & Klik Update"]
        CP3 -->|"Hapus"| CP8["Klik Hapus Produk"]
    end
    subgraph Sistem["Sistem"]
        CP9["Tampilkan Data Produk"]
        CP10["Tampilkan Form Edit<br/>dengan Data Lama"]
        CP11{"Konfirmasi Hapus?"}
        CP12["Validasi & Simpan<br/>Data ke DB"]
        CP13["Update Data DB"]
        CP14["Hapus Data DB"]
        CP15["Tampilkan Notifikasi Berhasil"]
        CP16["Refresh Daftar Produk"]
        CPend(("Selesai"))
    end
    CP2 --> CP9
    CP9 --> CP3
    CP6 --> CP10
    CP10 --> CP7
    CP8 --> CP11
    CP11 -->|"Tidak"| CP9
    CP11 -->|"Ya"| CP14
    CP5 --> CP12
    CP7 --> CP13
    CP12 --> CP15
    CP13 --> CP15
    CP14 --> CP15
    CP15 --> CP16
    CP16 --> CPend
```

#### 3.2.3 Input Pesanan

```mermaid
flowchart TD
    subgraph User["Kasir / Super Admin"]
        IPstart(("Mulai")) --> IP1["Buka Menu Input Pesanan"]
        IP1 --> IP2["Input Nama Pembeli"]
        IP2 --> IP3["Pilih Produk dari Daftar"]
        IP3 --> IP4["Input Jumlah Pesanan"]
        IP4 --> IP6{"Tambah Item Lagi?"}
        IP6 -->|"Tidak"| IP7["Klik Konfirmasi Pesanan"]
    end
    subgraph Sistem["Sistem"]
        IP8["Tampilkan Form Pesanan<br/>& Daftar Produk"]
        IP5["Hitung Subtotal & Total Harga"]
        IPend(("Selesai"))
    end
    IP1 --> IP8
    IP8 --> IP2
    IP4 --> IP5
    IP5 --> IP6
    IP6 -->|"Ya"| IP3
    IP7 --> IPend
```

#### 3.2.4 Pembayaran

```mermaid
flowchart TD
    subgraph User["Kasir / Super Admin"]
        PBstart(("Mulai")) --> PB1["Pesanan Dikonfirmasi"]
        PB3{"Pilih Metode Bayar"}
        PB4["Pilih Tunai"]
        PB5["Input Nominal Uang Diterima"]
        PB6["Pilih QRIS"]
        PB7["Pembeli Scan & Bayar via QRIS"]
        PB8["Konfirmasi Pembayaran Diterima"]
    end
    subgraph Sistem["Sistem"]
        PB2["Tampilkan Total Harga &<br/>Pilihan Metode Bayar"]
        PB9["Hitung Pas/Kembalian"]
        PB10["Tampilkan Nominal<br/>Pas/Kembalian"]
        PB11["Tampilkan QR Code Statis"]
        PB12["Update Status Pesanan &<br/>Catat Status Pembayaran di DB"]
        PB13["Cetak Struk Otomatis"]
        PBend(("Selesai"))
    end
    PB1 --> PB2 --> PB3
    PB3 -->|"Tunai"| PB4 --> PB5 --> PB9 --> PB10
    PB3 -->|"QRIS"| PB6 --> PB11 --> PB7 --> PB8
    PB10 --> PB12
    PB8 --> PB12
    PB12 --> PB13 --> PBend
```

#### 3.2.5 Monitor Antrian (FIFO)

```mermaid
flowchart TD
    subgraph User["Kasir / Super Admin"]
        MAstart(("Mulai")) --> MA1["Buka Menu Monitor Antrian"]
        MA4["Panggil Antrian Berikutnya"]
        MA6["Proses Pesanan Pembeli"]
        MA7["Klik Tandai Selesai"]
    end
    subgraph Sistem["Sistem"]
        MA2["Ambil Data Antrian FIFO dari DB<br/>(urut entered_at ASC)"]
        MA3["Tampilkan Daftar Antrian<br/>(Menunggu / Diproses / Selesai)"]
        MAcheck{"Ada Antrian<br/>Berikutnya?"}
        MA5["Update Status Antrian → Diproses<br/>Tampilkan Nomor Antrian"]
        MA8["Update Status → Selesai &<br/>Catat completed_at"]
        MA9["Hitung Waktu Layanan<br/>(completed_at - entered_at)"]
        MA10["Refresh Tampilan Antrian"]
        MAend(("Selesai"))
    end
    MA1 --> MA2 --> MA3 --> MAcheck
    MAcheck -->|"Ya"| MA4 --> MA5 --> MA6 --> MA7 --> MA8 --> MA9 --> MA10
    MA10 --> MAcheck
    MAcheck -->|"Tidak"| MAend
```

#### 3.2.6 Riwayat Penjualan

```mermaid
flowchart TD
    subgraph User["Kasir / Super Admin"]
        RPstart(("Mulai")) --> RP1["Buka Menu Riwayat Penjualan"]
        RPf{"Gunakan Filter?"}
        RP5["Atur Filter<br/>(Tanggal / Metode Bayar)"]
        RPd{"Lihat Detail<br/>Transaksi?"}
        RP8["Klik Transaksi untuk Detail"]
        RPc{"Cetak Ulang<br/>Struk?"}
    end
    subgraph Sistem["Sistem"]
        RP2["Ambil Data Riwayat dari DB"]
        RP3["Tampilkan Daftar<br/>Riwayat Penjualan"]
        RP6["Filter & Query Data<br/>Sesuai Kriteria"]
        RP7["Tampilkan Hasil Filter"]
        RP9["Tampilkan Detail Transaksi<br/>(Item, Total, Pembeli, Waktu)"]
        RP11["Cetak Struk Ulang"]
        RPend(("Selesai"))
    end
    RP1 --> RP2 --> RP3 --> RPf
    RPf -->|"Ya"| RP5 --> RP6 --> RP7 --> RPd
    RPf -->|"Tidak"| RPd
    RPd -->|"Ya"| RP8 --> RP9 --> RPc
    RPd -->|"Tidak"| RPc
    RPc -->|"Ya"| RP11 --> RPend
    RPc -->|"Tidak"| RPend
```

---

### 3.3 Sequence Diagram (Detail Teknis)

Sequence diagram berikut menggambarkan interaksi antar layer (Frontend React, Backend Express, Database MySQL) secara teknis sesuai tech stack yang dipilih, melengkapi activity diagram di atas.

#### 3.3.1 Sequence Diagram — Login

```mermaid
sequenceDiagram
    actor K as Kasir / Super Admin
    participant FE as Frontend (React)
    participant BE as Backend (Express API)
    participant DB as Database (MySQL)

    K->>FE: Input username & password
    FE->>BE: POST /api/auth/login
    BE->>DB: SELECT * FROM users WHERE username = ?
    DB-->>BE: Data user
    BE->>BE: Verifikasi password (bcrypt)
    alt Kredensial valid
        BE->>BE: Generate JWT Token
        BE-->>FE: 200 OK { token, role }
        FE-->>K: Redirect ke Dashboard
    else Kredensial tidak valid
        BE-->>FE: 401 Unauthorized
        FE-->>K: Tampilkan pesan error
    end
```

#### 3.3.2 Sequence Diagram — Input Pesanan, Pembayaran, dan Antrian FIFO

```mermaid
sequenceDiagram
    actor Ks as Kasir
    participant FE as Frontend (React)
    participant BE as Backend (Express API)
    participant DB as Database (MySQL)

    Ks->>FE: Input nama pembeli & pilih produk
    FE->>BE: GET /api/produk
    BE->>DB: SELECT * FROM produk
    DB-->>BE: Daftar produk
    BE-->>FE: 200 OK (daftar produk)
    Ks->>FE: Klik Konfirmasi Pesanan
    Ks->>FE: Pilih metode bayar & input nominal
    FE->>BE: POST /api/pesanan
    BE->>DB: INSERT INTO pesanan (...)
    BE->>DB: INSERT INTO detail_pesanan (...)
    BE->>DB: INSERT INTO pembayaran (...)
    DB-->>BE: pesanan_id, nomor_antrian, entered_at
    BE-->>FE: 201 Created { nomor_antrian, total, kembalian }
    FE-->>Ks: Cetak struk otomatis (no. antrian, status "diproses")

    Note over BE,DB: Antrian FIFO = ORDER BY entered_at ASC WHERE status='diproses'

    Ks->>FE: Klik "Tandai Selesai" pada antrian
    FE->>BE: PUT /api/pesanan/:id/status
    BE->>DB: UPDATE pesanan SET status='selesai', completed_at=NOW()
    DB-->>BE: OK
    BE-->>FE: 200 OK
    FE-->>Ks: Update tampilan antrian secara real-time
```

---

## 4. Flowchart Sistem

### 4.1 Flowchart Alur Bisnis Keseluruhan

Flowchart ini menggambarkan alur proses bisnis dari sudut pandang operasional warung bakso secara end-to-end, sebagai pelengkap level abstraksi di atas activity diagram per-modul.

```mermaid
flowchart TD
    A(("Mulai")) --> B["Pelanggan Datang ke Kasir"]
    B --> C["Kasir Input Nama Pembeli & Pesanan"]
    C --> D["Sistem Hitung Total Harga"]
    D --> E{"Pilih Metode Bayar"}
    E -->|"Tunai"| F["Kasir Terima Uang Tunai"]
    E -->|"QRIS"| G["Pelanggan Scan QRIS Statis"]
    F --> H["Sistem Catat Pembayaran"]
    G --> H
    H --> I["Sistem Generate Nomor Antrian FIFO<br/>(Status: Diproses)"]
    I --> J["Struk Tercetak Otomatis"]
    J --> K["Pesanan Masuk Antrian Dapur<br/>(Urut Berdasarkan Waktu Masuk)"]
    K --> L["Dapur Menyiapkan Pesanan<br/>Sesuai Urutan FIFO"]
    L --> M["Kasir Klik Tandai Selesai"]
    M --> N["Sistem Update Status: Selesai"]
    N --> O["Pelanggan Menerima Pesanan"]
    O --> P["Transaksi Tercatat di<br/>Rekapitulasi Penjualan Harian"]
    P --> Q(("Selesai"))
```

### 4.2 Flowchart Algoritma FIFO

Logika inti yang membedakan sistem ini dari kasir digital konvensional adalah algoritma antrean FIFO berikut:

```mermaid
flowchart TD
    A(("Mulai")) --> B["Pesanan Baru Masuk"]
    B --> C["Simpan ke tabel pesanan<br/>entered_at = NOW(), status = 'diproses'"]
    C --> D["Antrian = SELECT * FROM pesanan<br/>WHERE status='diproses'<br/>ORDER BY entered_at ASC"]
    D --> E{"Ada Pesanan Berikutnya<br/>di Antrian?"}
    E -->|"Ya"| F["Ambil Baris Teratas Antrian<br/>(entered_at paling lama)"]
    F --> G["Proses & Sajikan Pesanan"]
    G --> H["Update status = 'selesai'<br/>completed_at = NOW()"]
    H --> D
    E -->|"Tidak"| I(("Selesai / Menunggu Pesanan Baru"))
```

> **Kompleksitas:** Karena pengambilan antrian hanya melibatkan `ORDER BY entered_at ASC` pada kolom yang sebaiknya diberi index, operasi ini berjalan efisien (O(log n) untuk pencarian terurut berkat index B-Tree MySQL) bahkan saat jam sibuk dengan volume pesanan tinggi.

---

## 5. User Flow

Berbeda dengan activity diagram (fokus pada logika proses), user flow berikut menggambarkan **navigasi antar-halaman/screen** yang dilalui pengguna di aplikasi React.

### 5.1 User Flow — Kasir

```mermaid
flowchart TD
    A(("Mulai")) --> B["Halaman Login"]
    B --> C["Dashboard Kasir"]
    C --> D["Menu Input Pesanan"]
    D --> E["Form: Nama Pembeli + Pilih Produk"]
    E --> F["Konfirmasi Pesanan"]
    F --> G["Pilih Metode Pembayaran"]
    G --> H["Struk Tercetak + Nomor Antrian"]
    H --> C
    C --> I["Menu Monitor Antrian"]
    I --> J["Lihat Daftar Antrian"]
    J --> K["Tandai Pesanan Selesai"]
    K --> C
    C --> L["Menu Riwayat Penjualan"]
    L --> M["Lihat / Filter Transaksi"]
    M --> N["Cetak Ulang Struk (opsional)"]
    N --> C
    C --> O["Logout"]
    O --> P(("Selesai"))
```

### 5.2 User Flow — Super Admin

```mermaid
flowchart TD
    A(("Mulai")) --> B["Halaman Login"]
    B --> C["Dashboard Super Admin"]
    C --> D["Menu Kelola Produk"]
    D --> E["Tambah / Edit / Hapus Produk"]
    E --> C
    C --> F["Menu Input Pesanan"]
    F --> C
    C --> G["Menu Monitor Antrian"]
    G --> C
    C --> H["Menu Riwayat Penjualan & Laporan Harian"]
    H --> C
    C --> I["Logout"]
    I --> J(("Selesai"))
```

---

## 6. ERD (Entity Relationship Diagram)

### 6.1 Diagram ERD

```mermaid
erDiagram
    USERS {
        int id PK
        varchar nama
        varchar username
        varchar password
        enum role "kasir, super_admin"
        timestamp created_at
        timestamp updated_at
    }
    PRODUK {
        int id PK
        varchar nama_produk
        decimal harga
        int stok
        timestamp created_at
        timestamp updated_at
    }
    PESANAN {
        int id PK
        int nomor_antrian
        varchar nama_pembeli
        int user_id FK
        decimal total_harga
        enum status_pesanan "diproses, selesai"
        datetime entered_at
        datetime completed_at
        timestamp created_at
    }
    DETAIL_PESANAN {
        int id PK
        int pesanan_id FK
        int produk_id FK
        int jumlah
        decimal subtotal
    }
    PEMBAYARAN {
        int id PK
        int pesanan_id FK
        enum metode_bayar "tunai, qris"
        decimal nominal_diterima
        decimal kembalian
        enum status_pembayaran "lunas"
        datetime paid_at
    }

    USERS ||--o{ PESANAN : "melayani"
    PESANAN ||--|{ DETAIL_PESANAN : "memiliki"
    PRODUK ||--o{ DETAIL_PESANAN : "dipesan dalam"
    PESANAN ||--|| PEMBAYARAN : "dibayar dengan"
```

> **Catatan desain:** Tidak dibuat tabel `antrian` terpisah. Status antrian FIFO dikelola langsung melalui kolom `status_pesanan`, `entered_at`, dan `completed_at` pada tabel `PESANAN`, sehingga query antrian cukup `ORDER BY entered_at ASC`. Hal ini konsisten dengan batasan ruang lingkup pada proposal (tidak ada modul stok inventaris/laporan bulanan yang kompleks).

### 6.2 Data Dictionary

**Tabel `users`**

| Kolom | Tipe Data | Keterangan |
|---|---|---|
| id | INT, PK, AUTO_INCREMENT | Identitas unik pengguna |
| nama | VARCHAR(100) | Nama lengkap pengguna |
| username | VARCHAR(50), UNIQUE | Username login |
| password | VARCHAR(255) | Password ter-hash (bcrypt) |
| role | ENUM('kasir','super_admin') | Peran pengguna |
| created_at | TIMESTAMP | Waktu data dibuat |
| updated_at | TIMESTAMP | Waktu data diperbarui |

**Tabel `produk`**

| Kolom | Tipe Data | Keterangan |
|---|---|---|
| id | INT, PK, AUTO_INCREMENT | Identitas unik produk |
| nama_produk | VARCHAR(100) | Nama produk (mis. "Bakso Urat") |
| harga | DECIMAL(10,2) | Harga satuan |
| stok | INT | Jumlah stok tersedia |
| created_at / updated_at | TIMESTAMP | Audit waktu |

**Tabel `pesanan`**

| Kolom | Tipe Data | Keterangan |
|---|---|---|
| id | INT, PK, AUTO_INCREMENT | Identitas unik pesanan |
| nomor_antrian | INT | Nomor antrian yang tercetak di struk |
| nama_pembeli | VARCHAR(100) | Nama pembeli yang diinput kasir |
| user_id | INT, FK → users.id | Kasir yang melayani transaksi |
| total_harga | DECIMAL(10,2) | Total seluruh item pesanan |
| status_pesanan | ENUM('diproses','selesai') | Status FIFO pesanan |
| entered_at | DATETIME | Waktu pesanan masuk (dasar urutan FIFO) |
| completed_at | DATETIME, NULLABLE | Waktu pesanan ditandai selesai |
| created_at | TIMESTAMP | Audit waktu |

**Tabel `detail_pesanan`**

| Kolom | Tipe Data | Keterangan |
|---|---|---|
| id | INT, PK, AUTO_INCREMENT | Identitas unik baris detail |
| pesanan_id | INT, FK → pesanan.id | Relasi ke pesanan induk |
| produk_id | INT, FK → produk.id | Produk yang dipesan |
| jumlah | INT | Kuantitas produk dipesan |
| subtotal | DECIMAL(10,2) | harga × jumlah |

**Tabel `pembayaran`**

| Kolom | Tipe Data | Keterangan |
|---|---|---|
| id | INT, PK, AUTO_INCREMENT | Identitas unik pembayaran |
| pesanan_id | INT, FK → pesanan.id, UNIQUE | Relasi 1:1 ke pesanan |
| metode_bayar | ENUM('tunai','qris') | Metode pembayaran dipilih |
| nominal_diterima | DECIMAL(10,2) | Nominal uang tunai diterima (jika tunai) |
| kembalian | DECIMAL(10,2) | Kembalian (jika tunai) |
| status_pembayaran | ENUM('lunas') | Status pelunasan (upfront payment) |
| paid_at | DATETIME | Waktu pembayaran dikonfirmasi |

---

## 7. Pemetaan REST API

| Method | Endpoint | Deskripsi | Role |
|---|---|---|---|
| POST | `/api/auth/login` | Login & terbitkan JWT | Semua |
| GET | `/api/produk` | Lihat daftar produk | Semua |
| POST | `/api/produk` | Tambah produk baru | Kasir/Super Admin |
| PUT | `/api/produk/:id` | Edit produk | Kasir/Super Admin |
| DELETE | `/api/produk/:id` | Hapus produk | Kasir/Super Admin |
| POST | `/api/pesanan` | Buat pesanan baru + catat pembayaran + cetak struk | Kasir/Super Admin |
| GET | `/api/pesanan/antrian` | Lihat antrian FIFO (urut `entered_at ASC`) | Kasir/Super Admin |
| PUT | `/api/pesanan/:id/status` | Update status pesanan → "selesai" | Kasir/Super Admin |
| GET | `/api/riwayat` | Lihat riwayat penjualan (mendukung query filter `tanggal`, `metode_bayar`) | Kasir/Super Admin |
| GET | `/api/riwayat/:id` | Lihat detail satu transaksi | Kasir/Super Admin |
| GET | `/api/riwayat/:id/struk` | Cetak ulang struk transaksi | Kasir/Super Admin |

---

## 8. Rencana Implementasi (Roadmap)

| Fase | Modul | Deskripsi Aktivitas | Estimasi |
|---|---|---|---|
| 1 | Persiapan & Setup | Setup repo, struktur project React + Express, konfigurasi database MySQL, environment variable | Minggu 1 |
| 2 | Autentikasi | Implementasi login, hashing password (bcrypt), JWT, middleware role-based | Minggu 2 |
| 3 | Kelola Produk | CRUD produk (frontend form + backend endpoint + validasi) | Minggu 3 |
| 4 | Input Pesanan | Form input pesanan, kalkulasi subtotal/total, simpan ke DB | Minggu 4 |
| 5 | Pembayaran & Struk | Modul tunai/QRIS, hitung kembalian, generate nomor antrian, cetak struk otomatis | Minggu 5 |
| 6 | Antrian FIFO | Endpoint & UI monitor antrian real-time, tombol update status selesai, hitung waktu layanan | Minggu 6 |
| 7 | Riwayat Penjualan | List + filter (tanggal/metode bayar), detail transaksi, cetak ulang struk | Minggu 7 |
| 8 | Uji Coba | Unit testing, integration testing endpoint, black-box testing UI, UAT bersama pemilik usaha bakso | Minggu 8 |
| 9 | Deployment | Build production, deploy backend (VPS/cloud) & frontend (static hosting), setup database production | Minggu 9 |

---

## 9. Kesimpulan

Dokumen ini menerjemahkan rancangan *software modeling* (use case & activity diagram) yang telah dibuat ke dalam rencana implementasi teknis yang konkret berbasis stack **React.js + Express.js + MySQL**. Dengan adanya flowchart bisnis, flowchart algoritma FIFO, user flow per-role, ERD, serta pemetaan REST API, tim pengembang (atau penulis skripsi secara individu) memiliki panduan yang jelas dari tahap perancangan hingga tahap implementasi dan pengujian aplikasi kasir berbasis web ini.
