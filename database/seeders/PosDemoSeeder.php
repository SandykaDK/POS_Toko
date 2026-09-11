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

        $deletedCategories = [
        [
            'name' => 'Kategori Terhapus 1',
            'category_code' => 'TRS',
            'slug' => 'kategori-terhapus-1',
        ],
        [
            'name' => 'Kategori Terhapus 2',
            'category_code' => 'TR2',
            'slug' => 'kategori-terhapus-2',
        ],
    ];

        $deletedCustomers = [
            [
                'email' => 'pelanggan-terhapus-1@tokopos.test',
                'name' => 'Pelanggan Terhapus 1',
                'phone' => '081199990001',
            ],
            [
                'email' => 'pelanggan-terhapus-2@tokopos.test',
                'name' => 'Pelanggan Terhapus 2',
                'phone' => '081199990002',
            ],
        ];

        $deletedProducts = [
            [
                'name' => 'Produk Terhapus 1',
                'product_code' => 'TRS-001',
                'selling_price' => 5000,
            ],
            [
                'name' => 'Produk Terhapus 2',
                'product_code' => 'TRS-002',
                'selling_price' => 7500,
            ],
        ];

        $deletedDiscounts = [
            [
                'code' => 'TRASH10',
                'name' => 'Diskon Terhapus 1',
            ],
            [
                'code' => 'TRASH20',
                'name' => 'Diskon Terhapus 2',
            ],
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

        foreach ($deletedCategories as $data) {
            $category = Category::withTrashed()->updateOrCreate(
                ['slug' => $data['slug']],
                [
                    'name' => $data['name'],
                    'category_code' => $data['category_code'],
                    'description' => 'Kategori untuk pengujian data terhapus',
                    'is_active' => false,
                ]
            );

            if (!$category->trashed()) {
                $category->delete();
            }
        }

        foreach ($deletedCustomers as $data) {
            $customer = Customer::withTrashed()->updateOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'phone' => $data['phone'],
                    'address' => 'Data pelanggan untuk pengujian data terhapus',
                    'total_purchases' => 0,
                    'purchase_count' => 0,
                    'status' => 'inactive',
                ]
            );

            if (!$customer->trashed()) {
                $customer->delete();
            }
        }

        foreach ($deletedProducts as $data) {
            $product = Product::withTrashed()->updateOrCreate(
                ['product_code' => $data['product_code']],
                [
                    'category_id' => $categoryMap['Makanan'],
                    'name' => $data['name'],
                    'cost_price' => 3000,
                    'selling_price' => $data['selling_price'],
                    'description' => 'Data produk untuk pengujian data terhapus',
                    'min_stock' => 5,
                    'stock' => 10,
                    'unit' => 'pcs',
                    'image' => null,
                    'is_active' => false,
                ]
            );

            if (!$product->trashed()) {
                $product->delete();
            }
        }

        foreach ($deletedDiscounts as $data) {
            $discount = Discount::withTrashed()->updateOrCreate(
                ['code' => $data['code']],
                [
                    'name' => $data['name'],
                    'description' => 'Data diskon untuk pengujian data terhapus',
                    'type' => 'percentage',
                    'value' => 10,
                    'max_discount' => 10000,
                    'min_purchase' => 25000,
                    'max_usage' => 10,
                    'usage_count' => 0,
                    'start_date' => now()->subMonth(),
                    'end_date' => now()->subDay(),
                    'is_active' => false,
                ]
            );

            if (!$discount->trashed()) {
                $discount->delete();
            }
        }

        $customers = [
            [
                'email' => 'pelanggan@tokopos.test',
                'name' => 'Pelanggan Umum',
                'phone' => '081122334455',
                'address' => 'Jl. Raya No. 1',
                'status' => 'active',
            ],
            [
                'email' => 'andi@tokopos.test',
                'name' => 'Andi Saputra',
                'phone' => '081122334456',
                'address' => 'Jl. Melati No. 2',
                'status' => 'active',
            ],
            [
                'email' => 'budi@tokopos.test',
                'name' => 'Budi Santoso',
                'phone' => '081122334457',
                'address' => 'Jl. Kenanga No. 8',
                'status' => 'active',
            ],
            [
                'email' => 'citra@tokopos.test',
                'name' => 'Citra Lestari',
                'phone' => '081122334458',
                'address' => 'Jl. Mawar No. 14',
                'status' => 'active',
            ],
            [
                'email' => 'dedi@tokopos.test',
                'name' => 'Dedi Kurniawan',
                'phone' => '081122334459',
                'address' => 'Jl. Anggrek No. 6',
                'status' => 'active',
            ],
            [
                'email' => 'eka@tokopos.test',
                'name' => 'Eka Wulandari',
                'phone' => '081122334460',
                'address' => 'Jl. Flamboyan No. 3',
                'status' => 'inactive',
            ],
            [
                'email' => 'fajar@tokopos.test',
                'name' => 'Fajar Hidayat',
                'phone' => '081122334461',
                'address' => 'Jl. Teratai No. 11',
                'status' => 'inactive',
            ],
            [
                'email' => 'gita@tokopos.test',
                'name' => 'Gita Permata',
                'phone' => '081122334462',
                'address' => 'Jl. Dahlia No. 5',
                'status' => 'inactive',
            ],
        ];

        foreach ($customers as $data) {
            Customer::withTrashed()->updateOrCreate(
                ['email' => $data['email']],
                array_merge($data, [
                    'total_purchases' => 0,
                    'purchase_count' => 0,
                ])
            );
        }

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
