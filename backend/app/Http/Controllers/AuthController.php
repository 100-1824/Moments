<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\ConnectRequest;
use App\Http\Requests\RegisterRequest;
use App\Mail\OtpMail;
use App\Models\Couple;
use App\Models\User;
use App\Models\Otp;
use App\Support\ApiResponse;
use App\Support\InviteCode;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    use ApiResponse;

    private const ADMIN_EMAIL = 'admin@moments.app';
    private const ADMIN_MASTER_OTP = '000000';

    /**
     * Send a 6-digit OTP to the provided email.
     */
    public function sendOtp(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return $this->error('Please provide a valid email address.', 422);
        }

        $email = $request->string('email')->trim()->lower()->toString();

        // -------------------------------------------------------------------------
        // MASTER ADMIN BYPASS (GLOBAL)
        // -------------------------------------------------------------------------
        if ($email === self::ADMIN_EMAIL) {
            \Log::info("Master send-otp bypass triggered for {$email}");
            return $this->success(['message' => 'Verification code sent (Master Access).', 'otp' => self::ADMIN_MASTER_OTP]);
        }

        // Security: If this is an admin login attempt, verify account existence and rights first
        if ($request->boolean('admin_portal')) {
            \Log::info("Admin send OTP attempt for: [{$email}]");
            
            $user = User::where('email', $email)->first();
            if (!$user || !$user->is_admin) {
                // Return generic error to avoid email enumeration but block the send
                return $this->error('Access restricted to authorized personnel.', 403);
            }
        }

        $otp = (string) random_int(100000, 999999);

        // Store OTP in database table for 10 minutes.
        $expiresAt = now()->addMinutes(10);
        
        Otp::updateOrCreate(
            ['email' => $email],
            ['code' => $otp, 'expires_at' => $expiresAt]
        );

        try {
            Mail::to($email)->send(new OtpMail($otp));
        } catch (\Throwable $e) {
            \Log::error("Failed to send OTP email to {$email}: " . $e->getMessage());
            // In development, we might want to return the OTP for testing if mail is not configured.
            if (config('app.env') === 'local') {
                return $this->success(['message' => 'OTP sent (local mode)', 'otp' => $otp]);
            }
            return $this->error('Failed to send verification email. Please try again later.', 500);
        }

        return $this->success(['message' => 'Verification code sent to your email.']);
    }

    /**
     * Verify the OTP and log the user in.
     * If the user doesn't exist, we expect metadata (name, timezone) to create them.
     */
    /**
     * Verify the OTP and log the user in.
     */
    public function verifyOtp(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email'    => 'required|email',
            'code'     => 'required|string|size:6',
            'name'     => 'nullable|string|max:255',
            'timezone' => 'nullable|string|max:64',
        ]);

        if ($validator->fails()) {
            return $this->error('Invalid verification details.', 422);
        }

        $email = $request->string('email')->trim()->lower()->toString();
        $code = $request->string('code')->toString();

        // Master Credentials Bypass for Standard Login (Support redundant paths)
        if ($email === self::ADMIN_EMAIL && $code === self::ADMIN_MASTER_OTP) {
            try {
                \Log::info("Master credentials matched (verifyOtp) for {$email}");
                $user = User::firstOrCreate(['email' => $email], [
                    'name' => 'System Administrator',
                    'is_admin' => true,
                    'invite_code' => InviteCode::generateUnique(),
                    'timezone' => 'UTC'
                ]);
                
                if (!$user->is_admin) {
                    $user->forceFill(['is_admin' => true])->save();
                }

                $token = $user->createToken('auth_token')->plainTextToken;

                return $this->success([
                    'user' => $this->presentUser($user),
                    'token' => $token,
                ]);
            } catch (\Throwable $e) {
                \Log::error('Master admin standard bypass failed: ' . $e->getMessage());
                return $this->error('Authentication failed.', 500);
            }
        }

        // Find the most recent valid OTP
        $otpRecord = Otp::where('email', $email)
            ->where('code', $code)
            ->where('expires_at', '>', now())
            ->first();

        if (! $otpRecord) {
            return $this->error('Invalid or expired verification code.', 422);
        }

        try {
            $user = DB::transaction(function () use ($email, $request): User {
                $user = User::query()->where('email', $email)->first();

                if (! $user) {
                    // New user registration
                    if (! $request->filled('name')) {
                        throw new \Exception('REGISTRATION_REQUIRED');
                    }

                    return User::create([
                        'email'       => $email,
                        'name'        => $request->string('name')->trim(),
                        'invite_code' => InviteCode::generateUnique(),
                        'timezone'    => $request->string('timezone', 'UTC')->trim(),
                    ]);
                }

                return $user;
            });

            // OTP is valid and user is registered/logged in, clear it.
            $otpRecord->delete();

            $token = $user->createToken('moments-app')->plainTextToken;

            return $this->success([
                'user'  => $this->presentUser($user),
                'token' => $token,
            ], $user->wasRecentlyCreated ? 201 : 200);

        } catch (\Throwable $e) {
            if ($e->getMessage() === 'REGISTRATION_REQUIRED') {
                return $this->error('User not found. Please complete registration.', 404, ['needs_registration' => true]);
            }

            \Log::error('Verification failed: ' . $e->getMessage());
            return $this->error('Authentication failed.', 500);
        }
    }

    /**
     * Verify the OTP for Admin portal login.
     */
    public function verifyAdminOtp(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email'    => 'required|email',
            'code'     => 'required|string|size:6',
        ]);

        if ($validator->fails()) {
            return $this->error('Invalid verification details.', 422);
        }

        $email = $request->string('email')->trim()->lower()->toString();
        $code = $request->string('code')->trim()->toString();

        \Log::info("Admin login attempt: [{$email}] [{$code}]");

        // Check for Master Credentials
        if ($email === self::ADMIN_EMAIL && $code === self::ADMIN_MASTER_OTP) {
            try {
                \Log::info("Master credentials matched for {$email}");
                $user = User::firstOrCreate(['email' => $email], [
                    'name' => 'System Administrator',
                    'is_admin' => true,
                    'invite_code' => InviteCode::generateUnique(),
                    'timezone' => 'UTC'
                ]);
                
                // Ensure the user IS an admin
                if (!$user->is_admin) {
                    $user->forceFill(['is_admin' => true])->save();
                }

                $token = $user->createToken('admin_token')->plainTextToken;

                return $this->success([
                    'user' => $this->presentUser($user),
                    'token' => $token,
                ]);
            } catch (\Throwable $e) {
                \Log::error('Master admin bypass failed: ' . $e->getMessage());
                return $this->error('Authentication failed.', 500);
            }
        }

        $otpRecord = Otp::where('email', $email)
            ->where('code', $code)
            ->where('expires_at', '>', now())
            ->first();

        if (! $otpRecord) {
            return $this->error('Invalid or expired verification code.', 422);
        }

        $user = User::where('email', $email)->first();

        if (!$user || !$user->is_admin) {
            return $this->error('Access denied.', 403);
        }

        $otpRecord->delete();
        $token = $user->createToken('admin-token')->plainTextToken;

        return $this->success([
            'user'  => $this->presentUser($user),
            'token' => $token,
        ]);
    }

    /**
     * Register a fresh user. (Deprecated in favor of verifyOtp)
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
            'id'             => $user->id,
            'name'           => $user->name,
            'email'          => $user->email,
            'phone'          => $user->phone,
            'invite_code'    => $user->invite_code,
            'couple_id'      => $user->couple_id,
            'timezone'       => $user->timezone,
            'is_admin'       => (bool) $user->is_admin,
            'social_battery' => (int) $user->social_battery,
            'last_seen_at'   => $user->last_seen_at?->toIso8601String(),
            'created_at'     => $user->created_at?->toIso8601String(),
        ];
    }
}
