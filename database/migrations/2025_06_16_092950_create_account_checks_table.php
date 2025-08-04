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
        Schema::create('account_checks', function (Blueprint $table) {
            $table->unsignedBigInteger('seq')->autoIncrement();
            
            $table->string('account_check_code')->index();
            $table->string('date')->nullable();

            $table->string('budget_code')->nullable();
            $table->foreign('budget_code')->references('budget_code')->on('budgets')->onDelete('cascade');

            $table->decimal('budget_balance', 12, 2)->default(0);
            $table->decimal('total_balance', 12, 2)->default(0);
            $table->decimal('difference', 12, 2)->default(0);

            $table->longText('remark')->nullable();

            $table->boolean('isdeleted')->default(false);
            $table->boolean('isactive')->default(true);

            $table->string('created_user')->nullable();
            $table->string('modified_user')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('account_check_details', function (Blueprint $table) {
            $table->unsignedBigInteger('seq')->autoIncrement();

            $table->string('account_check_code')->nullable();
            $table->foreign('account_check_code')->references('account_check_code')->on('account_checks')->onDelete('cascade');

            $table->string('budget_code')->nullable();
            $table->foreign('budget_code')->references('budget_code')->on('budgets')->onDelete('cascade');

            $table->string('account_code')->nullable();
            $table->foreign('account_code')->references('account_code')->on('accounts')->onDelete('cascade');

            $table->decimal('budget_balance', 12, 2)->default(0); //Opening + Income - Expense + TransferIn - TransferOut
            $table->decimal('actual_balance', 12, 2)->default(0); //In Hand

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
        Schema::dropIfExists('account_checks');
    }
};
