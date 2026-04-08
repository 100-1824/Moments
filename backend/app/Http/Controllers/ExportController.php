<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Couple;
use App\Models\Moment;
use App\Models\Ping;
use App\Models\User;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExportController extends Controller
{
    use ApiResponse;

    /**
     * Aggregate the authenticated user's data and their couple's history
     * into a JSON archive payload. The client is responsible for walking
     * the returned `media` URLs and downloading the actual binary
     * artifacts from S3.
     */
    public function archive(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $partner = $user->partner();
        $couple = $user->couple_id ? Couple::query()->find($user->couple_id) : null;

        $moments = $couple
            ? Moment::query()
                ->where('couple_id', $couple->id)
                ->orderBy('created_at')
                ->get()
            : collect();

        $pings = Ping::query()
            ->where(function ($query) use ($user, $partner): void {
                $query->where('sender_id', $user->id);
                if ($partner) {
                    $query->orWhere('receiver_id', $user->id)
                        ->orWhere('sender_id', $partner->id)
                        ->orWhere('receiver_id', $partner->id);
                }
            })
            ->orderBy('created_at')
            ->get();

        return $this->success([
            'generated_at' => now()->toIso8601String(),
            'user'         => $this->presentUser($user),
            'partner'      => $this->presentUser($partner),
            'couple'       => $couple ? [
                'id'        => $couple->id,
                'status'    => $couple->status,
                'linked_at' => $couple->linked_at?->toIso8601String(),
            ] : null,
            'moments' => $moments->map(fn (Moment $m): array => [
                'id'              => $m->id,
                'user_id'         => $m->user_id,
                'type'            => $m->type,
                'media_url'       => $m->media_url,
                'caption_payload' => $m->caption_payload,
                'is_encrypted'    => $m->is_encrypted,
                'captured_at'     => $m->captured_at?->toIso8601String(),
                'created_at'      => $m->created_at?->toIso8601String(),
            ])->all(),
            'pings' => $pings->map(fn (Ping $p): array => [
                'id'          => $p->id,
                'sender_id'   => $p->sender_id,
                'receiver_id' => $p->receiver_id,
                'created_at'  => $p->created_at?->toIso8601String(),
            ])->all(),
            'media' => $moments->pluck('media_url')->values()->all(),
        ]);
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
            'id'          => $user->id,
            'name'        => $user->name,
            'phone'       => $user->phone,
            'invite_code' => $user->invite_code,
            'timezone'    => $user->timezone,
            'created_at'  => $user->created_at?->toIso8601String(),
        ];
    }
}
