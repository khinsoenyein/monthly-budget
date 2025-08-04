<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->unsignedBigInteger('seq')->autoIncrement();
            
            $table->string('transaction_code')->index();

            $table->string('budget_code')->nullable();
            $table->foreign('budget_code')->references('budget_code')->on('budgets')->onDelete('cascade');
            
            $table->enum('type', ['income', 'expense', 'saving', 'payable_payment', 'receivable_collection', 'transfer']);

            $table->string('category_code')->nullable();
            $table->foreign('category_code')->references('category_code')->on('categories')->onDelete('cascade');

            $table->string('budget_item_code')->nullable();
            $table->foreign('budget_item_code')->references('budget_item_code')->on('budget_items')->onDelete('cascade');

            $table->string('currency_code')->nullable();
            $table->foreign('currency_code')->references('currency_code')->on('currencies')->onDelete('cascade');

            $table->string('account_code')->nullable();
            $table->foreign('account_code')->references('account_code')->on('accounts')->onDelete('cascade');

            $table->string('payable_code')->nullable();
            $table->foreign('payable_code')->references('payable_code')->on('payables')->onDelete('cascade');

            $table->string('receivable_code')->nullable();
            $table->foreign('receivable_code')->references('receivable_code')->on('receivables')->onDelete('cascade');

            $table->string('date')->nullable();
            $table->decimal('amount', 12, 2)->default(0);
            $table->text('description')->nullable();

            $table->longText('remark')->nullable();

            $table->boolean('isdeleted')->default(false);
            $table->boolean('isactive')->default(true);

            $table->string('created_user')->nullable();
            $table->string('modified_user')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
