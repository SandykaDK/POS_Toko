# Requirement Menu Diskon

## Tujuan

Mengelola kode promosi dan menerapkannya pada transaksi Kasir.

## Kebutuhan fungsional

- Pengguna dapat melihat dan memfilter diskon aktif/nonaktif.
- Pengguna dapat melihat diskon terhapus pada tab Terhapus.
- Pengguna dapat menambah dan mengubah diskon.
- Form memuat kode, nama, deskripsi, tipe, nilai, diskon maksimal, minimum pembelian, maksimum penggunaan, tanggal mulai/berakhir, dan status aktif.
- Tipe hanya `percentage` atau `fixed`.
- Kode diskon harus unik.
- Nilai, diskon maksimal, dan minimum pembelian tidak boleh negatif.
- Maksimum penggunaan minimal 1 jika diisi.
- Tanggal berakhir tidak boleh lebih awal dari tanggal mulai.
- Pengguna dapat soft delete, restore, dan force delete diskon.
- Kasir dapat memvalidasi kode berdasarkan nominal pembelian.
- Kode ditolak jika tidak ditemukan, nonaktif, belum berlaku, kedaluwarsa, kuota habis, atau minimum pembelian belum tercapai.
- Diskon persentase dibatasi diskon maksimal.
- Sistem menampilkan nilai diskon dan total akhir.

## Kriteria penerimaan

- Diskon nonaktif atau kedaluwarsa tidak dapat digunakan.
- Diskon persentase tidak melebihi batas maksimal.
- Total akhir tidak boleh negatif.
