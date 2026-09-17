<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GradeItem extends Model
{
    use HasFactory;

    protected $fillable = ['grade_id', 'submission_answer_id', 'score', 'max_score', 'feedback'];

    protected function casts(): array
    {
        return ['score' => 'decimal:2', 'max_score' => 'decimal:2'];
    }

    public function grade(): BelongsTo
    {
        return $this->belongsTo(Grade::class);
    }

    public function submissionAnswer(): BelongsTo
    {
        return $this->belongsTo(SubmissionAnswer::class);
    }
}
