<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Question extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'module_id',
        'session_type',
        'description',
        'answer_type',
        'programming_language',
        'order_number',
        'is_required',
        'status',
        'created_by',
        'updated_by',
    ];

    protected static function booted(): void
    {
        static::deleted(function (Question $question): void {
            if (! $question->isForceDeleting() && $question->order_number > 0) {
                static::withoutEvents(function () use ($question): void {
                    static::withTrashed()
                        ->whereKey($question->id)
                        ->update(['order_number' => -$question->id]);
                });
            }
        });

        static::restoring(function (Question $question): void {
            if ($question->order_number < 0) {
                $maxOrder = static::where('module_id', $question->module_id)
                    ->where('session_type', $question->session_type)
                    ->max('order_number') ?? 0;
                $question->order_number = max(1, $maxOrder + 1);
            }
        });
    }

    protected function casts(): array
    {
        return [
            'is_required' => 'boolean',
        ];
    }

    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function resources(): HasMany
    {
        return $this->hasMany(QuestionResource::class);
    }

    public function answers(): HasMany
    {
        return $this->hasMany(Answer::class);
    }
}
