<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property string $id
 * @property string $user_id
 * @property string $couple_id
 * @property string $type
 * @property string $media_url
 * @property string|null $caption_payload
 * @property bool $is_encrypted
 * @property \Illuminate\Support\Carbon|null $captured_at
 * @property \Illuminate\Support\Carbon $created_at
 */
class Moment extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'couple_id',
        'type',
        'media_url',
        'caption_payload',
        'is_encrypted',
        'captured_at',
    ];

    protected function casts(): array
    {
        return [
            'is_encrypted' => 'boolean',
            'captured_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function couple(): BelongsTo
    {
        return $this->belongsTo(Couple::class, 'couple_id');
    }
}
