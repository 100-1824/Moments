<?php

declare(strict_types=1);

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ExportController;
use App\Http\Controllers\InteractionController;
use App\Http\Controllers\MomentController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Moments API Routes
|--------------------------------------------------------------------------
|
| All routes are stateless and authenticated through Laravel Sanctum's
| `auth:sanctum` token guard. The frontend MUST send `Authorization:
| Bearer <token>` on every protected request.
|
*/

// --- Health (no auth) -------------------------------------------------------
Route::get('/health', function () {
    try {
        \DB::connection()->getPdo();
        $dbOk    = true;
        $dbError = null;
    } catch (\Throwable $e) {
        $dbOk    = false;
        $dbError = $e->getMessage();
    }

    return response()->json([
        'status'      => 'ok',
        'php'         => PHP_VERSION,
        'pdo_pgsql'   => extension_loaded('pdo_pgsql'),
        'app_key_set' => (bool) config('app.key'),
        'db_ok'       => $dbOk,
        'db_error'    => $dbError,
    ]);
});

// --- Public ---------------------------------------------------------------
Route::post('/auth/register', [AuthController::class, 'register'])
    ->middleware('throttle:10,1');

// --- Authenticated --------------------------------------------------------
Route::middleware('auth:sanctum')->group(function (): void {
    // Auth & profile
    Route::post('/auth/connect', [AuthController::class, 'connect']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Daily moments
    Route::post('/moments', [MomentController::class, 'store']);
    Route::get('/moments/today', [MomentController::class, 'today']);
    Route::post('/moments/sync', [MomentController::class, 'sync']);

    // Tactile interactions
    Route::post('/pings', [InteractionController::class, 'ping']);

    // Data export
    Route::get('/export/archive', [ExportController::class, 'archive']);
});
