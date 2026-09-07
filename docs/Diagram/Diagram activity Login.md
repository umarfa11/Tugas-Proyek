# Activity Diagram: Login

```mermaid
flowchart TD
    subgraph Aktor [Kasir / Super Admin]
        direction TB
        Start(( ))
        B1[Buka Halaman Login]
        B2[Input Username & Password]
        B3[Klik Tombol Login]
        B4[Tampilkan Pesan error]
    end

    subgraph Sistem [Sistem]
        direction TB
        C1[Autentikasi]
        C2{Autentikasi Valid}
        C3[Generate Token JWT]
        C4[Redirect ke Dasboard]
        End((( )))
    end

    Start --> B1
    B1 --> B2
    B2 --> B3
    B3 --> C1
    C1 --> C2
    C2 -- Tidak --> B4
    B4 --> B2
    C2 -- Ya --> C3
    C3 --> C4
    C4 --> End
```

### Penjelasan:
1. **Aktor** (Kasir / Super Admin) membuka halaman login.
2. **Aktor** memasukkan *username* dan *password* lalu mengklik tombol login.
3. **Sistem** melakukan autentikasi dengan mencocokkan data yang dimasukkan dengan database.
4. Jika **Autentikasi Tidak Valid**, sistem akan menampilkan pesan error ke aktor, dan aktor harus memasukkan ulang kredensial.
5. Jika **Autentikasi Valid**, sistem akan men-generate token JWT (Json Web Token) sebagai tanda sesi yang valid.
6. **Sistem** akan me-redirect aktor ke halaman Dasboard dan proses login selesai.
