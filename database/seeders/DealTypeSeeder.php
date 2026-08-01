<?php

namespace Database\Seeders;

use App\Models\DealType;
use Illuminate\Database\Seeder;

class DealTypeSeeder extends Seeder
{
    public function run()
    {
        $types = ['بيع', 'إيجار', 'استثمار', 'مشاركة أرباح', 'فرنشايز'];

        foreach ($types as $type) {
            DealType::create(['name' => $type]);
        }
    }
}