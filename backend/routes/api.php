<?php

declare(strict_types=1);

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ExportController;
use App\Http\Controllers\InteractionController;
use App\Http\Controllers\MigrationController;
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

// --- Public ---------------------------------------------------------------
Route::post('/auth/send-otp', [AuthController::class, 'sendOtp'])
    ->middleware('throttle:5,1'); // Limit to 5 attempts per minute

Route::post('/auth/verify-otp', [AuthController::class, 'verifyOtp'])
    ->middleware('throttle:10,1');

Route::post('/auth/verify-admin-otp', [AuthController::class, 'verifyAdminOtp'])
    ->middleware('throttle:10,1');

Route::post('/auth/register', [AuthController::class, 'register'])
    ->middleware('throttle:10,1');

// Migration endpoint (requires token)
Route::post('/migrate', [MigrationController::class, 'migrate']);

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

// --- Admin ----------------------------------------------------------------
// Protected by auth:sanctum + phone number gate (+923098127755)
Route::middleware(['auth:sanctum', \App\Http\Middleware\IsAdmin::class])
    ->prefix('admin')
    ->group(function (): void {
        // Overview
        Route::get('/analytics', [AdminController::class, 'analytics']);

        // Module 1: User Registry & Invite Management
        Route::get('/users', [AdminController::class, 'getUsers']);
        Route::post('/users/{userId}/regenerate-invite', [AdminController::class, 'regenerateInviteCode']);

        // Module 2: Connection Oversight
        Route::get('/couples', [AdminController::class, 'getCouples']);
        Route::delete('/couples/{coupleId}/unlink', [AdminController::class, 'unlinkCouple']);

        // Module 3: Media Analytics
        Route::get('/media-stats', [AdminController::class, 'getMediaStats']);

        // Module 4: Engagement Metrics
        Route::get('/engagement', [AdminController::class, 'getEngagementMetrics']);

        // Module 5: Infrastructure Health
        Route::get('/health', [AdminController::class, 'getInfraHealth']);
    });
