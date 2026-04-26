<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Couple;
use App\Models\Moment;
use App\Models\Ping;
use App\Models\User;
use App\Support\InviteCode;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class AdminController extends Controller
{
    // ─── Module 1: User Registry ──────────────────────────────────────────────

    /**
     * Paginated user registry with search support.
     * Returns: name, phone, invite_code, last_seen_at, couple status.
     */
    public function getUsers(Request $request): JsonResponse
    {
        $query = User::query()
            ->select(['id', 'name', 'phone', 'invite_code', 'couple_id', 'last_seen_at', 'created_at'])
            ->with(['couple:id,status,linked_at']);

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search): void {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('phone', 'ilike', "%{$search}%")
                  ->orWhere('invite_code', 'ilike', "%{$search}%");
            });
        }

        $users = $query->latest()->paginate(20);

        return response()->json(['status' => 'success', 'data' => $users]);
    }

    /**
     * Regenerate a unique invite code for a given user.
     */
    public function regenerateInviteCode(string $userId): JsonResponse
    {
        $user = User::findOrFail($userId);
        $newCode = InviteCode::generateUnique();

        $user->update(['invite_code' => $newCode]);

        return response()->json([
            'status' => 'success',
            'data' => ['invite_code' => $newCode],
        ]);
    }

    /**
     * Delete a user and handle couple cleanup.
     * If user is in a couple, unlinks the couple and deletes all moments before deleting the user.
     */
    public function deleteUser(string $userId): JsonResponse
    {
        DB::transaction(function () use ($userId): void {
            $user = User::findOrFail($userId);

            // If user is in a couple, archive it and clear both users
            if ($user->couple_id) {
                $couple = Couple::find($user->couple_id);
                if ($couple) {
                    Moment::where('couple_id', $couple->id)->delete();
                    User::whereIn('id', [$couple->partner_a_id, $couple->partner_b_id])
                        ->update(['couple_id' => null]);
                    $couple->update(['status' => 'archived']);
                }
            }

            // Delete related records that have FK constraints on user_id
            $user->pushSubscriptions()->delete();
            $user->sentPings()->delete();
            $user->receivedPings()->delete();
            $user->tokens()->delete();
            $user->moments()->delete();

            $user->delete();
        });

        return response()->json(['status' => 'success', 'message' => 'User deleted.']);
    }

    // ─── Module 2: Connection Oversight ───────────────────────────────────────

    /**
     * Paginated couples list with both partner summaries.
     */
    public function getCouples(Request $request): JsonResponse
    {
        $couples = Couple::query()
            ->with([
                'partnerA:id,name,phone,invite_code,last_seen_at',
                'partnerB:id,name,phone,invite_code,last_seen_at',
            ])
            ->latest()
            ->paginate(20);

        return response()->json(['status' => 'success', 'data' => $couples]);
    }

    /**
     * Unlink a couple — clears couple_id on both users, archives the couple record.
     * Uses a DB transaction for atomicity; never uses lockForUpdate on aggregates.
     */
    public function unlinkCouple(string $coupleId): JsonResponse
    {
        DB::transaction(function () use ($coupleId): void {
            $couple = Couple::findOrFail($coupleId);

            // Clear couple reference on both users
            User::whereIn('id', [$couple->partner_a_id, $couple->partner_b_id])
                ->update(['couple_id' => null]);

            // Archive the couple record
            $couple->update(['status' => 'archived']);
        });

        return response()->json(['status' => 'success', 'message' => 'Couple unlinked.']);
    }

    /**
     * Permanently hard-delete a couple record from the database.
     * Used to purge zombie/archived records that block re-linking.
     */
    public function purgeCouple(string $coupleId): JsonResponse
    {
        DB::transaction(function () use ($coupleId): void {
            $couple = Couple::findOrFail($coupleId);

            // Ensure users are cleared (safety net if unlink was partial)
            User::whereIn('id', [$couple->partner_a_id, $couple->partner_b_id])
                ->where('couple_id', $couple->id)
                ->update(['couple_id' => null]);

            // Hard delete — removes the unique-constraint row permanently
            $couple->delete();
        });

        return response()->json(['status' => 'success', 'message' => 'Couple record purged.']);
    }

    // ─── Module 3: Media Analytics ────────────────────────────────────────────

    /**
     * Media stats grouped by type and encryption.
     * Note: plain count() queries are safe on Postgres — NO lockForUpdate().
     */
    public function getMediaStats(): JsonResponse
    {
        // Per-type counts (safe Postgres aggregate)
        $byType = DB::select("
            SELECT type, COUNT(*) AS total, 
                   SUM(CASE WHEN is_encrypted THEN 1 ELSE 0 END) AS encrypted
            FROM moments
            GROUP BY type
        ");

        $totalMoments = Moment::count();
        $totalEncrypted = Moment::where('is_encrypted', true)->count();

        // Recent encrypted moments (last 20) for the toggleable list
        $recentEncrypted = Moment::where('is_encrypted', true)
            ->select(['id', 'type', 'couple_id', 'created_at'])
            ->latest()
            ->limit(20)
            ->get();

        // Daily upload volume for the last 30 days
        $dailyVolume = DB::select("
            SELECT DATE(created_at) AS day, COUNT(*) AS uploads
            FROM moments
            WHERE created_at >= NOW() - INTERVAL '30 days'
            GROUP BY DATE(created_at)
            ORDER BY day ASC
        ");

        return response()->json([
            'status' => 'success',
            'data' => [
                'by_type' => $byType,
                'total' => $totalMoments,
                'total_encrypted' => $totalEncrypted,
                'recent_encrypted' => $recentEncrypted,
                'daily_volume' => $dailyVolume,
            ],
        ]);
    }

    // ─── Module 4: Engagement Metrics ─────────────────────────────────────────

    /**
     * Engagement metrics: ping counts, pings-per-couple, social battery avg.
     */
    public function getEngagementMetrics(): JsonResponse
    {
        // Total ping count — no lockForUpdate
        $totalPings = Ping::count();

        // Top couples by ping volume
        $topCouples = DB::select("
            SELECT u.couple_id, COUNT(p.id) AS pings
            FROM pings p
            JOIN users u ON u.id = p.sender_id
            WHERE u.couple_id IS NOT NULL
            GROUP BY u.couple_id
            ORDER BY pings DESC
            LIMIT 10
        ");

        // Pings per day for the last 30 days (heatmap data)
        $dailyPings = DB::select("
            SELECT DATE(created_at) AS day, COUNT(*) AS pings
            FROM pings
            WHERE created_at >= NOW() - INTERVAL '30 days'
            GROUP BY DATE(created_at)
            ORDER BY day ASC
        ");

        // Hourly heatmap across the last 30 days
        $hourlyHeatmap = DB::select("
            SELECT EXTRACT(DOW FROM created_at)::int AS dow,
                   EXTRACT(HOUR FROM created_at)::int AS hour,
                   COUNT(*) AS pings
            FROM pings
            WHERE created_at >= NOW() - INTERVAL '30 days'
            GROUP BY dow, hour
            ORDER BY dow, hour
        ");

        // Average social_battery — column may not exist; handle gracefully
        $avgBattery = null;
        try {
            $result = DB::selectOne("SELECT AVG(social_battery) AS avg FROM users WHERE social_battery IS NOT NULL");
            $avgBattery = $result ? round((float) $result->avg, 1) : null;
        } catch (\Throwable) {
            // Column doesn't exist yet — return null safely
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'total_pings' => $totalPings,
                'top_couples' => $topCouples,
                'daily_pings' => $dailyPings,
                'hourly_heatmap' => $hourlyHeatmap,
                'avg_social_battery' => $avgBattery,
            ],
        ]);
    }

    // ─── Module 5: Infrastructure Health ─────────────────────────────────────

    /**
     * Deep health-check: DB connectivity, core table existence, R2 bucket.
     */
    public function getInfraHealth(): JsonResponse
    {
        $checks = [];

        // 1 — Database connectivity
        try {
            DB::select('SELECT 1');
            $checks['database'] = ['status' => 'ok', 'message' => 'Connected'];
        } catch (\Throwable $e) {
            $checks['database'] = ['status' => 'error', 'message' => $e->getMessage()];
        }

        // 2 — Core table existence
        $coreTables = ['users', 'couples', 'moments', 'pings', 'otps', 'personal_access_tokens'];
        foreach ($coreTables as $table) {
            try {
                DB::select("SELECT 1 FROM {$table} LIMIT 1");
                $checks["table_{$table}"] = ['status' => 'ok', 'message' => 'Exists'];
            } catch (\Throwable $e) {
                $checks["table_{$table}"] = ['status' => 'error', 'message' => 'Missing or inaccessible'];
            }
        }

        // 3 — Cloudflare R2 bucket accessibility
        try {
            // Storage::disk('s3') uses path-style via AWS_USE_PATH_STYLE_ENDPOINT=true
            Storage::disk('s3')->exists('.healthcheck');
            $checks['r2_storage'] = ['status' => 'ok', 'message' => 'Bucket reachable'];
        } catch (\Throwable $e) {
            $checks['r2_storage'] = ['status' => 'error', 'message' => $e->getMessage()];
        }

        $allOk = collect($checks)->every(fn($c) => $c['status'] === 'ok');

        return response()->json([
            'status' => $allOk ? 'ok' : 'degraded',
            'timestamp' => date('c'),
            'php_version' => PHP_VERSION,
            'environment' => app()->environment(),
            'checks' => $checks,
        ]);
    }


    /**
     * Dashboard overview aggregates (no lockForUpdate on any count).
     */
    public function analytics(): JsonResponse
    {
        $usersCount   = User::count();
        $couplesCount = Couple::count();
        $momentsCount = Moment::count();
        $imageMoments = Moment::where('type', 'image')->count();
        $audioMoments = Moment::where('type', 'audio')->count();
        $encryptedMoments = Moment::where('is_encrypted', true)->count();
        $totalPings = Ping::count();

        return response()->json([
            'status' => 'success',
            'data' => [
                'users_total' => $usersCount,
                'couples_total' => $couplesCount,
                'moments_total' => $momentsCount,
                'moments_by_type' => ['image' => $imageMoments, 'audio' => $audioMoments],
                'moments_encrypted' => $encryptedMoments,
                'total_pings' => $totalPings,
            ],
        ]);
    }
}
