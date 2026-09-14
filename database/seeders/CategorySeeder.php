<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Makanan', 'code' => 'MKN'],
            ['name' => 'Minuman', 'code' => 'MIN'],
            ['name' => 'Alat Tulis', 'code' => 'ATK'],
            ['name' => 'Bumbu', 'code' => 'BMB'],
            ['name' => 'Sembako', 'code' => 'SBK'],
            ['name' => 'Obat', 'code' => 'OBT'],
            ['name' => 'Kebersihan Rumah', 'code' => 'KBR'],
            ['name' => 'Perawatan Pribadi', 'code' => 'PRB'],
            ['name' => 'Tes Kategori', 'code' => 'TES', 'is_active' => false],
        ];

        foreach ($categories as $data) {
            Category::firstOrCreate(
                ['slug' => str($data['name'])->slug()->value()],
                [
                    'name' => $data['name'],
                    'category_code' => $data['code'],
                    'description' => 'Kategori ' . $data['name'],
                    'is_active' => $data['is_active'] ?? true,
                ]
            );
        }

        foreach ([
            ['name' => 'Kategori Terhapus 1', 'code' => 'TRS', 'slug' => 'kategori-terhapus-1'],
            ['name' => 'Kategori Terhapus 2', 'code' => 'TR2', 'slug' => 'kategori-terhapus-2'],
        ] as $data) {
            $category = Category::withTrashed()->updateOrCreate(
                ['slug' => $data['slug']],
                [
                    'name' => $data['name'],
                    'category_code' => $data['code'],
                    'description' => 'Kategori untuk pengujian data terhapus',
                    'is_active' => false,
                ]
            );

            if (!$category->trashed()) {
                $category->delete();
            }
        }
    }
}
