<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('personal_access_tokens', function (Blueprint $table): void {
            $table->id();
            // Sanctum's morphs() helper assumes integer keys; our users
            // table uses UUIDs so we declare the polymorphic columns
            // explicitly with a uuid `tokenable_id`.
            $table->string('tokenable_type');
            $table->uuid('tokenable_id');
            $table->index(['tokenable_type', 'tokenable_id']);

            $table->text('name');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable()->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('personal_access_tokens');
    }
};
