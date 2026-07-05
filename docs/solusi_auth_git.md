# Panduan Penanganan Error: Autentikasi Git (Push ke GitHub)

Dokumen ini menjelaskan mengapa proses `git push` otomatis gagal akibat masalah autentikasi kredensial GitHub dan memberikan solusi cara menyelesaikannya.

---

## 1. Penyebab Masalah (Root Cause)
Ketika sistem mencoba mengunggah berkas menggunakan perintah `git push -u origin main`, GitHub menolak permintaan tersebut dengan pesan:
> *remote: Invalid username or token. Password authentication is not supported for Git operations.*
> *fatal: Authentication failed for 'https://github.com/umarfa11/Tugas-Proyek.git/'*

Hal ini terjadi karena Git memerlukan **Personal Access Token (PAT)** atau otorisasi SSH Anda untuk mengunggah berkas ke repositori `umarfa11/Tugas-Proyek`. GitHub tidak lagi mendukung kata sandi akun biasa untuk operasi git push sejak Agustus 2021.

---

## 2. Solusi Langkah Demi Langkah (Penyelesaian Mandiri)

Karena kredensial GitHub terikat dengan akun Anda, Anda dapat melakukan push dengan salah satu cara berikut langsung dari terminal Anda sendiri:

### Cara 1: Menjalankan Push dari Terminal Lokal Anda (Rekomendasi)
Karena Git di perangkat Anda mungkin sudah terintegrasi dengan Git Credential Manager, silakan jalankan perintah ini di Command Prompt / PowerShell laptop Anda:
1.  Buka terminal/CMD Anda.
2.  Masuk ke direktori proyek:
    ```bash
    cd "c:\Users\FadiiL\OneDrive\Desktop\App Kasir"
    ```
3.  Jalankan perintah push:
    ```bash
    git push -u origin main
    ```
4.  Git Credential Manager akan membuka jendela popup browser untuk meminta Anda melakukan login dan memberikan izin akses secara instan.

### Cara 2: Menggunakan Personal Access Token (PAT)
Jika Anda ingin menggunakan Token Akses:
1.  Buat token baru di akun GitHub Anda melalui menu **Settings > Developer Settings > Personal Access Tokens > Tokens (classic)**. Centang opsi `repo`.
2.  Perbarui URL remote git Anda di terminal dengan menyertakan token tersebut:
    ```bash
    git remote set-url origin https://TOKEN_AKSES_ANDA@github.com/umarfa11/Tugas-Proyek.git
    ```
3.  Lakukan push kembali:
    ```bash
    git push -u origin main
    ```

---

## 3. Flowchart Penanganan Error Push

```mermaid
flowchart TD
    Start["Jalankan git push -u origin main"] --> AttemptPush["Git Hubungi Server GitHub"]
    AttemptPush --> CheckAuth{"Apakah Token / Kredensial Valid?"}
    
    CheckAuth -- "Tidak (Invalid Username/Token)" --> ErrorAuth["Error: Authentication Failed"]
    ErrorAuth --> ChooseSolution{"Pilih Solusi"}
    
    ChooseSolution -- "Buka Terminal Sendiri" --> RunManual["Jalankan 'git push' di CMD Laptop"]
    RunManual --> GCM["Git Credential Manager Membuka Popup Login"]
    GCM --> AuthSuccess["Otorisasi Diterima"]
    
    ChooseSolution -- "Pakai Token (PAT)" --> GenerateToken["Generate PAT di GitHub Settings"]
    GenerateToken --> SetRemote["Update URL Remote dengan Token"]
    SetRemote --> RunPushToken["Jalankan 'git push' Ulang"]
    RunPushToken --> AuthSuccess
    
    CheckAuth -- "Ya" --> AuthSuccess
    AuthSuccess --> SuccessPush["Repositori Berhasil Terunggah ke GitHub!"]
```

---

## 4. Aliran Navigasi Pengguna (User Flow - Developer)

```mermaid
flowchart TD
    User["Super Admin / Developer"] --> OpenCMD["Buka CMD / Terminal Pribadi"]
    OpenCMD --> NavigateDir["cd 'c:\Users\FadiiL\OneDrive\Desktop\App Kasir'"]
    NavigateDir --> PushCmd["git push -u origin main"]
    PushCmd --> LoginWindow["Jendela Otorisasi Browser Muncul"]
    LoginWindow --> ConfirmAuth["Klik Izin Masuk (Authorize Git)"]
    ConfirmAuth --> CompletePush["Progres Pengiriman File Berjalan Sampai 100%"]
```

---

## 5. Diagram Error Autentikasi

```mermaid
sequenceDiagram
    autonumber
    actor Dev as 🧑‍💻 Developer (Antigravity)
    participant Git as 🛠️ Git Lokal
    participant GH as 🐙 GitHub Remote Repo
    
    Dev->>Git: git push -u origin main
    Git->>GH: Handshake & Kirim Request Upload ke umarfa11/Tugas-Proyek.git
    Note over GH: Validasi Hak Akses & Kredensial
    GH-->>Git: HTTP 401 Unauthorized / Invalid Token
    Git-->>Dev: fatal: Authentication failed
    
    Note over Dev: Peringatan ke Pengguna:<br/>Harus dijalankan di terminal lokal dengan login aktif.
```
