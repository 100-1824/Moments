<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('moments', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->uuid('couple_id');
            $table->enum('type', ['image', 'audio']);
            $table->string('media_url', 1024);
            $table->text('caption_payload')->nullable();
            $table->boolean('is_encrypted')->default(false);
            $table->timestamp('captured_at')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('couple_id')->references('id')->on('couples')->cascadeOnDelete();

            $table->index(['user_id', 'created_at']);
            $table->index(['couple_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('moments');
    }
};
