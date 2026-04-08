<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property string $id
 * @property string $partner_a_id
 * @property string $partner_b_id
 * @property string $status
 * @property \Illuminate\Support\Carbon|null $linked_at
 */
class Couple extends Model
{
    use HasUuids;

    protected $fillable = [
        'partner_a_id',
        'partner_b_id',
        'status',
        'linked_at',
    ];

    protected function casts(): array
    {
        return [
            'linked_at' => 'datetime',
        ];
    }

    public function partnerA(): BelongsTo
    {
        return $this->belongsTo(User::class, 'partner_a_id');
    }

    public function partnerB(): BelongsTo
    {
        return $this->belongsTo(User::class, 'partner_b_id');
    }

    public function moments(): HasMany
    {
        return $this->hasMany(Moment::class, 'couple_id');
    }
}
