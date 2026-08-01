<?php

namespace Database\Seeders;

use App\Models\PropertyType;
use Illuminate\Database\Seeder;

class PropertyTypeSeeder extends Seeder
{
    public function run()
    {
        $types = ['أرض', 'محطة وقود', 'مركز تجاري', 'فيلا', 'شقة', 'عمارة', 'مستودع', 'مكتب'];

        foreach ($types as $type) {
            PropertyType::create(['name' => $type]);
        }
    }
}