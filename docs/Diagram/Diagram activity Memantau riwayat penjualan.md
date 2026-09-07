# Activity Diagram: Memantau Riwayat Penjualan

```mermaid
flowchart TD
    subgraph Aktor [Kasir / Super Admin]
        direction TB
        Start(( ))
        B1[Buka Halaman Riwayat Penjualan]
        B2[Pilih Filter Tanggal / Data]
        B3[Klik Detail Transaksi]
        B4[Tutup Detail Transaksi]
    end

    subgraph Sistem [Sistem]
        direction TB
        C1[Tampilkan Riwayat Transaksi]
        C2[Proses Filter Data]
        C3[Tampilkan Data Terfilter]
        C4[Tampilkan Detail & Struk Transaksi]
        End((( )))
    end

    Start --> B1
    B1 --> C1
    C1 --> B2
    B2 --> C2
    C2 --> C3
    C3 --> B3
    B3 --> C4
    C4 --> B4
    B4 --> End
```

### Penjelasan:
1. **Aktor** membuka halaman Riwayat Penjualan.
2. **Sistem** menampilkan daftar seluruh transaksi yang sudah selesai.
3. **Aktor** dapat mengisi form filter tanggal atau pencarian spesifik.
4. **Sistem** memproses filter dan menampilkan data transaksi yang sesuai.
5. **Aktor** mengklik tombol detail pada salah satu transaksi.
6. **Sistem** memunculkan jendela/halaman berisi rincian pesanan tersebut (beserta histori struk).
7. **Aktor** dapat menutup rincian transaksi tersebut jika sudah selesai melihatnya.
