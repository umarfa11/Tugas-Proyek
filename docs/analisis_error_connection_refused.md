# Analisis Error: Connection Refused (net::ERR_CONNECTION_REFUSED)

Dokumen ini menganalisis penyebab terjadinya kesalahan `AxiosError: Network Error` pada Dasbor Admin serta solusi penanganannya.

---

## 1. Penyebab Masalah (Root Cause Analysis)
Kesalahan `net::ERR_CONNECTION_REFUSED` ke alamat `http://localhost:5000` terjadi karena **server backend Express.js tidak berjalan** pada port `5000` ketika frontend mencoba mengirim permintaan API (`/api/produk`, `/api/pesanan/antrian`, `/api/riwayat`).

*   **Gejala:** Dasbor Admin hanya menampilkan loading tanpa henti atau data kosong, disertai tumpukan galat (error stack) Axios Network Error di konsol pengembang (developer tools).
*   **Investigasi:** Port `5000` dicek dan statusnya bebas (tidak ada proses yang mendengarkan). Ini membuktikan bahwa proses `nodemon src/server.js` terhenti secara tidak sengaja.
*   **Solusi:** Menyalakan kembali server backend menggunakan `npm run dev` di folder `backend`. Port sekarang aktif dan data dasbor kembali termuat dengan benar.

---

## 2. Diagram Aliran Proses Penanganan (Flowchart)

```mermaid
flowchart TD
    Start["Admin Buka Aplikasi Kasir (Frontend)"] --> RequestAPI["Axios Kirim GET Request ke :5000/api/..."]
    RequestAPI --> CheckBE{"Apakah Server Backend Aktif di Port 5000?"}
    
    CheckBE -- "Tidak (Mati)" --> ErrRefused["Error: ERR_CONNECTION_REFUSED / Network Error"]
    ErrRefused --> RenderCrash["Dasbor Gagal Dimuat (Data Kosong)"]
    RenderCrash --> ActionFix["Jalankan 'npm run dev' di Folder backend"]
    ActionFix --> StartBE["Server Backend Berhasil Aktif di Port 5000"]
    StartBE --> RequestAPI
    
    CheckBE -- "Ya (Aktif)" --> FetchDB["Prisma Hubungi Database MySQL Aiven"]
    FetchDB --> ReturnData["Kirim Data JSON Kembali ke Frontend"]
    ReturnData --> RenderDashboard["Dasbor Terisi & Grafik Tampil Sempurna"]
```

---

## 3. Aliran Navigasi Pengguna saat Error Terjadi (User Flow)

```mermaid
flowchart TD
    Admin["Super Admin"] --> OpenApp["Buka Dashboard http://localhost:5173"]
    OpenApp --> ViewDash["Masuk Halaman Ikhtisar Bisnis"]
    ViewDash --> CheckData{"Apakah Data Muncul?"}
    
    CheckData -- "Tidak (Hanya Loading/Kosong)" --> OpenConsole["Buka Developer Tools (F12)"]
    OpenConsole --> InspectNetwork["Lihat Log Kesalahan: net::ERR_CONNECTION_REFUSED"]
    InspectNetwork --> FixStep["Buka Terminal -> Masuk Folder 'backend' -> Jalankan 'npm run dev'"]
    FixStep --> RefreshApp["Muat Ulang Halaman Dasbor (Refresh)"]
    
    CheckData -- "Ya" --> ViewCharts["Analisis Grafik Penjualan & Aktivitas Terkini"]
    RefreshApp --> ViewCharts
```

---

## 4. Diagram Penanganan Hambatan (Diagram Error)

Sequence Diagram berikut menunjukkan bagaimana koneksi terputus dan dipulihkan kembali:

```mermaid
sequenceDiagram
    autonumber
    actor Admin as 👤 Super Admin
    participant FE as Frontend (React / Vite)
    participant BE as Backend (Express / Port 5000)
    participant DB as Database (Prisma / MySQL)
    
    Note over FE, BE: Kasus 1: Server Backend Mati
    Admin->>FE: Buka Dashboard
    FE->>BE: GET /api/produk (Port 5000)
    Note over FE: Sambungan Ditolak (net::ERR_CONNECTION_REFUSED)
    FE-->>Admin: Tampilkan Pesan "Gagal mengambil data dashboard" (AxiosError)
    
    Note over FE, BE: Pemulihan: Menyalakan Server Backend
    Admin->>BE: Jalankan "npm run dev" di terminal
    Note over BE: Server aktif & mendengarkan di Port 5000
    
    Note over FE, BE: Kasus 2: Server Backend Aktif Kembali
    Admin->>FE: Segarkan Halaman Dashboard
    FE->>BE: GET /api/produk
    BE->>DB: Query data produk via Prisma
    DB-->>BE: Mengembalikan 12 Item Menu aktif
    BE-->>FE: HTTP 200 OK (Data JSON Produk)
    FE-->>Admin: Menampilkan Dasbor Bisnis, Grafik & Aktivitas Terkini
```
