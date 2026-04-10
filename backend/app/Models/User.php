<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/**
 * @property string $id
 * @property string $name
 * @property string $email
 * @property string|null $phone
 * @property string $invite_code
 * @property string|null $couple_id
 * @property string $timezone
 * @property \Illuminate\Support\Carbon|null $last_seen_at
 */
class User extends Authenticatable
{
    use HasApiTokens;
    use HasFactory;
    use HasUuids;
    use Notifiable;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'invite_code',
        'couple_id',
        'timezone',
        'last_seen_at',
    ];

    protected $hidden = [
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'last_seen_at' => 'datetime',
        ];
    }

    public function couple(): BelongsTo
    {
        return $this->belongsTo(Couple::class, 'couple_id');
    }

    public function moments(): HasMany
    {
        return $this->hasMany(Moment::class, 'user_id');
    }

    public function sentPings(): HasMany
    {
        return $this->hasMany(Ping::class, 'sender_id');
    }

    public function receivedPings(): HasMany
    {
        return $this->hasMany(Ping::class, 'receiver_id');
    }

    /**
     * Resolve the partner user from the parent couple, if any.
     */
    public function partner(): ?User
    {
        if (! $this->couple_id) {
            return null;
        }

        $couple = $this->couple;

        if (! $couple) {
            return null;
        }

        $partnerId = $couple->partner_a_id === $this->id
            ? $couple->partner_b_id
            : $couple->partner_a_id;

        return self::query()->find($partnerId);
    }
}
