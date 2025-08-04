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
        Schema::create('account_transfers', function (Blueprint $table) {
            $table->unsignedBigInteger('seq')->autoIncrement();
            
            $table->string('account_transfer_code')->index();
            $table->string('date')->nullable();

            $table->string('from_account_code')->nullable();
            $table->foreign('from_account_code')->references('account_code')->on('accounts')->onDelete('cascade');

            $table->string('to_account_code')->nullable();
            $table->foreign('to_account_code')->references('account_code')->on('accounts')->onDelete('cascade');
            
            $table->decimal('amount', 12, 2)->default(0);

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
        Schema::dropIfExists('account_transfers');
    }
};
