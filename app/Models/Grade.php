<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Grade extends Model
{
    use HasFactory;

    protected $fillable = [
        'submission_id',
        'participant_id',
        'module_id',
        'session_type',
        'score',
        'max_score',
        'component_scores',
        'feedback',
        'status',
        'graded_by',
        'graded_at',
        'published_at',
        'version',
    ];

    protected function casts(): array
    {
        return [
            'score' => 'decimal:2',
            'max_score' => 'decimal:2',
            'component_scores' => 'array',
            'graded_at' => 'datetime',
            'published_at' => 'datetime',
        ];
    }

    public function submission(): BelongsTo
    {
        return $this->belongsTo(Submission::class);
    }

    public function participant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'participant_id');
    }

    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class);
    }

    public function gradedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'graded_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(GradeItem::class);
    }

    public function histories(): HasMany
    {
        return $this->hasMany(GradeHistory::class);
    }
}
