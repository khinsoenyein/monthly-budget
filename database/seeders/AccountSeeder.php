<?php

namespace Database\Seeders;

use App\Models\Account;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class AccountSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $datas = [
            ['code' => 'UAB Pay', 'name' => 'UAB Pay', 'type' => 'e-wallet', 'sort_order' => 1, 'created_user' => 1, 'created_at' => now()],
            ['code' => 'UAB Fixed', 'name' => 'UAB Fixed', 'type' => 'bank', 'sort_order' => 2, 'created_user' => 1, 'created_at' => now()],
            ['code' => 'Zee Kwat', 'name' => 'Zee Kwat', 'type' => 'bank', 'sort_order' => 3, 'created_user' => 1, 'created_at' => now()],
            ['code' => 'AYA Special', 'name' => 'AYA Special', 'type' => 'bank', 'sort_order' => 4, 'created_user' => 1, 'created_at' => now()],
            ['code' => 'AYA Pay', 'name' => 'AYA Pay', 'type' => 'e-wallet', 'sort_order' => 5, 'created_user' => 1, 'created_at' => now()],
            ['code' => 'AYA Current', 'name' => 'AYA Current', 'type' => 'bank', 'sort_order' => 6, 'created_user' => 1, 'created_at' => now()],
            ['code' => 'AYA Loan', 'name' => 'AYA Loan', 'type' => 'bank', 'sort_order' => 7, 'created_user' => 1, 'created_at' => now()],
            ['code' => 'KPay', 'name' => 'KPay', 'type' => 'e-wallet', 'sort_order' => 8, 'created_user' => 1, 'created_at' => now()],
            ['code' => 'Happy Saving', 'name' => 'Happy Saving', 'type' => 'bank', 'sort_order' => 9, 'created_user' => 1, 'created_at' => now()],
            ['code' => 'Dream Saving', 'name' => 'Dream Saving', 'type' => 'bank', 'sort_order' => 10, 'created_user' => 1, 'created_at' => now()],
            ['code' => 'KBZ Special', 'name' => 'KBZ Special', 'type' => 'bank', 'sort_order' => 11, 'created_user' => 1, 'created_at' => now()],
            ['code' => 'Purse', 'name' => 'Purse', 'type' => 'cash', 'sort_order' => 12, 'created_user' => 1, 'created_at' => now()],
            ['code' => 'Small', 'name' => 'Small', 'type' => 'cash', 'sort_order' => 13, 'created_user' => 1, 'created_at' => now()],
            ['code' => 'Extra Purse', 'name' => 'Extra Purse', 'type' => 'cash', 'sort_order' => 14, 'created_user' => 1, 'created_at' => now()],
            ['code' => 'AYA Credit Card', 'name' => 'AYA Credit Card', 'type' => 'credit-card', 'sort_order' => 15, 'created_user' => 1, 'created_at' => now()],
        ];

        foreach ($datas as $data) {
            Account::create($data);
        }
    }
}
