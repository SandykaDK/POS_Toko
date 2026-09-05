# Requirement Menu TokoPOS

Dokumentasi requirement dipisahkan per menu agar lebih mudah dibaca dan dipelihara.

## Referensi Requirement

- [Requirement Umum dan Logout](requirements-umum.md)
- [Requirement Dashboard](requirements-dashboard.md)
- [Requirement Kasir](requirements-kasir.md)
- [Requirement Produk](requirements-produk.md)
- [Requirement Kategori](requirements-kategori.md)
- [Requirement Pelanggan](requirements-pelanggan.md)
- [Requirement Diskon](requirements-diskon.md)
- [Requirement Riwayat Transaksi](requirements-transaksi.md)
- [Requirement Login](requirements-login.md)

## Daftar Menu

| Menu | Route | Dokumen |
| --- | --- | --- |
| Dashboard | `/` | [requirements-dashboard.md](requirements-dashboard.md) |
| Kasir | `/cashier` | [requirements-kasir.md](requirements-kasir.md) |
| Produk | `/products` | [requirements-produk.md](requirements-produk.md) |
| Kategori | `/categories` | [requirements-kategori.md](requirements-kategori.md) |
| Pelanggan | `/customers` | [requirements-pelanggan.md](requirements-pelanggan.md) |
| Diskon | `/discounts` | [requirements-diskon.md](requirements-diskon.md) |
| Riwayat Transaksi | `/transactions` | [requirements-transaksi.md](requirements-transaksi.md) |
| Login | - | [requirements-login.md](requirements-login.md) |

## Catatan

Kontrak endpoint API tetap mengikuti route Laravel pada `routes/api.php`. Requirement bisnis yang berlaku lintas menu berada di [requirements-umum.md](requirements-umum.md).
