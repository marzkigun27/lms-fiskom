<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $title
 * @property string $content
 * @property int $created_by
 * @property string $audience_type
 * @property int|null $audience_reference_id
 * @property Carbon|null $starts_at
 * @property Carbon|null $ends_at
 * @property Carbon|null $published_at
 * @property string $priority
 * @property Carbon $created_at
 * @property Carbon $updated_at
 * @property-read User $createdBy
 */
class Announcement extends Model
{
    protected $fillable = [
        'title',
        'content',
        'created_by',
        'audience_type',
        'audience_reference_id',
        'starts_at',
        'ends_at',
        'published_at',
        'priority',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'published_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Scope query to only active announcements.
     *
     * @param  Builder<$this>  $query
     * @return Builder<$this>
     */
    public function scopeActive(Builder $query): Builder
    {
        $now = Carbon::now();

        return $query->where(function (Builder $q) use ($now) {
            $q->whereNull('published_at')
                ->orWhere('published_at', '<=', $now);
        })->where(function (Builder $q) use ($now) {
            $q->whereNull('starts_at')
                ->orWhere('starts_at', '<=', $now);
        })->where(function (Builder $q) use ($now) {
            $q->whereNull('ends_at')
                ->orWhere('ends_at', '>=', $now);
        });
    }

    /**
     * Scope query for a specific user role.
     *
     * @param  Builder<$this>  $query
     * @return Builder<$this>
     */
    public function scopeForRole(Builder $query, string $role): Builder
    {
        return $query->where(function (Builder $q) use ($role) {
            $q->where('audience_type', 'all')
                ->orWhere(function (Builder $inner) use ($role) {
                    $inner->where('audience_type', 'role')
                        ->where('audience_reference_id', $role === 'assistant' ? 1 : 2);
                });
        });
    }
}
