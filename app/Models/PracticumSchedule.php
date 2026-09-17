<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $module_id
 * @property int|null $class_id
 * @property int|null $weekly_schedule_id
 * @property string|null $room
 * @property Carbon $starts_at
 * @property Carbon $ends_at
 * @property string $status
 * @property int|null $started_by
 * @property int|null $completed_by
 * @property Carbon|null $actual_started_at
 * @property Carbon|null $actual_completed_at
 * @property-read Module $module
 * @property-read PracticumClass|null $class
 * @property-read WeeklySchedule|null $weeklySchedule
 */
class PracticumSchedule extends Model
{
    protected $fillable = [
        'module_id',
        'class_id',
        'weekly_schedule_id',
        'room',
        'starts_at',
        'ends_at',
        'status',
        'started_by',
        'completed_by',
        'actual_started_at',
        'actual_completed_at',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'actual_started_at' => 'datetime',
            'actual_completed_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Module, $this> */
    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class);
    }

    /** @return BelongsTo<PracticumClass, $this> */
    public function class(): BelongsTo
    {
        return $this->belongsTo(PracticumClass::class, 'class_id');
    }

    /** @return BelongsTo<WeeklySchedule, $this> */
    public function weeklySchedule(): BelongsTo
    {
        return $this->belongsTo(WeeklySchedule::class);
    }

    /** @return HasMany<PracticumSession, $this> */
    public function practicumSessions(): HasMany
    {
        return $this->hasMany(PracticumSession::class);
    }

    /** @return BelongsTo<User, $this> */
    public function startedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'started_by');
    }

    /** @return BelongsTo<User, $this> */
    public function completedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'completed_by');
    }
}
