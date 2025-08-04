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
        Schema::create('budget_items', function (Blueprint $table) {
            $table->unsignedBigInteger('seq')->autoIncrement();
            
            $table->string('budget_item_code')->index();

            $table->string('budget_code')->nullable();
            $table->foreign('budget_code')->references('budget_code')->on('budgets')->onDelete('cascade');
            
            $table->enum('type', ['income', 'expense', 'saving']);

            $table->string('category_code')->nullable();
            $table->foreign('category_code')->references('category_code')->on('categories')->onDelete('cascade');

            $table->decimal('plan_amount', 12, 2)->default(0);
            $table->decimal('actual_amount', 12, 2)->default(0);

            $table->string('currency_code')->nullable();
            $table->foreign('currency_code')->references('currency_code')->on('currencies')->onDelete('cascade');

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
        Schema::dropIfExists('budget_items');
    }
};
