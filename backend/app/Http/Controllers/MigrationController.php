<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Artisan;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class MigrationController extends Controller
{
    /**
     * Run database migrations. Only callable with the correct token.
     */
    public function migrate(): JsonResponse
    {
        $token = request()->header('X-Migration-Token')
            ?? request()->input('migration_token')
            ?? request()->query('token');
        $expected = env('MIGRATION_TOKEN');

        if (! is_string($token) || ! is_string($expected) || ! hash_equals($expected, $token)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized',
            ], 401);
        }

        try {
            // Run standard Laravel migrations using the --force flag for production environments
            $exitCode = Artisan::call('migrate', [
                '--force' => true,
            ]);

            $output = Artisan::output();

            return response()->json([
                'status' => 'ok',
                'message' => 'Database migrate executed',
                'exit_code' => $exitCode,
                'output' => trim($output),
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Migration failed: ' . $e->getMessage());
            
            return response()->json([
                'status' => 'error',
                'message' => 'Migration failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
