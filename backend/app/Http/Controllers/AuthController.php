<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\ConnectRequest;
use App\Http\Requests\RegisterRequest;
use App\Models\Couple;
use App\Models\User;
use App\Support\ApiResponse;
use App\Support\InviteCode;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AuthController extends Controller
{
    use ApiResponse;

    /**
     * Register a fresh user. Generates a unique invite code, creates a
     * Sanctum bearer token, and returns the bootstrap payload the
     * frontend needs to land in the dashboard.
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        try {
            $user = DB::transaction(function () use ($request): User {
                return User::firstOrCreate(['phone' => $request->string('phone')->trim()], [
                    'name'        => $request->string('name')->trim(),
                    'phone'       => $request->string('phone')->trim(),
                    'invite_code' => InviteCode::generateUnique(),
                    'timezone'    => $request->string('timezone')->trim(),
                ]);
            });

            $token = $user->createToken('moments-app')->plainTextToken;

            return $this->success([
                'user'  => $this->presentUser($user),
                'token' => $token,
            ], 201);
        } catch (\Throwable $e) {
            \Log::error('Registration failed: ' . get_class($e) . ': ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    /**
     * Connect the authenticated user to their partner via the partner's
     * invite code, atomically creating the `couples` row and back-filling
     * `couple_id` on both users.
     */
    public function connect(ConnectRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($user->couple_id) {
            return $this->error('You are already linked with a partner.', 409);
        }

        $partner = User::query()
            ->where('invite_code', $request->string('partner_invite_code'))
            ->first();

        if (! $partner) {
            return $this->error('No user found for that invite code.', 404);
        }

        if ($partner->id === $user->id) {
            return $this->error('You cannot link with yourself.', 422);
        }

        if ($partner->couple_id) {
            return $this->error('That user is already linked with someone else.', 409);
        }

        $couple = DB::transaction(function () use ($user, $partner): Couple {
            $couple = Couple::create([
                'partner_a_id' => $user->id,
                'partner_b_id' => $partner->id,
                'status'       => 'active',
                'linked_at'    => now(),
            ]);

            $user->forceFill(['couple_id' => $couple->id])->save();
            $partner->forceFill(['couple_id' => $couple->id])->save();

            return $couple;
        });

        return $this->success([
            'couple'  => [
                'id'         => $couple->id,
                'status'     => $couple->status,
                'linked_at'  => $couple->linked_at?->toIso8601String(),
            ],
            'user'    => $this->presentUser($user->refresh()),
            'partner' => $this->presentUser($partner->refresh()),
        ], 201);
    }

    /**
     * Return the authenticated user along with the partner snapshot the
     * client needs to render the dashboard.
     */
    public function me(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        // Touch presence so partners see an updated `last_seen_at`.
        $user->forceFill(['last_seen_at' => now()])->save();

        return $this->success([
            'user'    => $this->presentUser($user),
            'partner' => $this->presentUser($user->partner()),
        ]);
    }

    /**
     * Revoke the current bearer token. Stateless logout.
     */
    public function logout(Request $request): JsonResponse
    {
        /** @var \Laravel\Sanctum\PersonalAccessToken|null $token */
        $token = $request->user()?->currentAccessToken();
        $token?->delete();

        return $this->success(['revoked' => true]);
    }

    /**
     * @return array<string, mixed>|null
     */
    private function presentUser(?User $user): ?array
    {
        if (! $user) {
            return null;
        }

        return [
            'id'           => $user->id,
            'name'         => $user->name,
            'phone'        => $user->phone,
            'invite_code'  => $user->invite_code,
            'couple_id'    => $user->couple_id,
            'timezone'     => $user->timezone,
            'last_seen_at' => $user->last_seen_at?->toIso8601String(),
            'created_at'   => $user->created_at?->toIso8601String(),
        ];
    }
}
