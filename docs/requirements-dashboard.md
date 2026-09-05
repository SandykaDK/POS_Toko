# Requirement Menu Dashboard

## Tujuan

Memberikan ringkasan kondisi penjualan dan operasional toko secara cepat.

## Kebutuhan fungsional

- Sistem menampilkan omzet hari ini.
- Sistem menampilkan jumlah transaksi selesai hari ini.
- Sistem menampilkan rata-rata nilai transaksi hari ini.
- Sistem menampilkan jumlah produk aktif.
- Sistem menampilkan jumlah produk dengan stok rendah.
- Sistem menampilkan grafik omzet dan jumlah transaksi untuk 7 hari terakhir.
- Sistem menampilkan maksimal 5 produk terlaris dalam 30 hari terakhir.
- Sistem menampilkan produk dengan `stock <= min_stock`.
- Sistem menampilkan maksimal 6 transaksi terbaru berstatus `completed`.
- Pengguna dapat menuju Produk dari daftar stok rendah.
- Pengguna dapat menuju Produk dan Riwayat Transaksi dari panel terkait.
- Dashboard memperbarui data saat halaman terlihat dan setiap 30 detik.
- Sistem menampilkan error jika data gagal dimuat.

## Kriteria penerimaan

- Angka dashboard hanya menghitung transaksi `completed`.
- Produk nonaktif tidak dihitung sebagai produk aktif.
- Produk dengan `stock <= min_stock` masuk daftar perhatian.
- Saat belum ada data, sistem menampilkan kondisi kosong yang informatif.
