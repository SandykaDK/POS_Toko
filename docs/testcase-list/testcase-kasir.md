# Test Case Menu Kasir

Dokumen ini berisi testcase tambahan untuk menu Kasir. Testcase yang sudah tersedia di `e2e/Cashier.spec.js` adalah:

- Membuka halaman Kasir dan memvalidasi komponen awal.
- Mencari produk berdasarkan nama.
- Memfilter produk berdasarkan setiap kategori.

## Prioritas

- **P0**: Kritis, wajib dijalankan karena memengaruhi transaksi, pembayaran, atau stok.
- **P1**: Penting, mencakup validasi bisnis dan alur utama pengguna.
- **P2**: Pelengkap, mencakup UI, responsif, dan kondisi pendukung.

## 1. Keranjang Produk

| ID | Prioritas | Testcase | Langkah singkat | Ekspektasi |
|---|---|---|---|---|
| CASH-001 | P0 | Menambahkan satu produk | Klik satu kartu produk | Produk muncul di keranjang dengan quantity `1`; subtotal dan total sesuai harga |
| CASH-002 | P0 | Menambahkan produk yang sama dua kali | Klik kartu produk yang sama dua kali | Tetap satu baris produk; quantity menjadi `2` |
| CASH-003 | P1 | Menambahkan beberapa produk berbeda | Klik dua atau lebih produk berbeda | Semua produk tampil; subtotal adalah akumulasi seluruh item |
| CASH-004 | P1 | Menaikkan quantity | Klik tombol `+` pada item | Quantity dan subtotal bertambah |
| CASH-005 | P1 | Menurunkan quantity | Klik tombol `-` pada item | Quantity dan subtotal berkurang |
| CASH-006 | P1 | Menghapus item dari keranjang | Klik tombol `-` sampai quantity menjadi `0` | Item dihapus dari keranjang; tampilan kosong muncul jika tidak ada item lain |
| CASH-007 | P1 | Produk stok nol tidak tampil | Buka katalog dengan produk stok `0` | Produk stok `0` tidak tersedia untuk dipilih |
| CASH-008 | P0 | Produk nonaktif tidak dapat dijual | Pastikan produk nonaktif tidak tampil; coba manipulasi request checkout | Produk tidak tampil dan backend menolak transaksi produk nonaktif |
| CASH-009 | P2 | Indikator stok aman | Buka produk dengan stok di atas minimum | Indikator stok memiliki status aman |
| CASH-010 | P2 | Indikator stok menipis | Buka produk dengan stok sama atau di bawah minimum | Indikator stok memiliki class/status `low-stock` |
| CASH-011 | P2 | Gambar produk tampil | Buka produk yang memiliki gambar | Gambar tampil dengan `alt` berisi nama produk |
| CASH-012 | P2 | Produk tanpa gambar | Buka produk tanpa gambar | Inisial nama produk tampil pada thumbnail |

## 2. Pelanggan

| ID | Prioritas | Testcase | Langkah singkat | Ekspektasi |
|---|---|---|---|---|
| CASH-013 | P1 | Mencari pelanggan berdasarkan nama | Ketik nama pelanggan pada autocomplete | Pelanggan yang sesuai tampil |
| CASH-014 | P1 | Mencari pelanggan berdasarkan nomor telepon | Ketik nomor telepon pada autocomplete | Pelanggan yang sesuai tampil |
| CASH-015 | P1 | Memilih pelanggan | Pilih salah satu hasil pelanggan | Nama pelanggan terpilih tampil pada field |
| CASH-016 | P2 | Menghapus pelanggan terpilih | Klik tombol clear pada autocomplete | Field pelanggan kembali kosong |
| CASH-017 | P0 | Checkout tanpa pelanggan | Tambahkan produk lalu klik Checkout tanpa memilih pelanggan | Checkout ditolak dengan pesan `Silakan pilih pelanggan sebelum checkout.` |
| CASH-018 | P1 | Pelanggan nonaktif tidak tampil | Buka autocomplete pelanggan | Hanya pelanggan aktif yang tersedia |

## 3. Diskon

| ID | Prioritas | Testcase | Langkah singkat | Ekspektasi |
|---|---|---|---|---|
| CASH-019 | P1 | Klik Cek tanpa kode diskon | Biarkan kode kosong lalu klik `Cek` | Tidak ada diskon yang diterapkan |
| CASH-020 | P1 | Diskon persentase valid | Tambahkan produk dan masukkan kode persentase valid | Nominal diskon dan total berubah sesuai persentase |
| CASH-021 | P1 | Diskon nominal valid | Masukkan kode diskon nominal valid | Nominal diskon sesuai nilai tetap |
| CASH-022 | P1 | Diskon melebihi batas maksimum | Gunakan diskon persentase dengan `max_discount` | Diskon tidak melebihi batas maksimum |
| CASH-023 | P1 | Kode tidak ditemukan | Masukkan kode yang tidak terdaftar | Muncul pesan `Kode diskon tidak ditemukan` |
| CASH-024 | P1 | Kode tidak aktif | Masukkan kode diskon nonaktif | Muncul pesan bahwa kode sedang tidak aktif |
| CASH-025 | P1 | Kode belum berlaku | Masukkan kode dengan tanggal mulai di masa depan | Muncul pesan bahwa kode belum berlaku |
| CASH-026 | P1 | Kode kedaluwarsa | Masukkan kode dengan tanggal akhir yang sudah lewat | Muncul pesan bahwa kode sudah kedaluwarsa |
| CASH-027 | P1 | Minimum pembelian tidak terpenuhi | Gunakan kode dengan subtotal di bawah minimum | Muncul pesan minimal pembelian |
| CASH-028 | P1 | Batas penggunaan tercapai | Gunakan kode yang sudah mencapai `max_usage` | Diskon ditolak |
| CASH-029 | P1 | Subtotal berubah setelah diskon | Terapkan diskon lalu tambah atau kurangi item | Diskon dihapus; muncul pesan subtotal berubah |
| CASH-030 | P1 | Diskon membuat total nol | Gunakan diskon nominal yang lebih besar dari subtotal | Total akhir tidak negatif dan bernilai `Rp0` |

## 4. Checkout Cash

| ID | Prioritas | Testcase | Langkah singkat | Ekspektasi |
|---|---|---|---|---|
| CASH-031 | P0 | Checkout keranjang kosong | Klik Checkout tanpa item | Checkout ditolak dengan pesan `Keranjang masih kosong.` |
| CASH-032 | P0 | Pembayaran dengan uang pas | Tambahkan produk, pilih pelanggan, masukkan nominal sama dengan total | Transaksi berhasil; kembalian `Rp0` |
| CASH-033 | P0 | Pembayaran dengan uang lebih | Masukkan nominal lebih besar dari total | Transaksi berhasil; kembalian dihitung dengan benar |
| CASH-034 | P0 | Pembayaran kurang dari total | Masukkan nominal kurang dari total | Transaksi ditolak; keranjang tetap tersedia |
| CASH-035 | P1 | Nominal pembayaran kosong | Biarkan nominal kosong lalu simpan | Validasi pembayaran menolak transaksi |
| CASH-036 | P1 | Nominal pembayaran negatif | Masukkan nominal negatif | Validasi menolak pembayaran |
| CASH-037 | P1 | Menekan Enter untuk checkout | Masukkan nominal lalu tekan Enter | Checkout diproses sama seperti tombol simpan |
| CASH-038 | P1 | Membatalkan modal cash | Buka modal cash lalu klik `Batal` | Modal tertutup; keranjang tetap tersedia |
| CASH-039 | P2 | Menutup modal dengan klik area luar | Klik area overlay di luar modal | Modal tertutup |
| CASH-040 | P0 | Reset state setelah checkout berhasil | Selesaikan checkout cash | Keranjang, kode diskon, pelanggan, metode, dan nominal cash di-reset |
| CASH-041 | P0 | API checkout gagal | Simulasikan respons error dari API transaksi | Pesan error tampil; keranjang tetap tersedia |

## 5. Stok dan Penyimpanan Transaksi

| ID | Prioritas | Testcase | Langkah singkat | Ekspektasi |
|---|---|---|---|---|
| CASH-042 | P0 | Membeli kurang dari stok | Checkout quantity di bawah stok tersedia | Transaksi berhasil; stok berkurang sesuai quantity |
| CASH-043 | P0 | Membeli tepat sejumlah stok | Checkout quantity sama dengan stok tersedia | Transaksi berhasil; stok menjadi `0` |
| CASH-044 | P0 | Membeli melebihi stok | Checkout quantity lebih besar dari stok | Transaksi ditolak; stok tidak berubah dan tidak negatif |
| CASH-045 | P0 | Item sama melebihi stok setelah dijumlahkan | Tambahkan produk sama beberapa kali hingga melebihi stok | Backend menjumlahkan quantity lalu menolak transaksi |
| CASH-046 | P0 | Rollback jika salah satu item gagal | Checkout beberapa produk, salah satunya stok kurang | Seluruh transaksi rollback; stok semua produk tetap |
| CASH-047 | P0 | Invoice tersimpan | Selesaikan checkout cash | Invoice dibuat dan dapat ditemukan di menu Transaksi |
| CASH-048 | P1 | Detail transaksi tersimpan | Buka detail transaksi yang baru dibuat | Produk, quantity, harga, subtotal, pelanggan, dan metode sesuai |
| CASH-049 | P1 | Statistik pelanggan diperbarui | Checkout dengan pelanggan terpilih | `purchase_count` pelanggan bertambah |
| CASH-050 | P1 | Total pembelian pelanggan diperbarui | Checkout dengan pelanggan terpilih | `total_purchases` bertambah sesuai total transaksi |
| CASH-051 | P0 | Dua checkout bersamaan | Jalankan dua transaksi pada stok yang sama secara paralel | Stok tidak terjual melebihi persediaan; salah satu transaksi ditolak bila stok tidak cukup |

## 6. Pembayaran QRIS

Gunakan mock response Midtrans agar test tidak bergantung pada layanan eksternal.

| ID | Prioritas | Testcase | Langkah singkat | Ekspektasi |
|---|---|---|---|---|
| CASH-052 | P0 | Memilih metode QRIS | Buka select metode pembayaran lalu pilih QRIS | QRIS terpilih |
| CASH-053 | P0 | Checkout QRIS berhasil | Tambahkan produk, pilih pelanggan, lalu checkout QRIS | Modal QRIS tampil dengan invoice dan nominal |
| CASH-054 | P1 | QR code tampil | Periksa modal QRIS | Gambar QR memiliki source dan `alt` yang benar |
| CASH-055 | P1 | Menutup modal QRIS | Klik `Tutup` | Modal QRIS tertutup |
| CASH-056 | P0 | Status transaksi QRIS pending | Selesaikan checkout QRIS | Transaksi dan payment berstatus `pending` |
| CASH-057 | P0 | Provider QRIS gagal | Simulasikan kegagalan Midtrans | Error tampil; keranjang tetap tersedia |
| CASH-058 | P0 | Konfirmasi pembayaran QRIS | Konfirmasi payment melalui endpoint callback/confirm | Status transaksi berubah menjadi completed dan stok berkurang sesuai aturan |

## 7. Loading, Error, dan Responsif

| ID | Prioritas | Testcase | Langkah singkat | Ekspektasi |
|---|---|---|---|---|
| CASH-059 | P2 | Loading katalog | Perlambat response API produk | Teks `Memuat produk...` tampil selama loading |
| CASH-060 | P1 | API katalog gagal | Simulasikan kegagalan API produk/kategori/pelanggan | Pesan error tampil kepada pengguna |
| CASH-061 | P2 | Hasil pencarian kosong | Cari produk yang tidak ada | Tidak ada kartu produk yang tampil dan halaman tidak error |
| CASH-062 | P2 | Pencarian berdasarkan kode produk | Ketik `product_code` pada pencarian | Produk yang memiliki kode tersebut tampil |
| CASH-063 | P2 | Tampilan mobile | Jalankan pada viewport mobile | Katalog, keranjang, modal, dan kontrol checkout tetap dapat digunakan |
| CASH-064 | P2 | Tab kategori melebihi lebar layar | Gunakan banyak kategori pada viewport kecil | Tab kategori dapat di-scroll tanpa merusak layout |

## Prioritas Implementasi Test Otomatis

Urutan yang disarankan untuk dibuat terlebih dahulu:

1. `CASH-001` sampai `CASH-006` untuk alur keranjang.
2. `CASH-017`, `CASH-019` sampai `CASH-030` untuk validasi pelanggan dan diskon.
3. `CASH-031` sampai `CASH-041` untuk checkout cash.
4. `CASH-042` sampai `CASH-046` untuk validasi stok dan rollback.
5. `CASH-052` sampai `CASH-058` untuk QRIS dengan mock provider.
6. `CASH-047` sampai `CASH-051` untuk verifikasi persistence dan concurrency.
7. `CASH-059` sampai `CASH-064` untuk kondisi UI dan responsif.

## Catatan Data Test

- Gunakan fixture atau API setup agar produk, pelanggan, dan diskon dapat dibuat dengan kondisi yang terkontrol.
- Untuk test stok, simpan stok awal lalu verifikasi nilainya kembali setelah transaksi gagal.
- Untuk test checkout, gunakan pelanggan aktif agar validasi pelanggan tidak menghalangi skenario utama.
- Bersihkan transaksi, produk, pelanggan, dan diskon yang dibuat setelah test selesai.
- Untuk concurrency dan QRIS, gunakan test integrasi/backend atau mock service agar hasil deterministik.
