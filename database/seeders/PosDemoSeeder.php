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

        $categoryNames = ['Makanan', 'Minuman', 'Snack', 'Peralatan', 'Sembako'];
        $categoryCodes = ['Makanan' => 'MKN', 'Minuman' => 'MIN', 'Snack' => 'SNK', 'Peralatan' => 'PRL', 'Sembako' => 'SBK'];
        $categoryMap = [];

        foreach ($categoryNames as $name) {
            $category = Category::firstOrCreate(
                ['slug' => str($name)->slug()->value()],
                [
                    'name' => $name,
                    'category_code' => $categoryCodes[$name],
                    'description' => 'Kategori ' . $name,
                    'is_active' => true,
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

        $seedProducts = [
            ['product_code' => 'MKN-001', 'name' => 'Kopi Hitam', 'category' => 'Minuman', 'selling_price' => 12000, 'cost_price' => 8000, 'stock' => 45, 'min_stock' => 10, 'unit' => 'pcs'],
            ['product_code' => 'MKN-002', 'name' => 'Teh Botol', 'category' => 'Minuman', 'selling_price' => 9000, 'cost_price' => 6000, 'stock' => 30, 'min_stock' => 8, 'unit' => 'pcs'],
            ['product_code' => 'MKN-003', 'name' => 'Nasi Goreng', 'category' => 'Makanan', 'selling_price' => 18000, 'cost_price' => 12000, 'stock' => 20, 'min_stock' => 5, 'unit' => 'pcs'],
            ['product_code' => 'MKN-004', 'name' => 'Mie Goreng', 'category' => 'Makanan', 'selling_price' => 17000, 'cost_price' => 11000, 'stock' => 18, 'min_stock' => 5, 'unit' => 'pcs'],
            ['product_code' => 'MKN-005', 'name' => 'Keripik Kentang', 'category' => 'Snack', 'selling_price' => 8000, 'cost_price' => 5000, 'stock' => 50, 'min_stock' => 12, 'unit' => 'pcs'],
            ['product_code' => 'MKN-006', 'name' => 'Tissue', 'category' => 'Peralatan', 'selling_price' => 15000, 'cost_price' => 10000, 'stock' => 15, 'min_stock' => 6, 'unit' => 'box'],
        ];

        foreach ($seedProducts as $product) {
            Product::firstOrCreate(
                ['product_code' => $product['product_code']],
                [
                    'category_id' => $categoryMap[$product['category']],
                    'name' => $product['name'],
                    'description' => 'Produk demo ' . $product['name'],
                    'cost_price' => $product['cost_price'],
                    'selling_price' => $product['selling_price'],
                    'min_stock' => $product['min_stock'],
                    'stock' => $product['stock'],
                    'unit' => $product['unit'],
                    'image' => null,
                    'is_active' => true,
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
