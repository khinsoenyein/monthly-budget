<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $datas = [
            ['code' => 'EHL', 'name' => 'Home Loan', 'type' => 'expense', 'default_plan_amount' => 1150000, 'created_user' => 1, 'created_at' => now()],
            ['code' => 'ECC', 'name' => 'Credit Card', 'type' => 'expense', 'default_plan_amount' => 500000, 'created_user' => 1, 'created_at' => now()],
            ['code' => 'ES', 'name' => 'Sujayy', 'type' => 'expense', 'default_plan_amount' => 100000, 'created_user' => 1, 'created_at' => now()],
            ['code' => 'EMF', 'name' => "Mocha's Family", 'type' => 'expense', 'default_plan_amount' => 120000, 'created_user' => 1, 'created_at' => now()],
            ['code' => 'EMB', 'name' => 'Meter Bill', 'type' => 'expense', 'default_plan_amount' => 50000, 'created_user' => 1, 'created_at' => now()],
            ['code' => 'EB', 'name' => 'Bill', 'type' => 'expense', 'default_plan_amount' => 46000, 'created_user' => 1, 'created_at' => now()],
            ['code' => 'EG', 'name' => 'Groceries', 'type' => 'expense', 'default_plan_amount' => 300000, 'created_user' => 1, 'created_at' => now()],
            ['code' => 'EF', 'name' => 'Food', 'type' => 'expense', 'default_plan_amount' => 100000, 'created_user' => 1, 'created_at' => now()],
            ['code' => 'ET', 'name' => 'Transportation', 'type' => 'expense', 'default_plan_amount' => 20000, 'created_user' => 1, 'created_at' => now()],
            ['code' => 'EP', 'name' => 'Personal', 'type' => 'expense', 'default_plan_amount' => 0, 'created_user' => 1, 'created_at' => now()],
            ['code' => 'EU', 'name' => 'Utilities', 'type' => 'expense', 'default_plan_amount' => 0, 'created_user' => 1, 'created_at' => now()],
            ['code' => 'EB2', 'name' => 'Beauty', 'type' => 'expense', 'default_plan_amount' => 0, 'created_user' => 1, 'created_at' => now()],
            ['code' => 'EG2', 'name' => 'Gifts', 'type' => 'expense', 'default_plan_amount' => 0, 'created_user' => 1, 'created_at' => now()],
            ['code' => 'ED', 'name' => 'Delivery', 'type' => 'expense', 'default_plan_amount' => 0, 'created_user' => 1, 'created_at' => now()],
            ['code' => 'EM', 'name' => 'Medicines', 'type' => 'expense', 'default_plan_amount' => 0, 'created_user' => 1, 'created_at' => now()],
            ['code' => 'EE', 'name' => 'Education', 'type' => 'expense', 'default_plan_amount' => 0, 'created_user' => 1, 'created_at' => now()],
            ['code' => 'ED2', 'name' => 'Doggie', 'type' => 'expense', 'default_plan_amount' => 0, 'created_user' => 1, 'created_at' => now()],
            ['code' => 'ET2', 'name' => 'Treat', 'type' => 'expense', 'default_plan_amount' => 0, 'created_user' => 1, 'created_at' => now()],
            ['code' => 'ED3', 'name' => 'Debt', 'type' => 'expense', 'default_plan_amount' => 0, 'created_user' => 1, 'created_at' => now()],
            ['code' => 'ELI', 'name' => 'Life Insurance', 'type' => 'expense', 'default_plan_amount' => 0, 'created_user' => 1, 'created_at' => now()],
            ['code' => 'ED4', 'name' => 'Dollar', 'type' => 'expense', 'default_plan_amount' => 450000, 'created_user' => 1, 'created_at' => now()],
            ['code' => 'EGI', 'name' => 'Gold Investment', 'type' => 'expense', 'default_plan_amount' => 0, 'created_user' => 1, 'created_at' => now()],
            ['code' => 'EOE', 'name' => 'Other Expense', 'type' => 'expense', 'default_plan_amount' => 0, 'created_user' => 1, 'created_at' => now()],
            ['code' => 'IMS', 'name' => 'Monthly Salary', 'type' => 'income', 'default_plan_amount' => 3380000, 'created_user' => 1, 'created_at' => now()],
            ['code' => 'IP', 'name' => 'Paycheck', 'type' => 'income', 'default_plan_amount' => 600000, 'created_user' => 1, 'created_at' => now()],
            ['code' => 'IB', 'name' => 'Borrow', 'type' => 'income', 'default_plan_amount' => 0, 'created_user' => 1, 'created_at' => now()],
            ['code' => 'IR', 'name' => 'Repayment', 'type' => 'income', 'default_plan_amount' => 310000, 'created_user' => 1, 'created_at' => now()],
            ['code' => 'IPM', 'name' => 'Pocket Money', 'type' => 'income', 'default_plan_amount' => 0, 'created_user' => 1, 'created_at' => now()],
            ['code' => 'II', 'name' => 'Interest', 'type' => 'income', 'default_plan_amount' => 20000, 'created_user' => 1, 'created_at' => now()],
            ['code' => 'IOI', 'name' => 'Other Income', 'type' => 'income', 'default_plan_amount' => 0, 'created_user' => 1, 'created_at' => now()],
            ['code' => 'SM', 'name' => 'Mom', 'type' => 'saving', 'default_plan_amount' => 1000000, 'created_user' => 1, 'created_at' => now()],
            ['code' => 'SI', 'name' => 'Insurance', 'type' => 'saving', 'default_plan_amount' => 0, 'created_user' => 1, 'created_at' => now()],
            ['code' => 'SH', 'name' => 'Health', 'type' => 'saving', 'default_plan_amount' => 0, 'created_user' => 1, 'created_at' => now()],
            ['code' => 'ST', 'name' => 'Travel', 'type' => 'saving', 'default_plan_amount' => 0, 'created_user' => 1, 'created_at' => now()],
            ['code' => 'SP', 'name' => 'Parent', 'type' => 'saving', 'default_plan_amount' => 0, 'created_user' => 1, 'created_at' => now()],
            ['code' => 'SEF', 'name' => 'Emergency Fund', 'type' => 'saving', 'default_plan_amount' => 35000, 'created_user' => 1, 'created_at' => now()],
            ['code' => 'SR', 'name' => 'Retirement', 'type' => 'saving', 'default_plan_amount' => 35000, 'created_user' => 1, 'created_at' => now()],
            ['code' => 'SOS', 'name' => 'Other Saving', 'type' => 'saving', 'default_plan_amount' => 0, 'created_user' => 1, 'created_at' => now()],
        ];

        foreach ($datas as $data) {
            Category::create($data);
        }
    }
}
