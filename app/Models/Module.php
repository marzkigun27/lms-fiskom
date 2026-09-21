<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Module extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'semester_id',
        'code',
        'title',
        'description',
        'order_number',
        'status',
        'published_at',
    ];

    protected static function booted(): void
    {
        static::deleted(function (Module $module): void {
            if (! $module->isForceDeleting() && $module->order_number > 0) {
                static::withoutEvents(function () use ($module): void {
                    static::withTrashed()
                        ->whereKey($module->id)
                        ->update([
                            'order_number' => -$module->id,
                            'code' => $module->code.'-deleted-'.$module->id,
                        ]);
                });
            }
        });

        static::restoring(function (Module $module): void {
            if ($module->order_number < 0) {
                $maxOrder = static::where('semester_id', $module->semester_id)
                    ->max('order_number') ?? 0;
                $module->order_number = max(1, $maxOrder + 1);
                $module->code = preg_replace('/-deleted-\d+$/', '', $module->code);
            }
        });
    }

    protected function casts(): array
    {
        return ['published_at' => 'datetime'];
    }

    public function semester(): BelongsTo
    {
        return $this->belongsTo(Semester::class);
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(PracticumSchedule::class);
    }

    public function questions(): HasMany
    {
        return $this->hasMany(Question::class);
    }

    public function preliminaryTaskPeriods(): HasMany
    {
        return $this->hasMany(PreliminaryTaskPeriod::class);
    }

    public function currentPreliminaryTaskPeriod(): HasOne
    {
        return $this->hasOne(PreliminaryTaskPeriod::class)->latestOfMany();
    }
}
