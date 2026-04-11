<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * notes — partner secret notes for the Foggy Mirror feature.
 *
 * One active note per couple at a time. Writing a new note soft-replaces
 * the previous one by setting replaced_at on the old record.
 *
 * revealed_at: set when the recipient taps to wipe the fog.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notes', function (Blueprint $table): void {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('couple_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('author_id')->constrained('users')->cascadeOnDelete();
            $table->text('content');                          // the secret message
            $table->timestamp('revealed_at')->nullable();     // null = still fogged
            $table->timestamp('replaced_at')->nullable();     // null = still active
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notes');
    }
};
