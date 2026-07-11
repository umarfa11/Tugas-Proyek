# Activity Diagram: Kelola Produk Deaktif

```mermaid
flowchart TD
    subgraph Aktor [Super Admin]
        direction TB
        Start(( ))
        B1[Buka Halaman Produk Deaktif]
        B2[Pilih Aksi pada Produk]
        B3[Konfirmasi Hapus Permanen]
    end

    subgraph Sistem [Sistem]
        direction TB
        C1[Tampilkan Daftar Produk Deaktif]
        C2{Validasi Aksi}
        C3[Proses Restore Produk]
        C4[Hapus Data Secara Permanen]
        C5[Perbarui Database]
        C6[Tampilkan Pesan Sukses]
        End((( )))
    end

    Start --> B1
    B1 --> C1
    C1 --> B2
    B2 --> C2
    
    C2 --> |Restore| C3
    C2 --> |Hapus Permanen| B3
    
    B3 --> C4
    C3 --> C5
    C4 --> C5
    C5 --> C6
    C6 --> End
```

### Penjelasan:
1. **Aktor** (Super Admin) membuka halaman Produk Deaktif (tempat menyimpan daftar produk yang tidak aktif atau di-soft delete).
2. **Sistem** memuat dan menampilkan daftar produk deaktif dari database.
3. **Aktor** memilih aksi yang ingin dilakukan terhadap produk tertentu (opsinya biasanya adalah **Restore/Aktifkan Kembali** atau **Hapus Permanen**).
4. **Sistem** mengecek dan memvalidasi pilihan aksi tersebut.
5. Jika memilih **Restore**, sistem akan mengubah status produk tersebut kembali menjadi aktif di database.
6. Jika memilih **Hapus Permanen**, sistem akan meminta **Aktor** untuk mengkonfirmasi tindakan (karena data akan hilang). Setelah dikonfirmasi, sistem menghapus data secara permanen.
7. **Sistem** memperbarui database, menampilkan notifikasi sukses kepada aktor, dan proses pengelolaan produk deaktif selesai.
