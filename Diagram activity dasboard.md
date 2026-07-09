# Activity Diagram: Dasboard

```mermaid
flowchart TD
    subgraph Aktor [Kasir / Super Admin]
        direction TB
        Start(( ))
        B1[Melihat Informasi Ringkasan]
        B2[Pilih Kategori Waktu <br> Mingguan/Bulanan/Tahunan]
        B3[Pilih Menu Navigasi]
    end

    subgraph Sistem [Sistem]
        direction TB
        C1[Menampilkan Halaman Dasboard]
        C2[Memuat Data Ringkasan]
        C3[Memperbarui Data Sesuai Kategori]
        C4{Cek Pilihan Menu}
        C5[Redirect ke Halaman Menu]
        End((( )))
    end

    Start --> C1
    C1 --> C2
    C2 --> B1
    B1 --> B2
    B2 --> C3
    C3 --> B1
    B1 --> B3
    B3 --> C4
    C4 --> C5
    C5 --> End
```

### Penjelasan:
1. Setelah login berhasil, **Sistem** menampilkan halaman Dasboard dan secara otomatis memuat data ringkasan.
2. **Aktor** melihat informasi ringkasan (seperti jumlah produk, total penjualan) yang ditampilkan oleh sistem.
3. **Aktor** dapat memilih kategori waktu (Mingguan, Bulanan, dan Tahunan) untuk memfilter data ringkasan.
4. Jika kategori dipilih, **Sistem** akan memperbarui data ringkasan sesuai dengan kategori waktu dan kembali menampilkannya.
5. **Aktor** memilih menu navigasi untuk pindah ke modul lain (seperti Kelola Akun, Kelola Produk, Kasir, atau Riwayat).
6. **Sistem** mengecek pilihan menu dari aktor lalu meredirect aktor ke halaman menu yang dituju.
