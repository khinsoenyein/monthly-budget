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
        Schema::create('receivables', function (Blueprint $table) {
            $table->id();

            $table->string('receivable_code')->index();
            $table->string('date')->nullable();

            $table->unsignedBigInteger('receive_from_id')->nullable();
            $table->foreign('receive_from_id')->references('id')->on('contacts')->onDelete('cascade');

            $table->unsignedBigInteger('transaction_id')->nullable();
            $table->foreign('transaction_id')->references('id')->on('transactions')->onDelete('cascade');

            $table->string('due_date')->nullable();
            $table->decimal('amount', 12, 2)->default(0);
            $table->enum('status', ['pending', 'received'])->default('pending');

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
        Schema::dropIfExists('receivables');
    }
};
