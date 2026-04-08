<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\StoreMomentRequest;
use App\Http\Requests\SyncMomentsRequest;
use App\Models\Moment;
use App\Models\User;
use App\Support\ApiResponse;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\HttpException;

class MomentController extends Controller
{
    use ApiResponse;

    /**
     * Hard cap on uploads per partner per day.
     *
     * The cap is enforced against the user's *local* day window converted
     * to UTC, so a user in Asia/Tokyo and a user in America/Los_Angeles
     * each get exactly three moments per local calendar day.
     */
    public const DAILY_LIMIT = 3;

    /**
     * Store a new moment for the authenticated user.
     */
    public function store(StoreMomentRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        [$startUtc, $endUtc] = $this->dayWindowUtc($user);

        $moment = DB::transaction(function () use ($request, $user, $startUtc, $endUtc): Moment {
            $count = Moment::query()
                ->where('user_id', $user->id)
                ->whereBetween('created_at', [$startUtc, $endUtc])
                ->lockForUpdate()
                ->count();

            if ($count >= self::DAILY_LIMIT) {
                throw new HttpException(429, 'You have already shared all 3 moments for today.');
            }

            /** @var UploadedFile $file */
            $file = $request->file('media');
            $mediaUrl = $this->streamToS3($user, $file);

            return Moment::create([
                'user_id'         => $user->id,
                'couple_id'       => $user->couple_id,
                'type'            => $request->string('type')->toString(),
                'media_url'       => $mediaUrl,
                'caption_payload' => $request->input('caption_payload'),
                'is_encrypted'    => $request->boolean('is_encrypted'),
                'captured_at'     => $request->input('captured_at') ?: now(),
            ]);
        });

        $remaining = max(0, self::DAILY_LIMIT - $this->countToday($user, $startUtc, $endUtc));

        return $this->success([
            'moment'          => $this->presentMoment($moment),
            'remaining_today' => $remaining,
        ], 201);
    }

    /**
     * Return the partner's moments captured during the *authenticated*
     * user's local day. Defaults to today; pass `?date=YYYY-MM-DD` to
     * fetch a specific local day.
     */
    public function today(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $partner = $user->partner();

        if (! $partner) {
            return $this->success(['moments' => [], 'partner' => null]);
        }

        $date = $request->query('date');
        [$startUtc, $endUtc] = $this->dayWindowUtc($user, is_string($date) ? $date : null);

        $moments = Moment::query()
            ->where('user_id', $partner->id)
            ->whereBetween('created_at', [$startUtc, $endUtc])
            ->orderBy('created_at')
            ->get();

        return $this->success([
            'window' => [
                'start_utc' => $startUtc->toIso8601String(),
                'end_utc'   => $endUtc->toIso8601String(),
                'timezone'  => $user->timezone,
            ],
            'moments' => $moments->map(fn (Moment $m) => $this->presentMoment($m))->all(),
        ]);
    }

    /**
     * Drain a queue of offline-captured moments. The whole batch runs in
     * a single DB transaction and respects the per-day limit; offending
     * entries are rejected individually so the client can update its
     * outbox accordingly.
     */
    public function sync(SyncMomentsRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        [$startUtc, $endUtc] = $this->dayWindowUtc($user);

        $accepted = [];
        $rejected = [];

        DB::transaction(function () use ($request, $user, $startUtc, $endUtc, &$accepted, &$rejected): void {
            $existingCount = Moment::query()
                ->where('user_id', $user->id)
                ->whereBetween('created_at', [$startUtc, $endUtc])
                ->lockForUpdate()
                ->count();

            foreach ($request->input('moments', []) as $index => $payload) {
                /** @var UploadedFile|null $file */
                $file = $request->file("moments.$index.media");
                $clientId = $payload['client_id'] ?? null;

                if ($existingCount >= self::DAILY_LIMIT) {
                    $rejected[] = [
                        'client_id' => $clientId,
                        'reason'    => 'daily_limit_reached',
                    ];
                    continue;
                }

                if (! $file) {
                    $rejected[] = [
                        'client_id' => $clientId,
                        'reason'    => 'missing_media',
                    ];
                    continue;
                }

                $mediaUrl = $this->streamToS3($user, $file);

                $moment = Moment::create([
                    'user_id'         => $user->id,
                    'couple_id'       => $user->couple_id,
                    'type'            => $payload['type'],
                    'media_url'       => $mediaUrl,
                    'caption_payload' => $payload['caption_payload'] ?? null,
                    'is_encrypted'    => filter_var(
                        $payload['is_encrypted'] ?? false,
                        FILTER_VALIDATE_BOOLEAN
                    ),
                    'captured_at'     => $payload['captured_at'] ?? now(),
                ]);

                $existingCount++;
                $accepted[] = [
                    'client_id' => $clientId,
                    'moment'    => $this->presentMoment($moment),
                ];
            }
        });

        return $this->success([
            'accepted'        => $accepted,
            'rejected'        => $rejected,
            'remaining_today' => max(0, self::DAILY_LIMIT - $this->countToday($user, $startUtc, $endUtc)),
        ]);
    }

    /**
     * Compute the UTC start/end of the user's *local* calendar day.
     *
     * @return array{0: CarbonImmutable, 1: CarbonImmutable}
     */
    private function dayWindowUtc(User $user, ?string $localDate = null): array
    {
        $tz = $user->timezone ?: 'UTC';

        $local = $localDate
            ? CarbonImmutable::parse($localDate, $tz)->startOfDay()
            : CarbonImmutable::now($tz)->startOfDay();

        return [
            $local->utc(),
            $local->endOfDay()->utc(),
        ];
    }

    private function countToday(User $user, CarbonImmutable $startUtc, CarbonImmutable $endUtc): int
    {
        return Moment::query()
            ->where('user_id', $user->id)
            ->whereBetween('created_at', [$startUtc, $endUtc])
            ->count();
    }

    /**
     * Stream the uploaded file directly to S3 and return its URL.
     */
    private function streamToS3(User $user, UploadedFile $file): string
    {
        $extension = strtolower($file->getClientOriginalExtension() ?: $file->extension() ?: 'bin');
        $key = sprintf(
            'couples/%s/%s/%s.%s',
            $user->couple_id,
            $user->id,
            (string) Str::uuid(),
            $extension
        );

        $disk = Storage::disk('s3');
        $stream = fopen($file->getRealPath(), 'rb');

        try {
            $disk->put($key, $stream, [
                'ContentType' => $file->getMimeType() ?: 'application/octet-stream',
                'visibility'  => 'private',
            ]);
        } finally {
            if (is_resource($stream)) {
                fclose($stream);
            }
        }

        return $disk->url($key);
    }

    /**
     * @return array<string, mixed>
     */
    private function presentMoment(Moment $moment): array
    {
        return [
            'id'              => $moment->id,
            'user_id'         => $moment->user_id,
            'couple_id'       => $moment->couple_id,
            'type'            => $moment->type,
            'media_url'       => $moment->media_url,
            'caption_payload' => $moment->caption_payload,
            'is_encrypted'    => $moment->is_encrypted,
            'captured_at'     => $moment->captured_at?->toIso8601String(),
            'created_at'      => $moment->created_at?->toIso8601String(),
        ];
    }
}
