<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Answer extends Model
{
    use HasFactory;

    protected $fillable = [
        'question_id',
        'participant_id',
        'practicum_session_id',
        'preliminary_task_period_id',
        'content',
        'status',
        'last_saved_at',
        'submitted_at',
        'version',
    ];

    protected function casts(): array
    {
        return [
            'last_saved_at' => 'datetime',
            'submitted_at' => 'datetime',
        ];
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }

    public function participant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'participant_id');
    }
}
