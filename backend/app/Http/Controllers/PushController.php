<?php

namespace App\Http\Controllers;

use App\Models\PushSubscription;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PushController extends Controller
{
    use ApiResponse;

    /**
     * POST /push/subscribe
     *
     * Store a web push subscription from the frontend.
     * The subscription object contains endpoint, keys.p256dh, and keys.auth.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'endpoint' => ['required', 'string', 'url'],
            'publicKey' => ['required', 'string'],
            'authToken' => ['required', 'string'],
        ]);

        /** @var \App\Models\User $user */
        $user = $request->user();

        $endpoint = $request->string('endpoint')->toString();
        $existing = PushSubscription::query()
            ->where('endpoint', $endpoint)
            ->first();

        if ($existing && $existing->user_id !== $user->id) {
            return $this->error('That push subscription is already bound to another account.', 409);
        }

        // Update or create the subscription for the authenticated user only.
        PushSubscription::updateOrCreate(
            ['user_id' => $user->id, 'endpoint' => $endpoint],
            [
                'public_key' => $request->string('publicKey'),
                'auth_token' => $request->string('authToken'),
            ]
        );

        return $this->success([
            'message' => 'Push subscription saved',
        ], 201);
    }
}
