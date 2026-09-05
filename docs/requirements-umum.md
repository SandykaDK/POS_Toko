# Requirement Umum Menu TokoPOS

## Aturan umum

- Semua menu selain login hanya dapat diakses pengguna terautentikasi.
- Mutasi data menggunakan session Laravel same-origin dan CSRF.
- Data yang dihapus menggunakan soft delete jika tersedia.
- Pesan sukses dan gagal ditampilkan setelah operasi.
- Dialog konfirmasi digunakan sebelum penghapusan dan force delete.
- UI responsif untuk desktop dan mobile.
- Loading dan kondisi kosong ditampilkan dengan jelas.

## Aksi Keluar

- Pengguna dapat logout melalui sidebar.
- Sistem menghapus autentikasi server dan mengakhiri session.
- Sistem membuat token CSRF baru setelah session berakhir.
- Pengguna diarahkan ke login tanpa refresh browser.
- Login ulang dapat dilakukan langsung setelah logout.

## Kebutuhan non-fungsional

- Validasi frontend harus dilengkapi validasi backend.
- Transaksi dan pengurangan stok berjalan dalam database transaction.
- Pesan error tidak membocorkan data sensitif.
- Nilai uang menggunakan format Rupiah.
- UI mendukung keyboard untuk form, dialog, dan filter.
- API mengembalikan status 2xx saat berhasil dan 4xx saat input atau aturan bisnis ditolak.

## Referensi

- Requirement login: [requirements-login.md](requirements-login.md)
- Kontrak endpoint operasional tersedia pada dokumentasi API dan route aplikasi.
