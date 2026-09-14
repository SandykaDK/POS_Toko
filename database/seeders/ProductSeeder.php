<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $categoryCodes = [
            'Makanan' => 'MKN', 'Minuman' => 'MIN', 'Alat Tulis' => 'ATK', 'Bumbu' => 'BMB',
            'Sembako' => 'SBK', 'Obat' => 'OBT', 'Kebersihan Rumah' => 'KBR', 'Perawatan Pribadi' => 'PRB',
        ];
        $categoryMap = Category::query()->pluck('id', 'name');

        foreach ([
            ['name' => 'Produk Terhapus 1', 'code' => 'TRS-001', 'price' => 5000],
            ['name' => 'Produk Terhapus 2', 'code' => 'TRS-002', 'price' => 7500],
        ] as $data) {
            $product = Product::withTrashed()->updateOrCreate(
                ['product_code' => $data['code']],
                [
                    'category_id' => $categoryMap['Makanan'], 'name' => $data['name'], 'cost_price' => 3000,
                    'selling_price' => $data['price'], 'description' => 'Data produk untuk pengujian data terhapus',
                    'min_stock' => 5, 'stock' => 10, 'unit' => 'pcs', 'image' => null, 'is_active' => false,
                ]
            );
            if (!$product->trashed()) {
                $product->delete();
            }
        }

        $catalog = [
            ['Racik Bumbu Sayur Asem', 'Bumbu', 2000], ['Racik Bumbu Ayam Goreng', 'Bumbu', 2000], ['Adem Sari', 'Minuman', 3500],
            ['Sasa Tepung Pisang Goreng', 'Bumbu', 0], ['Santan Bubuk Tabura', 'Bumbu', 0], ['Sajiku Tepung Serbaguna', 'Bumbu', 0],
            ['Uleg Sambal Terasi', 'Bumbu', 0], ['Desaku Ketumbar Bubuk', 'Bumbu', 0], ['Desaku Kunyit Bubuk', 'Bumbu', 0],
            ['Saori Saus Tiram', 'Bumbu', 0], ['Kaldu Rasa Jamur', 'Bumbu', 0], ['Masako Rasa Sapi', 'Bumbu', 500],
            ['Blue Band Serbaguna 20g', 'Bumbu', 2000], ['Kecap Bango 25g', 'Bumbu', 1000], ['Sasa Tepung Bakwan Spesial', 'Bumbu', 0],
            ['MamaSuka Terasi Udang', 'Bumbu', 0], ['MamaSuka Bumbu Kuah Bakso', 'Bumbu', 0], ['Desaku Marinasi', 'Bumbu', 0],
            ['Ladaku Merica Bubuk', 'Bumbu', 1000], ['Royco Rasa Sapi', 'Bumbu', 0], ['Indofood Sambal Pedas', 'Bumbu', 0],
            ['Kapal Api Special Mix 23g', 'Minuman', 0], ['Kapal Api Special 6g', 'Minuman', 0], ['Torabika Tora Moka 28g', 'Minuman', 0],
            ['Kapal Api Special 30g', 'Minuman', 0], ['Good Day Cappuccino', 'Minuman', 0], ['Luwak White Coffee', 'Minuman', 0],
            ['Kopi Satu Satu Sachet', 'Minuman', 0], ['Madu TJ Sachet', 'Minuman', 0], ['Sari Wangi Teh Celup', 'Minuman', 1000],
            ['Indomilk Creamy Original 37g', 'Minuman', 0], ['Indomilk Cokelat 37g', 'Minuman', 0], ['Nestle Dancow 26g', 'Minuman', 0],
            ['Energen Kacang Hijau 32g', 'Minuman', 0], ['Energen Cokelat 35g', 'Minuman', 0], ['Nestle Milo 22g', 'Minuman', 0],
            ['Chocolatos Full Chocolatey 26g', 'Minuman', 0], ['Chocolatos Smooth Matcha 24g', 'Minuman', 0], ['Nutrisari Milky Orange 11g', 'Minuman', 0],
            ['Nutrisari Orange Tea 11g', 'Minuman', 0], ['Nutrisari American Sweet Orange 14g', 'Minuman', 0],
            ['Vanish Penghilang Noda 15g', 'Kebersihan Rumah', 0], ['Wipol Karbol Cemara', 'Kebersihan Rumah', 1000],
            ['Soffell Penolak Nyamuk', 'Perawatan Pribadi', 0], ['Lifebuoy Shampoo Anti Ketombe', 'Perawatan Pribadi', 0],
            ['Head & Shoulders Shampoo', 'Perawatan Pribadi', 0], ['Head & Shoulders Shampoo Lemon Segar', 'Perawatan Pribadi', 0],
            ['Head & Shoulders Shampoo Menthol Dingin', 'Perawatan Pribadi', 0], ['Rexona Deo-Lotion', 'Perawatan Pribadi', 0],
            ['Indomie Goreng 85g', 'Makanan', 3500], ['Indomie Goreng Jumbo 129g', 'Makanan', 5000], ['Mie Sedaap Soto 76g', 'Makanan', 3500],
            ['Mie Sedaap Kari Spesial', 'Makanan', 3500], ['Mie Sedaap Goreng 91g', 'Makanan', 3500],
            ['Indomie Hype Abis Mie Nyemek Jogja 84g', 'Makanan', 4000], ['Mie Sedaap Korean Spicy Chicken 87g', 'Makanan', 3500],
            ['Indomie Ayam Bawang 69g', 'Makanan', 3500], ['Sedaap Kecap Manis 20g', 'Bumbu', 0], ['Tabura Santan Bubuk 13g', 'Bumbu', 0],
            ['Nutrisari Sirsak 11g', 'Minuman', 0], ['Bodrexin Demam', 'Obat', 750], ['CTM Tablet', 'Obat', 0],
            ['Mixagrip Flu & Batuk', 'Obat', 0], ['Amoxicillin Trihydrate', 'Obat', 0], ['Koyo Cabe Chili Brand', 'Obat', 0],
            ['Demacolin', 'Obat', 0], ['Ultraflu PE', 'Obat', 0], ['Konidin Tablet Obat Batuk', 'Obat', 0],
            ['Bodrex Flu & Batuk PE', 'Obat', 0], ['Paramex Tablet Obat Sakit Kepala', 'Obat', 0], ['Entrostop Obat Diare', 'Obat', 0],
            ['Bodrex Paracetamol, Caffeine', 'Obat', 0], ['Bodrex Flu & Batuk Berdahak PE', 'Obat', 0],
            ['Neoreumacyl Ibuprofen, Paracetamol', 'Obat', 0], ['ABC Baterai AAA 1.5v', 'Obat', 5000],
            ["b'gain Envelope 95x152", 'Alat Tulis', 250], ['Hansaplast', 'Obat', 500], ['Joyko Correction Tape CT-522', 'Alat Tulis', 7000],
            ['Aqua 1,5L', 'Minuman', 0], ['Aqua 600ml', 'Minuman', 3000], ['Teh Pucuk Harum Original 350ml', 'Minuman', 0],
        ];
        $sequences = [];

        foreach ($catalog as [$name, $category, $sellingPrice]) {
            $sequences[$category] = ($sequences[$category] ?? 0) + 1;
            $product = Product::withTrashed()->updateOrCreate(
                ['name' => $name],
                [
                    'category_id' => $categoryMap[$category],
                    'product_code' => sprintf('%s-%03d', $categoryCodes[$category], $sequences[$category]),
                    'name' => $name,
                    'cost_price' => 0,
                    'selling_price' => $sellingPrice,
                    'description' => null,
                    'min_stock' => 5,
                    'stock' => 10,
                    'unit' => 'pcs',
                    'image' => null,
                    'is_active' => $sellingPrice > 0,
                ]
            );
            if ($product->trashed()) {
                $product->restore();
            }
        }
    }
}
