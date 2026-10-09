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
            $table->id();

            $table->string('transaction_code')->unique();

            $table->unsignedBigInteger('budget_id')->nullable();
            $table->foreign('budget_id')->references('id')->on('budgets');

            $table->enum('type', ['income', 'expense', 'saving'])->default('expense');

            $table->unsignedBigInteger('category_id')->nullable();
            $table->foreign('category_id')->references('id')->on('categories')->onDelete('cascade');

            $table->unsignedBigInteger('budget_item_id')->nullable();
            $table->foreign('budget_item_id')->references('id')->on('budget_items')->onDelete('cascade');

            $table->unsignedBigInteger('currency_id')->nullable();
            $table->foreign('currency_id')->references('id')->on('currencies')->onDelete('cascade');

            $table->unsignedBigInteger('account_id')->nullable();
            $table->foreign('account_id')->references('id')->on('accounts')->onDelete('cascade');

            $table->date('date')->nullable();
            $table->decimal('amount', 12, 2)->default(0);
            $table->text('description')->nullable();

            $table->enum('transaction_type', ['payable', 'receivable', '-'])->default('-');

            $table->longText('remark')->nullable();

            $table->boolean('isdeleted')->default(false);
            $table->boolean('isactive')->default(true);

            $table->integer('created_user')->nullable();
            $table->integer('modified_user')->nullable();
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
