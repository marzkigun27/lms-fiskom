<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Submission extends Model
{
    use HasFactory;

    protected $fillable = [
        'participant_id',
        'practicum_session_id',
        'preliminary_task_period_id',
        'status',
        'submitted_at',
        'submitted_by',
        'reopened_at',
        'reopened_by',
        'reopen_reason',
        'attempt_number',
    ];

    protected function casts(): array
    {
        return [
            'submitted_at' => 'datetime',
            'reopened_at' => 'datetime',
        ];
    }

    public function participant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'participant_id');
    }

    public function practicumSession(): BelongsTo
    {
        return $this->belongsTo(PracticumSession::class);
    }

    public function preliminaryTaskPeriod(): BelongsTo
    {
        return $this->belongsTo(PreliminaryTaskPeriod::class);
    }

    public function submittedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function submissionAnswers(): HasMany
    {
        return $this->hasMany(SubmissionAnswer::class);
    }

    public function grade(): HasOne
    {
        return $this->hasOne(Grade::class);
    }
}
