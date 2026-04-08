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
                    $table->id();
                    $table->string('name', 80);
                    $table->string('phone', 32)->unique();
                    $table->string('invite_code', 8)->unique();
                    $table->string('timezone', 64);
                    $table->unsignedBigInteger('couple_id')->nullable()->index();
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
                    $table->id();
                    $table->unsignedBigInteger('partner_a_id');
                    $table->unsignedBigInteger('partner_b_id');
                    $table->string('status', 20)->default('active');
                    $table->timestamp('linked_at');
                    $table->timestamps();
                    $table->foreign('partner_a_id')->references('id')->on('users')->onDelete('cascade');
                    $table->foreign('partner_b_id')->references('id')->on('users')->onDelete('cascade');
                });
                $completed[] = 'couples - Created';
            } else {
                $completed[] = 'couples - Already exists';
            }

            // Create moments table
            if (!Schema::hasTable('moments')) {
                Schema::create('moments', function (Blueprint $table) {
                    $table->id();
                    $table->unsignedBigInteger('couple_id');
                    $table->text('message');
                    $table->string('media_url', 2048)->nullable();
                    $table->timestamp('captured_at');
                    $table->timestamps();
                    $table->foreign('couple_id')->references('id')->on('couples')->onDelete('cascade');
                });
                $completed[] = 'moments - Created';
            } else {
                $completed[] = 'moments - Already exists';
            }

            // Create pings table
            if (!Schema::hasTable('pings')) {
                Schema::create('pings', function (Blueprint $table) {
                    $table->id();
                    $table->unsignedBigInteger('couple_id');
                    $table->unsignedBigInteger('sender_id');
                    $table->string('type', 20)->default('tap');
                    $table->timestamp('sent_at');
                    $table->timestamps();
                    $table->foreign('couple_id')->references('id')->on('couples')->onDelete('cascade');
                    $table->foreign('sender_id')->references('id')->on('users')->onDelete('cascade');
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
