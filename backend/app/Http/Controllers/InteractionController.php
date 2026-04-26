<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Ping;
use App\Models\User;
use App\Notifications\PingNotification;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpKernel\Exception\HttpException;

class InteractionController extends Controller
{
    use ApiResponse;

    /**
     * Send a haptic ping to the authenticated user's partner.
     *
     * Rate limited to one successful ping per minute per sender via
     * Laravel's RateLimiter facade so we don't get spam-loops between
     * partners.
     */
    public function ping(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $partner = $user->partner();

        if (! $partner) {
            return $this->error('You need to be linked with a partner before sending a ping.', 422);
        }

        $key = 'ping:' . $user->id;

        if (RateLimiter::tooManyAttempts($key, 1)) {
            $retryAfter = RateLimiter::availableIn($key);

            throw new HttpException(429, "Slow down — try again in {$retryAfter}s.");
        }

        RateLimiter::hit($key, 60);

        $ping = Ping::create([
            'sender_id'   => $user->id,
            'receiver_id' => $partner->id,
        ]);

        try {
            $partner->notify(new PingNotification($user));
        } catch (\Throwable) {
            // Non-fatal — ping saved, notification best-effort
        }

        return $this->success([
            'ping' => [
                'id'          => $ping->id,
                'sender_id'   => $ping->sender_id,
                'receiver_id' => $ping->receiver_id,
                'created_at'  => $ping->created_at?->toIso8601String(),
            ],
        ], 201);
    }
}
