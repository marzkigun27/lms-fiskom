<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $practicum_schedule_id
 * @property string $session_type
 * @property int $order_number
 * @property string $state
 * @property int|null $planned_duration_minutes
 * @property Carbon|null $opened_at
 * @property Carbon|null $closed_at
 * @property Carbon|null $completed_at
 * @property int|null $opened_by
 * @property int|null $closed_by
 * @property int|null $completed_by
 * @property-read PracticumSchedule $practicumSchedule
 */
class PracticumSession extends Model
{
    protected $fillable = [
        'practicum_schedule_id',
        'session_type',
        'order_number',
        'state',
        'planned_duration_minutes',
        'opened_at',
        'closed_at',
        'completed_at',
        'opened_by',
        'closed_by',
        'completed_by',
    ];

    protected function casts(): array
    {
        return [
            'opened_at' => 'datetime',
            'closed_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function isActive(): bool
    {
        return $this->state === 'active';
    }

    /** @return BelongsTo<PracticumSchedule, $this> */
    public function practicumSchedule(): BelongsTo
    {
        return $this->belongsTo(PracticumSchedule::class);
    }

    /** @return BelongsTo<User, $this> */
    public function openedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'opened_by');
    }

    /** @return BelongsTo<User, $this> */
    public function closedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'closed_by');
    }

    /** @return BelongsTo<User, $this> */
    public function completedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'completed_by');
    }

    /** @param Builder<PracticumSession> $query */
    public function scopeActive(Builder $query): void
    {
        $query->where('state', 'active');
    }
}
