# Requirement Menu Produk

## Tujuan

Mengelola katalog, harga, stok, status, dan informasi produk.

## Kebutuhan fungsional

- Pengguna dapat melihat produk aktif dan nonaktif.
- Pengguna dapat memfilter berdasarkan status dan kategori.
- Pengguna dapat melihat produk terhapus pada tab Terhapus.
- Pengguna dapat menambah dan mengubah produk.
- Form memuat nama, kode, kategori, harga beli, harga jual, stok, stok minimum, unit, gambar, deskripsi, dan status aktif.
- Sistem dapat membuat kode berdasarkan kode kategori dan urutan produk.
- Kode produk harus unik dan kategori wajib valid.
- Harga dan stok tidak boleh negatif; stok minimum minimal 1.
- Gambar menerima JPG, JPEG, PNG, atau WEBP maksimal 2 MB.
- Pengguna dapat soft delete, restore, dan force delete produk.
- Produk yang memiliki transaksi tidak dapat dihapus.
- Sistem menampilkan pesan sukses atau error setiap operasi.

## Kriteria penerimaan

- Produk aktif tampil di Kasir, produk nonaktif tidak tampil.
- Produk dengan transaksi ditolak saat dihapus.
- Stok yang disimpan tidak boleh negatif.
