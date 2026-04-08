<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('couples', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('partner_a_id');
            $table->uuid('partner_b_id');
            $table->enum('status', ['pending', 'active', 'archived'])->default('active');
            $table->timestamp('linked_at')->nullable();
            $table->timestamps();

            $table->foreign('partner_a_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('partner_b_id')->references('id')->on('users')->cascadeOnDelete();

            $table->unique(['partner_a_id', 'partner_b_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('couples');
    }
};
