# Activity Diagram: Input Pesanan & Metode Pembayaran

```mermaid
flowchart TD
    subgraph Aktor [Kasir / Super Admin]
        direction TB
        Start(( ))
        B1[Buka Halaman Kasir]
        B2[Input Nama Pembeli & Pilih Produk]
        B3[Pilih Metode Pembayaran]
        B4[Input Nominal Tunai]
        B5[Scan QRIS]
    end

    subgraph Sistem [Sistem]
        direction TB
        C1[Hitung Total Harga]
        C2{Cek Metode Pembayaran}
        C3[Hitung Kembalian]
        C4[Generate QR Code QRIS]
        C5[Verifikasi Pembayaran Sukses]
        C6[Simpan Transaksi]
        C7[Masukkan ke Antrian FIFO]
        C8[Cetak Struk Otomatis]
        End((( )))
    end

    Start --> B1
    B1 --> B2
    B2 --> C1
    C1 --> B3
    B3 --> C2
    
    C2 -- Tunai --> B4
    B4 --> C3
    C3 --> C6
    
    C2 -- QRIS --> C4
    C4 --> B5
    B5 --> C5
    C5 --> C6
    
    C6 --> C7
    C6 --> C8
    C7 --> End
    C8 --> End
```

### Penjelasan:
1. **Aktor** membuka halaman Kasir/Input Pesanan.
2. **Aktor** menginput nama pembeli dan memilih produk ke dalam keranjang belanja.
3. **Sistem** otomatis menghitung total harga dari produk yang dipilih.
4. **Aktor** memilih metode pembayaran (Tunai atau QRIS).
5. Jika **Tunai**, aktor menginput uang yang diterima lalu sistem menghitung kembalian.
6. Jika **QRIS**, sistem membuat kode QR, aktor (pembeli) memindai, dan sistem memverifikasi pembayaran.
7. Setelah pembayaran dikonfirmasi, **Sistem** menyimpan transaksi.
8. Secara simultan, **Sistem** memasukkan pesanan tersebut ke antrian FIFO dan mencetak struk otomatis.
