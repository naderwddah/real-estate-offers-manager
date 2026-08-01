<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run()
    {
        $this->call([
            PropertyTypeSeeder::class,
            DealTypeSeeder::class,
            StageSeeder::class,
            UserSeeder::class,
            SettingSeeder::class,
        ]);
    }
}