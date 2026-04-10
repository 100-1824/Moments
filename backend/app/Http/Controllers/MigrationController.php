<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\JsonResponse;

class MigrationController extends Controller
{
    /**
     * Run database migrations. Only callable with the correct token.
     * Call with: POST /api/migrate?token=YOUR_SECRET_TOKEN
     */
    public function migrate(): JsonResponse
    {
        $token = request()->query('token');
        $expected = $_ENV['MIGRATION_TOKEN'] ?? $_SERVER['MIGRATION_TOKEN'] ?? null;

        if (!$token || !$expected || $token !== $expected) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized',
            ], 401);
        }

        try {
            $completed = [];

            // Create users table
            if (!Schema::hasTable('users')) {
                Schema::create('users', function (Blueprint $table) {
                    $table->uuid('id')->primary();
                    $table->string('name');
                    $table->string('phone')->unique();
                    $table->string('invite_code', 16)->unique();
                    $table->uuid('couple_id')->nullable()->index();
                    $table->string('timezone', 64)->default('UTC');
                    $table->timestamp('last_seen_at')->nullable();
                    $table->timestamps();
                });
                $completed[] = 'users - Created';
            } else {
                $completed[] = 'users - Already exists';
            }

            // Create couples table
            if (!Schema::hasTable('couples')) {
                Schema::create('couples', function (Blueprint $table) {
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
                $completed[] = 'couples - Created';
            } else {
                $completed[] = 'couples - Already exists';
            }

            // Create moments table
            if (!Schema::hasTable('moments')) {
                Schema::create('moments', function (Blueprint $table) {
                    $table->uuid('id')->primary();
                    $table->uuid('user_id');
                    $table->uuid('couple_id');
                    $table->enum('type', ['image', 'audio']);
                    $table->string('media_url', 2048);
                    $table->text('caption_payload')->nullable();
                    $table->boolean('is_encrypted')->default(false);
                    $table->timestamp('captured_at')->nullable();
                    $table->timestamps();

                    $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
                    $table->foreign('couple_id')->references('id')->on('couples')->cascadeOnDelete();
                });
                $completed[] = 'moments - Created';
            } else {
                $completed[] = 'moments - Already exists';
            }

            // Create pings table
            if (!Schema::hasTable('pings')) {
                Schema::create('pings', function (Blueprint $table) {
                    $table->uuid('id')->primary();
                    $table->uuid('sender_id');
                    $table->uuid('receiver_id');
                    $table->timestamps();

                    $table->foreign('sender_id')->references('id')->on('users')->cascadeOnDelete();
                    $table->foreign('receiver_id')->references('id')->on('users')->cascadeOnDelete();

                    $table->index(['receiver_id', 'created_at']);
                });
                $completed[] = 'pings - Created';
            } else {
                $completed[] = 'pings - Already exists';
            }

            // Create personal_access_tokens table
            if (!Schema::hasTable('personal_access_tokens')) {
                Schema::create('personal_access_tokens', function (Blueprint $table) {
                    $table->id();
                    $table->morphs('tokenable');
                    $table->string('name');
                    $table->string('token', 80)->unique();
                    $table->text('abilities')->nullable();
                    $table->timestamp('last_used_at')->nullable();
                    $table->timestamp('expires_at')->nullable();
                    $table->timestamps();
                });
                $completed[] = 'personal_access_tokens - Created';
            } else {
                $completed[] = 'personal_access_tokens - Already exists';
            }

            return response()->json([
                'status' => 'ok',
                'message' => 'Migrations completed',
                'tables' => $completed,
            ], 200);
        } catch (\Throwable $e) {
            \Log::error('Migration failed: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
            
            return response()->json([
                'status' => 'error',
                'message' => 'Migration failed',
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ], 500);
        }
    }
}
