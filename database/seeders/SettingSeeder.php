<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    public function run()
    {
        Setting::create([
            'company_name' => 'شركة مسار العقارية',
            'phone' => '+966500000000',
            'email' => 'info@masar.sa',
            'manager_name' => 'أسد',
            'manager_phone' => '+966500000000',
            'legal_name' => 'الشؤون القانونية',
            'report_day' => 4,
            'max_wait_days' => 3
        ]);
    }
}