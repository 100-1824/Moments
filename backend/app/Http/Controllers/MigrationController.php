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
     * Call with: POST /api/migrate (token must be in the request body)
     */
    public function migrate(): JsonResponse
    {
        $token = request()->input('migration_token');
        $expected = $_ENV['MIGRATION_TOKEN'] ?? $_SERVER['MIGRATION_TOKEN'] ?? null;

        if (!$token || !$expected || $token !== $expected) {
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
                'message' => 'Migrations command executed',
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
    }
}
