<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run()
    {
        User::create([
            'name' => 'مدير النظام',
            'email' => 'admin@masar.sa',
            'password_hash' => Hash::make('Admin.123'),
            'phone' => '+966500000000'
        ]);
    }
}