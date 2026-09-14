<?php

namespace Database\Seeders;

use App\Models\Customer;
use Illuminate\Database\Seeder;

class CustomerSeeder extends Seeder
{
    public function run(): void
    {
        $customers = [
            ['email' => 'pelanggan@tokopos.test', 'name' => 'Pelanggan Umum', 'phone' => '081122334455', 'address' => 'Jl. Raya No. 1', 'status' => 'active'],
            ['email' => 'andi@tokopos.test', 'name' => 'Andi Saputra', 'phone' => '081122334456', 'address' => 'Jl. Melati No. 2', 'status' => 'active'],
            ['email' => 'budi@tokopos.test', 'name' => 'Budi Santoso', 'phone' => '081122334457', 'address' => 'Jl. Kenanga No. 8', 'status' => 'active'],
            ['email' => 'citra@tokopos.test', 'name' => 'Citra Lestari', 'phone' => '081122334458', 'address' => 'Jl. Mawar No. 14', 'status' => 'active'],
            ['email' => 'dedi@tokopos.test', 'name' => 'Dedi Kurniawan', 'phone' => '081122334459', 'address' => 'Jl. Anggrek No. 6', 'status' => 'active'],
            ['email' => 'eka@tokopos.test', 'name' => 'Eka Wulandari', 'phone' => '081122334460', 'address' => 'Jl. Flamboyan No. 3', 'status' => 'inactive'],
            ['email' => 'fajar@tokopos.test', 'name' => 'Fajar Hidayat', 'phone' => '081122334461', 'address' => 'Jl. Teratai No. 11', 'status' => 'inactive'],
            ['email' => 'gita@tokopos.test', 'name' => 'Gita Permata', 'phone' => '081122334462', 'address' => 'Jl. Dahlia No. 5', 'status' => 'inactive'],
        ];

        foreach ($customers as $data) {
            Customer::withTrashed()->updateOrCreate(
                ['email' => $data['email']],
                array_merge($data, ['total_purchases' => 0, 'purchase_count' => 0])
            );
        }

        foreach ([
            ['email' => 'pelanggan-terhapus-1@tokopos.test', 'name' => 'Pelanggan Terhapus 1', 'phone' => '081199990001'],
            ['email' => 'pelanggan-terhapus-2@tokopos.test', 'name' => 'Pelanggan Terhapus 2', 'phone' => '081199990002'],
        ] as $data) {
            $customer = Customer::withTrashed()->updateOrCreate(
                ['email' => $data['email']],
                array_merge($data, [
                    'address' => 'Data pelanggan untuk pengujian data terhapus',
                    'total_purchases' => 0,
                    'purchase_count' => 0,
                    'status' => 'inactive',
                ])
            );

            if (!$customer->trashed()) {
                $customer->delete();
            }
        }
    }
}
