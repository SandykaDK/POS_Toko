# Requirement Menu Kategori

## Tujuan

Mengelola pengelompokan produk.

## Kebutuhan fungsional

- Pengguna dapat melihat kategori dan memfilter status aktif/nonaktif.
- Pengguna dapat melihat kategori terhapus pada tab Terhapus.
- Pengguna dapat menambah dan mengubah kategori.
- Form memuat nama, kode kategori, slug, deskripsi, dan status aktif.
- Slug dibuat berdasarkan nama kategori.
- Kode kategori harus tepat 3 huruf besar dan unik.
- Slug harus unik.
- Pengguna dapat soft delete, restore, dan force delete kategori.
- Kategori yang masih memiliki produk tidak dapat dihapus atau dihapus permanen.

## Kriteria penerimaan

- Kode selain 3 huruf besar ditolak.
- Slug otomatis mengikuti nama saat membuat kategori.
- Kategori yang memiliki produk menampilkan alasan penolakan saat dihapus.
