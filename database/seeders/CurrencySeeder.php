<?php

namespace Database\Seeders;

use App\Models\Currency;
use Illuminate\Database\Seeder;

class CurrencySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $datas = [
            ['code' => 'MMK', 'name' => 'Myanmar Kyat', 'created_user' => 1],
            ['code' => 'USD', 'name' => 'United States dollar', 'created_user' => 1],
        ];

        foreach ($datas as $data) {
            Currency::create($data);
        }
    }
}
