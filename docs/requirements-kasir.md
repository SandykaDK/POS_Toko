# Requirement Menu Kasir

## Tujuan

Memproses penjualan produk dengan keranjang, diskon, dan pengurangan stok.

## Kebutuhan fungsional

- Sistem hanya menampilkan produk aktif.
- Pengguna dapat mencari berdasarkan nama atau kode produk.
- Pengguna dapat memfilter katalog berdasarkan kategori.
- Kartu produk menampilkan gambar/inisial, nama, kode, stok, harga, dan indikator stok.
- Indikator stok hijau jika stok di atas minimum dan merah jika sama dengan atau di bawah minimum.
- Pengguna dapat menambahkan produk ke keranjang.
- Produk yang sama menambah jumlah item.
- Pengguna dapat menaikkan atau menurunkan jumlah item.
- Item dihapus saat jumlah menjadi nol.
- Sistem menghitung subtotal, diskon, dan total akhir.
- Pengguna dapat memvalidasi kode diskon terhadap subtotal.
- Checkout menggunakan metode pembayaran tunai.
- Checkout membuat invoice, menyimpan transaksi, dan mengurangi stok.
- Keranjang dan diskon dikosongkan setelah checkout berhasil.
- Checkout tanpa item harus ditolak.
- Checkout melebihi stok harus ditolak dan stok tidak boleh negatif.
- Produk nonaktif tidak boleh digunakan walaupun request dimanipulasi.
- Setelah checkout gagal, keranjang tetap tersedia.

## Aturan bisnis

- Quantity harus integer minimal 1.
- Validasi stok dilakukan di backend dalam database transaction.
- Produk dikunci saat validasi stok untuk mencegah race condition.
- Quantity produk yang sama dijumlahkan sebelum dibandingkan dengan stok.
- Kegagalan checkout melakukan rollback transaksi, item, dan stok.

## Kriteria penerimaan

- Stok 5, pembelian 6: gagal dan stok tetap 5.
- Stok 5, pembelian 5: berhasil dan stok menjadi 0.
- Produk nonaktif tidak muncul dan tidak dapat dijual.
- Dua checkout bersamaan tidak boleh menghabiskan stok yang sama secara tidak konsisten.
