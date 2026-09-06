<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Customer;
use App\Models\Discount;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;

class PosDemoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $user = User::firstOrCreate(
            ['email' => 'admin@gmail.com'],
            [
                'name' => 'Admin Toko',
                'password' => bcrypt('123'),
            ]
        );

        $categoryNames = [
            'Makanan',
            'Minuman',
            'Alat Tulis',
            'Bumbu',
            'Sembako',
            'Obat',
            'Kebersihan Rumah',
            'Perawatan Pribadi',
            'Tes Kategori'];
        $categoryCodes = [
            'Makanan' => 'MKN',
            'Minuman' => 'MIN',
            'Alat Tulis' => 'ATK',
            'Bumbu' => 'BMB',
            'Sembako' => 'SBK',
            'Obat' => 'OBT',
            'Kebersihan Rumah' => 'KBR',
            'Perawatan Pribadi' => 'PRB',
            'Tes Kategori' => 'TES'
        ];
        $categoryMap = [];

        foreach ($categoryNames as $name) {
            $category = Category::firstOrCreate(
                ['slug' => str($name)->slug()->value()],
                [
                    'name' => $name,
                    'category_code' => $categoryCodes[$name],
                    'description' => 'Kategori ' . $name,
                    'is_active' => $name !== 'Tes Kategori',
                ]
            );

            $categoryMap[$name] = $category->id;
        }

        Customer::firstOrCreate(
            ['email' => 'pelanggan@tokopos.test'],
            [
                'name' => 'Pelanggan Umum',
                'phone' => '081122334455',
                'address' => 'Jl. Raya No. 1',
                'total_purchases' => 0,
                'purchase_count' => 0,
                'status' => 'active',
            ]
        );

        $catalogProducts = [
            ['name' => 'Racik Bumbu Sayur Asem', 'category' => 'Bumbu', 'selling_price' => 2000],
            ['name' => 'Racik Bumbu Ayam Goreng', 'category' => 'Bumbu', 'selling_price' => 2000],
            ['name' => 'Adem Sari', 'category' => 'Minuman', 'selling_price' => 3500],
            ['name' => 'Sasa Tepung Pisang Goreng', 'category' => 'Bumbu', 'selling_price' => 0],
            ['name' => 'Santan Bubuk Tabura', 'category' => 'Bumbu', 'selling_price' => 0],
            ['name' => 'Sajiku Tepung Serbaguna', 'category' => 'Bumbu', 'selling_price' => 0],
            ['name' => 'Uleg Sambal Terasi', 'category' => 'Bumbu', 'selling_price' => 0],
            ['name' => 'Desaku Ketumbar Bubuk', 'category' => 'Bumbu', 'selling_price' => 0],
            ['name' => 'Desaku Kunyit Bubuk', 'category' => 'Bumbu', 'selling_price' => 0],
            ['name' => 'Saori Saus Tiram', 'category' => 'Bumbu', 'selling_price' => 0],
            ['name' => 'Kaldu Rasa Jamur', 'category' => 'Bumbu', 'selling_price' => 0],
            ['name' => 'Masako Rasa Sapi', 'category' => 'Bumbu', 'selling_price' => 500],
            ['name' => 'Blue Band Serbaguna 20g', 'category' => 'Bumbu', 'selling_price' => 2000],
            ['name' => 'Kecap Bango 25g', 'category' => 'Bumbu', 'selling_price' => 1000],
            ['name' => 'Sasa Tepung Bakwan Spesial', 'category' => 'Bumbu', 'selling_price' => 0],
            ['name' => 'MamaSuka Terasi Udang', 'category' => 'Bumbu', 'selling_price' => 0],
            ['name' => 'MamaSuka Bumbu Kuah Bakso', 'category' => 'Bumbu', 'selling_price' => 0],
            ['name' => 'Desaku Marinasi', 'category' => 'Bumbu', 'selling_price' => 0],
            ['name' => 'Ladaku Merica Bubuk', 'category' => 'Bumbu', 'selling_price' => 1000],
            ['name' => 'Royco Rasa Sapi', 'category' => 'Bumbu', 'selling_price' => 0],
            ['name' => 'Indofood Sambal Pedas', 'category' => 'Bumbu', 'selling_price' => 0],
            ['name' => 'Kapal Api Special Mix 23g', 'category' => 'Minuman','selling_price' => 0],
            ['name' => 'Kapal Api Special 6g', 'category' => 'Minuman','selling_price' => 0],
            ['name' => 'Torabika Tora Moka 28g', 'category' => 'Minuman', 'selling_price' => 0],
            ['name' => 'Kapal Api Special 30g', 'category' => 'Minuman', 'selling_price' => 0],
            ['name' => 'Good Day Cappuccino', 'category' => 'Minuman', 'selling_price' => 0],
            ['name' => 'Luwak White Coffee', 'category' => 'Minuman', 'selling_price' => 0],
            ['name' => 'Kopi Satu Satu Sachet', 'category' => 'Minuman', 'selling_price' => 0],
            ['name' => 'Madu TJ Sachet', 'category' => 'Minuman', 'selling_price' => 0],
            ['name' => 'Sari Wangi Teh Celup', 'category' => 'Minuman', 'selling_price' => 1000],
            ['name' => 'Indomilk Creamy Original 37g', 'category' => 'Minuman', 'selling_price' => 0],
            ['name' => 'Indomilk Cokelat 37g', 'category' => 'Minuman', 'selling_price' => 0],
            ['name' => 'Nestle Dancow 26g', 'category' => 'Minuman', 'selling_price' => 0],
            ['name' => 'Energen Kacang Hijau 32g', 'category' => 'Minuman', 'selling_price' => 0],
            ['name' => 'Energen Cokelat 35g', 'category' => 'Minuman', 'selling_price' => 0],
            ['name' => 'Nestle Milo 22g', 'category' => 'Minuman', 'selling_price' => 0],
            ['name' => 'Chocolatos Full Chocolatey 26g', 'category' => 'Minuman', 'selling_price' => 0],
            ['name' => 'Chocolatos Smooth Matcha 24g', 'category' => 'Minuman', 'selling_price' => 0],
            ['name' => 'Nutrisari Milky Orange 11g', 'category' => 'Minuman', 'selling_price' => 0],
            ['name' => 'Nutrisari Orange Tea 11g', 'category' => 'Minuman', 'selling_price' => 0],
            ['name' => 'Nutrisari American Sweet Orange 14g', 'category' => 'Minuman', 'selling_price' => 0],
            ['name' => 'Vanish Penghilang Noda 15g', 'category' => 'Kebersihan Rumah', 'selling_price' => 0],
            ['name' => 'Wipol Karbol Cemara', 'category' => 'Kebersihan Rumah', 'selling_price' => 1000],
            ['name' => 'Soffell Penolak Nyamuk', 'category' => 'Perawatan Pribadi', 'selling_price' => 0],
            ['name' => 'Lifebuoy Shampoo Anti Ketombe', 'category' => 'Perawatan Pribadi', 'selling_price' => 0],
            ['name' => 'Head & Shoulders Shampoo', 'category' => 'Perawatan Pribadi', 'selling_price' => 0],
            ['name' => 'Head & Shoulders Shampoo Lemon Segar', 'category' => 'Perawatan Pribadi', 'selling_price' => 0],
            ['name' => 'Head & Shoulders Shampoo Menthol Dingin', 'category' => 'Perawatan Pribadi', 'selling_price' => 0],
            ['name' => 'Rexona Deo-Lotion', 'category' => 'Perawatan Pribadi', 'selling_price' => 0],
            ['name' => 'Indomie Goreng 85g', 'category' => 'Makanan', 'selling_price' => 3500],
            ['name' => 'Indomie Goreng Jumbo 129g', 'category' => 'Makanan', 'selling_price' => 5000],
            ['name' => 'Mie Sedaap Soto 76g', 'category' => 'Makanan', 'selling_price' => 3500],
            ['name' => 'Mie Sedaap Kari Spesial', 'category' => 'Makanan', 'selling_price' => 3500],
            ['name' => 'Mie Sedaap Goreng 91g', 'category' => 'Makanan', 'selling_price' => 3500],
            ['name' => 'Indomie Hype Abis Mie Nyemek Jogja 84g', 'category' => 'Makanan', 'selling_price' => 4000],
            ['name' => 'Mie Sedaap Korean Spicy Chicken 87g', 'category' => 'Makanan', 'selling_price' => 3500],
            ['name' => 'Indomie Ayam Bawang 69g', 'category' => 'Makanan', 'selling_price' => 3500],
            ['name' => 'Sedaap Kecap Manis 20g', 'category' => 'Bumbu', 'selling_price' => 0],
            ['name' => 'Tabura Santan Bubuk 13g', 'category' => 'Bumbu', 'selling_price' => 0],
            ['name' => 'Nutrisari Sirsak 11g', 'category' => 'Minuman', 'selling_price' => 0],
            ['name' => 'Bodrexin Demam', 'category' => 'Obat', 'selling_price' => 750],
            ['name' => 'CTM Tablet', 'category' => 'Obat', 'selling_price' => 0],
            ['name' => 'Mixagrip Flu & Batuk', 'category' => 'Obat', 'selling_price' => 0],
            ['name' => 'Amoxicillin Trihydrate', 'category' => 'Obat', 'selling_price' => 0],
            ['name' => 'Koyo Cabe Chili Brand', 'category' => 'Obat', 'selling_price' => 0],
            ['name' => 'Demacolin', 'category' => 'Obat', 'selling_price' => 0],
            ['name' => 'Ultraflu PE', 'category' => 'Obat', 'selling_price' => 0],
            ['name' => 'Konidin Tablet Obat Batuk', 'category' => 'Obat', 'selling_price' => 0],
            ['name' => 'Bodrex Flu & Batuk PE', 'category' => 'Obat', 'selling_price' => 0],
            ['name' => 'Paramex Tablet Obat Sakit Kepala', 'category' => 'Obat', 'selling_price' => 0],
            ['name' => 'Entrostop Obat Diare', 'category' => 'Obat', 'selling_price' => 0],
            ['name' => 'Bodrex Paracetamol, Caffeine', 'category' => 'Obat', 'selling_price' => 0],
            ['name' => 'Bodrex Flu & Batuk Berdahak PE', 'category' => 'Obat', 'selling_price' => 0],
            ['name' => 'Neoreumacyl Ibuprofen, Paracetamol', 'category' => 'Obat', 'selling_price' => 0],
            ['name' => 'ABC Baterai AAA 1.5v', 'category' => 'Obat', 'selling_price' => 5000],
            ['name' => "b'gain Envelope 95x152", 'category' => 'Alat Tulis', 'selling_price' => 250],
            ['name' => 'Hansaplast', 'category' => 'Obat', 'selling_price' => 500],
            ['name' => 'Joyko Correction Tape CT-522', 'category' => 'Alat Tulis', 'selling_price' => 7000],
            ['name' => 'Aqua 1,5L', 'category' => 'Minuman', 'selling_price' => 0],
            ['name' => 'Aqua 600ml', 'category' => 'Minuman', 'selling_price' => 3000],
            ['name' => 'Teh Pucuk Harum Original 350ml', 'category' => 'Minuman', 'selling_price' => 0],
        ];

        $categoryProductSequences = [];

        foreach ($catalogProducts as $product) {
            $categoryName = $product['category'] ?? 'Sembako';
            $categoryProductSequences[$categoryName] = ($categoryProductSequences[$categoryName] ?? 0) + 1;
            $productCode = sprintf(
                '%s-%03d',
                $categoryCodes[$categoryName],
                $categoryProductSequences[$categoryName]
            );
            $costPrice = $product['cost_price'] ?? 0;

            Product::updateOrCreate(
                ['name' => $product['name']],
                [
                    'category_id' => $categoryMap[$categoryName],
                    'product_code' => $productCode,
                    'name' => $product['name'],
                    'cost_price' => $costPrice,
                    'selling_price' => $product['selling_price'],
                    'description' => null,
                    'min_stock' => 5,
                    'stock' => 10,
                    'unit' => 'pcs',
                    'image' => null,
                    'is_active' => $costPrice > 0 || $product['selling_price'] > 0,
                ]
            );
        }

        Discount::firstOrCreate(
            ['code' => 'SAVE10'],
            [
                'name' => 'Diskon Awal Bulan',
                'description' => 'Diskon 10% untuk pembelian di atas Rp50.000',
                'type' => 'percentage',
                'value' => 10,
                'max_discount' => 25000,
                'min_purchase' => 50000,
                'max_usage' => 100,
                'usage_count' => 0,
                'start_date' => now()->subDay(),
                'end_date' => now()->addMonth(),
                'is_active' => true,
            ]
        );
    }
}
