<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PreliminaryTaskPeriod extends Model
{
    use HasFactory;

    protected $fillable = [
        'module_id',
        'class_id',
        'opens_at',
        'deadline_at',
        'state',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'opens_at' => 'datetime',
            'deadline_at' => 'datetime',
        ];
    }

    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class);
    }

    public function practicumClass(): BelongsTo
    {
        return $this->belongsTo(PracticumClass::class, 'class_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function answers(): HasMany
    {
        return $this->hasMany(Answer::class, 'preliminary_task_period_id');
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(Submission::class, 'preliminary_task_period_id');
    }

    /**
     * Computed status based on opens_at, deadline_at, and server time.
     * Possible values: 'not_started', 'ongoing', 'expired'
     */
    public function getComputedStatusAttribute(): string
    {
        if ($this->state === 'closed') {
            return 'expired';
        }

        $now = Carbon::now();

        if ($now->lt($this->opens_at)) {
            return 'not_started';
        }

        if ($now->betweenIncluded($this->opens_at, $this->deadline_at)) {
            return 'ongoing';
        }

        return 'expired';
    }

    public function getStatusLabelAttribute(): string
    {
        return match ($this->computed_status) {
            'not_started' => 'Belum Mulai',
            'ongoing' => 'Sedang Berjalan',
            'expired' => 'Sudah Lewat',
            default => 'Belum Mulai',
        };
    }

    public function isOngoing(): bool
    {
        return $this->computed_status === 'ongoing';
    }
}
