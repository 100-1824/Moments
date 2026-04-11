<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Note extends Model
{
    use HasUuids;

    protected $fillable = [
        'couple_id',
        'author_id',
        'content',
        'revealed_at',
        'replaced_at',
    ];

    protected $casts = [
        'revealed_at' => 'datetime',
        'replaced_at' => 'datetime',
    ];

    public function couple(): BelongsTo
    {
        return $this->belongsTo(Couple::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    /** True when the recipient has already wiped the fog. */
    public function isRevealed(): bool
    {
        return $this->revealed_at !== null;
    }

    /** True when a newer note has replaced this one. */
    public function isActive(): bool
    {
        return $this->replaced_at === null;
    }
}
