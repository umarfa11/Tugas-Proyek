# Penjelasan Fitur Aplikasi KASIR BAKSOKU

Dokumen ini berisi penjelasan naratif dan mendetail mengenai setiap fitur yang ada di dalam aplikasi Kasir Baksoku. Anda dapat langsung menyalin (meng-*copy*) paragraf-paragraf di bawah ini ke dalam Bab Pembahasan / Bab Fitur pada Laporan Tugas Anda.

---

## 1. Sistem Manajemen Pengguna Berbasis Peran (Role-Based Access Control)
Aplikasi ini dilengkapi dengan sistem autentikasi modern menggunakan **JWT (JSON Web Token)** untuk menjamin keamanan akses data. Sistem membagi pengguna ke dalam dua tingkatan peran (*role*), yaitu **Super Admin** dan **Kasir**. Super Admin bertindak sebagai pemilik bisnis yang memiliki hak akses penuh ke seluruh sistem, termasuk mengelola data kasir, melihat laporan pendapatan, dan mengubah katalog produk. Di sisi lain, Kasir diberikan antarmuka khusus yang dibatasi hanya pada fitur operasional seperti Input Pesanan dan Monitor Antrian, sehingga meminimalisir risiko penyalahgunaan data penting oleh staf.

## 2. Dashboard Analitik Real-Time
Untuk memudahkan pemilik bisnis dalam memantau kinerja usahanya, aplikasi menyediakan halaman *Dashboard* bergaya modern dan *SaaS-grade*. Halaman ini menampilkan ringkasan data secara langsung (*real-time*) yang mencakup **Total Pendapatan Hari Ini**, **Total Pesanan**, **Jumlah Antrian Aktif**, dan **Total Produk Menu**. Selain itu, terdapat visualisasi data berupa grafik batang (*Bar Chart*) yang merepresentasikan tren penjualan bulanan selama tahun berjalan, serta daftar riwayat aktivitas transaksi sukses yang terbaru.

## 3. Manajemen Katalog Produk Tingkat Lanjut (CRUD & Soft Delete)
Fitur manajemen produk memungkinkan admin untuk menambah, mengubah, dan menghapus menu baksoku beserta foto, harga, dan jumlah stoknya. Sistem ini dilengkapi dengan logika keamanan tingkat tinggi yang disebut **Soft-Delete**. Ketika admin menghapus sebuah produk, produk tersebut tidak akan benar-benar dihapus dari basis data (*database*). Hal ini dirancang untuk mencegah terjadinya *crash* atau *error* pada data struk riwayat penjualan lama yang pernah membeli produk tersebut. Sistem dibekali dengan *Cron-Job* (tugas otomatis) di latar belakang yang baru akan menghapus produk beserta foto aslinya secara permanen jika produk tersebut sudah berstatus nonaktif lebih dari 30 hari.

## 4. Sistem Point of Sale (POS) dan Input Pesanan
Antarmuka mesin kasir (POS) dirancang dengan pendekatan *Mobile-First Experience*, menjadikannya sangat responsif dan mudah digunakan baik di komputer kasir maupun di layar ponsel/tablet staf pelayan. 
Fitur ini mencakup:
*   **Keranjang Cerdas**: Menghitung subtotal secara otomatis dan memvalidasi stok secara *real-time*, sehingga kasir tidak dapat memesan barang yang jumlahnya melebihi sisa stok di gudang.
*   **Dukungan Multi-Pembayaran**: Mengakomodasi metode pembayaran **Tunai (Cash)** yang dilengkapi dengan kalkulator uang kembalian otomatis, serta pembayaran nontunai seperti **QRIS**.

## 5. Optimalisasi Pencetakan Struk (Thermal Printer Ready)
Aplikasi ini dirancang siap pakai untuk kondisi lapangan (*production-ready*) dengan mengintegrasikan fitur Cetak Struk. Tata letak (*layout*) struk telah dikonfigurasi secara khusus menggunakan CSS Print Media (`@page { margin: 0; }`). Konfigurasi presisi ini memastikan bahwa saat kasir menekan tombol cetak, struk akan tercetak dengan rapi, tanpa margin berlebih, dan kompatibel dengan standar **Printer Thermal Bluetooth 58mm** yang umum digunakan oleh UMKM.

## 6. Manajemen Antrian Cerdas (Smart Queue System)
Setelah pesanan berhasil dibuat, sistem akan secara otomatis membuatkan Nomor Antrian pelanggan berdasarkan metode *First-In-First-Out (FIFO)*. Halaman **Monitor Antrian** memungkinkan staf untuk melihat daftar pesanan apa saja yang harus segera dibuat dan diproses. 
Sistem antrian ini bersifat dinamis; nomor antrian akan terus bertambah dan akan **otomatis di-reset kembali ke angka 1** oleh sistem ketika waktu menunjukkan pergantian hari (pukul 00:00). Setelah pesanan selesai dibuat, staf dapat menekan tombol "Selesai", yang akan mencatat stempel waktu penyelesaian pesanan (`completedAt`) ke dalam *database*.

## 7. Riwayat Transaksi dan Pelaporan Fleksibel
Semua pesanan yang telah berstatus selesai akan masuk ke dalam halaman Riwayat Penjualan. Halaman ini berfungsi sebagai buku besar digital yang mencatat seluruh aliran uang. Admin dapat dengan mudah memfilter laporan penjualan berdasarkan **Rentang Tanggal (Start Date & End Date)** atau berdasarkan **Metode Pembayaran** tertentu. Jika pelanggan meminta salinan bukti pembayaran lama, sistem juga menyediakan kapabilitas untuk melihat kembali detail nota dan melakukan **Cetak Struk Ulang**.

## 8. Keamanan Transaksi dan Anti-Kecurangan (Atomic Operations)
Dari segi arsitektur *backend*, aplikasi ini menerapkan tingkat keamanan yang sangat kokoh:
*   **Anti-Manipulasi Harga**: *Backend* tidak menggunakan nominal harga yang dikirim oleh aplikasi *browser* pengguna. Saat kasir melakukan proses bayar, *backend* akan menghitung ulang seluruh harga secara mandiri dengan mengambil data harga asli dari *database*. Ini menutup celah kecurangan modifikasi aplikasi dari sisi peretas.
*   **Transaksi Atomik (Prisma Transaction)**: Proses penyimpanan nota, pencatatan pembayaran, dan pengurangan stok (`decrement`) dieksekusi secara bersamaan (*atomic*). Hal ini menjamin 100% perlindungan dari isu *Race-Condition* (misalnya: *bug* di mana stok bisa menjadi minus apabila ada dua atau lebih kasir yang menekan tombol bayar di milidetik yang sama persis).
