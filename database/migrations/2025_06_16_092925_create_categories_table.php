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
        Schema::create('categories', function (Blueprint $table) {
            $table->id();

            $table->string('code')->unique();
            $table->string('name');
            $table->enum('type', ['income', 'expense', 'saving']);
            
            $table->decimal('default_plan_amount', 12, 2)->default(0);

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
        Schema::dropIfExists('categories');
    }
};
