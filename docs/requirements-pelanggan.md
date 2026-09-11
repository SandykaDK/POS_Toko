# Requirement Menu Pelanggan

## Tujuan

Mengelola data pelanggan dan status loyalitas pelanggan.

## Kebutuhan fungsional

- Pengguna dapat melihat pelanggan yang diurutkan berdasarkan total pembelian terbesar.
- Pengguna dapat memfilter status Aktif, Nonaktif, atau VIP.
- Pengguna dapat melihat pelanggan terhapus pada tab Terhapus.
- Pengguna dapat menambah dan mengubah pelanggan.
- Form memuat nama, email, telepon, alamat, dan status.
- Email boleh kosong; jika diisi harus valid dan unik.
- Status hanya `active`atau `inactive`.
- Pengguna dapat soft delete, restore, dan force delete pelanggan.
- Pelanggan yang memiliki transaksi tidak dapat dihapus permanen.
- Sistem menampilkan total pembelian dan jumlah transaksi jika tersedia.

## Kriteria penerimaan

- Filter status hanya menampilkan status yang dipilih.
- Email duplikat ditolak.
- Data total pembelian dan jumlah transaksi tetap tersimpan saat pelanggan diubah.
