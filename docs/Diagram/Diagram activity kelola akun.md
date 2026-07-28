# Activity Diagram: Kelola Akun (CRUD)

```mermaid
flowchart TD
    subgraph Aktor [Super Admin]
        direction TB
        Start(( ))
        B1[Buka Halaman Kelola Akun]
        B2[Pilih Aksi CRUD]
        B3[Input / Edit Data Akun]
        B4[Konfirmasi Hapus Data]
    end

    subgraph Sistem [Sistem]
        direction TB
        C1[Tampilkan Daftar Akun]
        C2{Validasi Aksi}
        C3[Proses Simpan/Ubah Data]
        C4[Proses Hapus Data]
        C5[Perbarui Database]
        C6[Tampilkan Pesan Sukses]
        End((( )))
    end

    Start --> B1
    B1 --> C1
    C1 --> B2
    B2 --> B3
    B2 --> B4
    B3 --> C2
    B4 --> C2
    C2 --> |Simpan/Ubah| C3
    C2 --> |Hapus| C4
    C3 --> C5
    C4 --> C5
    C5 --> C6
    C6 --> End
```

### Penjelasan:
1. **Aktor** (Super Admin) membuka halaman kelola akun.
2. **Sistem** menampilkan daftar akun yang sudah ada.
3. **Aktor** memilih aksi CRUD (Tambah, Edit, atau Hapus).
4. Jika Tambah atau Edit, **Aktor** memasukkan atau mengubah data akun. Jika Hapus, **Aktor** memberikan konfirmasi penghapusan.
5. **Sistem** memvalidasi aksi yang dipilih, lalu memproses penyimpanan, perubahan, atau penghapusan data.
6. **Sistem** memperbarui database, menampilkan pesan berhasil ke aktor, lalu proses selesai.
