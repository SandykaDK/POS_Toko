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
        Schema::create('discounts', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('code', 50)->unique();
            $table->text('description')->nullable();
            $table->string('type', 20); // percentage, fixed
            $table->decimal('value', 12, 2);
            $table->decimal('max_discount', 12, 2)->nullable();
            $table->decimal('min_purchase', 12, 2)->default(0);
            $table->integer('max_usage')->nullable();
            $table->integer('usage_count')->default(0);
            $table->datetime('start_date');
            $table->datetime('end_date')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('discounts');
    }
};
