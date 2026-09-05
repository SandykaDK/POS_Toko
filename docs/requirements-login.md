# Requirement Fitur Login

## Tujuan

Membatasi akses aplikasi TokoPOS hanya untuk pengguna yang memiliki akun staf terdaftar.

## Kebutuhan fungsional

- Pengguna dapat masuk dengan email dan password.
- Sistem memvalidasi format email, password wajib diisi, dan menampilkan pesan error yang jelas saat kredensial salah.
- Pengguna dapat memilih "Ingat saya" untuk memperpanjang sesi sesuai mekanisme session Laravel.
- Sesi pengguna dipulihkan saat halaman dimuat ulang selama sesi masih valid.
- Pengguna dapat keluar dari aplikasi; sesi server dihapus dan pengguna diarahkan kembali ke halaman login.
- Semua endpoint operasional selain endpoint login wajib membutuhkan autentikasi.
- Pengguna yang belum login tidak dapat membuka halaman dashboard, kasir, master data, atau riwayat transaksi.

## Kontrak API

| Method | Endpoint | Auth | Keterangan |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | CSRF | Login dengan `email`, `password`, dan optional `remember` |
| GET | `/api/auth/me` | Session | Mengembalikan data pengguna aktif |
| POST | `/api/auth/logout` | Session + CSRF | Mengakhiri sesi aktif |

Response login sukses mengembalikan `message` dan `user`. Login gagal mengembalikan HTTP 422 dengan `message` yang aman dan tidak membocorkan apakah email atau password yang salah. Validasi request mengembalikan HTTP 422.

## Kebutuhan non-fungsional

- Password tidak pernah dikirim kembali ke frontend dan tetap di-hash oleh model User.
- Login dibatasi maksimal 5 percobaan per menit per route untuk mengurangi brute force.
- API memakai session Laravel same-origin dan perlindungan CSRF untuk operasi mutasi.
- Tampilan login responsif untuk desktop dan mobile serta dapat digunakan dengan keyboard.

## Akun demo

Seeder demo menyediakan `admin@gmail.com` dengan password `123` untuk pengujian lokal.
