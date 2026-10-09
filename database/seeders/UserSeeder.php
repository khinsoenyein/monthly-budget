<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $datas = [
            ['name' => 'mocha', 'email' => 'mocha@example.com', 'password' => Hash::make('mocha123')],
        ];

        foreach ($datas as $data) {
            User::create($data);
        }
    }
}
