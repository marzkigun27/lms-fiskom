<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Feedback extends Model
{
    use HasFactory;

    protected $fillable = [
        'sender_id',
        'feedback_type',
        'target_assistant_id',
        'module_id',
        'rating',
        'content',
        'is_anonymous_to_target',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'is_anonymous_to_target' => 'boolean',
            'rating' => 'integer',
        ];
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function targetAssistant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'target_assistant_id');
    }

    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class);
    }
}
