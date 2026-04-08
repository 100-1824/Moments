<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Artisan;
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
            Artisan::call('migrate', ['--force' => true]);
            $output = Artisan::output();

            return response()->json([
                'status' => 'ok',
                'message' => 'Migrations completed successfully',
                'output' => $output,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Migration failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
