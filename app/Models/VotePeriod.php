<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class VotePeriod extends Model
{
    use HasFactory;

    protected $fillable = [
        'semester_id',
        'title',
        'opens_at',
        'closes_at',
        'status',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'opens_at' => 'datetime',
            'closes_at' => 'datetime',
        ];
    }

    public function semester(): BelongsTo
    {
        return $this->belongsTo(Semester::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function categories(): HasMany
    {
        return $this->hasMany(VoteCategory::class)->orderBy('order_number');
    }

    public function activeCategories(): HasMany
    {
        return $this->hasMany(VoteCategory::class)->where('is_active', true)->orderBy('order_number');
    }

    public function votes(): HasMany
    {
        return $this->hasMany(Vote::class);
    }

    public function getComputedStatusAttribute(): string
    {
        if ($this->status === 'closed') {
            return 'closed';
        }

        $now = Carbon::now();

        if ($now->lt($this->opens_at)) {
            return 'not_started';
        }

        if ($now->betweenIncluded($this->opens_at, $this->closes_at)) {
            return 'ongoing';
        }

        return 'closed';
    }

    public function getStatusLabelAttribute(): string
    {
        return match ($this->computed_status) {
            'not_started' => 'Belum Dibuka',
            'ongoing' => 'Sedang Berjalan',
            'closed' => 'Sudah Ditutup',
            default => 'Belum Dibuka',
        };
    }

    public function isOngoing(): bool
    {
        return $this->computed_status === 'ongoing';
    }
}
