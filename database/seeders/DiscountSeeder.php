<?php

namespace Database\Seeders;

use App\Models\Discount;
use Illuminate\Database\Seeder;

class DiscountSeeder extends Seeder
{
    public function run(): void
    {
        foreach ([
            ['code' => 'TRASH10', 'name' => 'Diskon Terhapus 1'],
            ['code' => 'TRASH20', 'name' => 'Diskon Terhapus 2'],
        ] as $data) {
            $discount = Discount::withTrashed()->updateOrCreate(
                ['code' => $data['code']],
                [
                    'name' => $data['name'],
                    'description' => 'Data diskon untuk pengujian data terhapus',
                    'type' => 'percentage', 'value' => 10, 'max_discount' => 10000,
                    'min_purchase' => 25000, 'max_usage' => 10, 'usage_count' => 0,
                    'start_date' => now()->subMonth(), 'end_date' => now()->subDay(), 'is_active' => false,
                ]
            );
            if (!$discount->trashed()) {
                $discount->delete();
            }
        }

        $discounts = [
            ['code' => 'SAVE10', 'name' => 'Diskon Awal Bulan', 'description' => 'Diskon 10% untuk pembelian di atas Rp50.000', 'type' => 'percentage', 'value' => 10, 'max_discount' => 25000, 'min_purchase' => 50000, 'max_usage' => 100, 'is_active' => true],
            ['code' => 'HEMAT25', 'name' => 'Hemat Belanja', 'description' => 'Potongan Rp25.000 untuk pembelian di atas Rp150.000', 'type' => 'fixed', 'value' => 25000, 'max_discount' => null, 'min_purchase' => 150000, 'max_usage' => 50, 'is_active' => true],
            ['code' => 'OLD15', 'name' => 'Diskon Lama', 'description' => 'Diskon 15% yang sedang dinonaktifkan', 'type' => 'percentage', 'value' => 15, 'max_discount' => 30000, 'min_purchase' => 75000, 'max_usage' => 100, 'is_active' => false],
            ['code' => 'FLASH50', 'name' => 'Flash Sale', 'description' => 'Potongan Rp50.000 yang sedang dinonaktifkan', 'type' => 'fixed', 'value' => 50000, 'max_discount' => null, 'min_purchase' => 250000, 'max_usage' => 25, 'is_active' => false],
            ['code' => 'FLASH75', 'name' => 'Flash Sale 75%', 'description' => 'Potongan Rp75.000 yang sedang dinonaktifkan', 'type' => 'fixed', 'value' => 50000, 'max_discount' => 15000, 'min_purchase' => 250000, 'max_usage' => 25, 'is_active' => true],
        ];

        foreach ($discounts as $data) {
            $discount = Discount::withTrashed()->updateOrCreate(
                ['code' => $data['code']],
                array_merge($data, [
                    'usage_count' => 0,
                    'start_date' => now()->subDay(),
                    'end_date' => now()->addMonth(),
                ])
            );
            if ($discount->trashed()) {
                $discount->restore();
            }
        }
    }
}
