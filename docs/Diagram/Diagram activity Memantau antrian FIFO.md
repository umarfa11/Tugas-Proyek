# Activity Diagram: Memantau Antrian FIFO

```mermaid
flowchart TD
    subgraph Aktor [Kasir / Super Admin]
        direction TB
        Start(( ))
        B1[Buka Halaman Antrian FIFO]
        B2[Klik Selesaikan Pesanan]
    end

    subgraph Sistem [Sistem]
        direction TB
        C1[Tampilkan Daftar Antrian Aktif]
        C2[Perbarui Status Pesanan]
        C3[Hapus dari Tampilan Antrian Aktif]
        End((( )))
    end

    Start --> B1
    B1 --> C1
    C1 --> B2
    B2 --> C2
    C2 --> C3
    C3 --> End
```

### Penjelasan:
1. **Aktor** membuka halaman Antrian FIFO.
2. **Sistem** menampilkan daftar pesanan yang berstatus aktif berdasarkan waktu (First In First Out).
3. Setelah pesanan selesai dibuat (disajikan), **Aktor** mengklik tombol selesaikan pada pesanan paling awal tersebut.
4. **Sistem** memperbarui status pesanan menjadi selesai di database.
5. **Sistem** menghapus pesanan tersebut dari layar antrian aktif.
