<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class VoteCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'vote_period_id',
        'name',
        'description',
        'order_number',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'order_number' => 'integer',
        ];
    }

    public function votePeriod(): BelongsTo
    {
        return $this->belongsTo(VotePeriod::class);
    }

    public function votes(): HasMany
    {
        return $this->hasMany(Vote::class);
    }

    /**
     * Safely delete or deactivate the category.
     * If votes exist, deactivate to preserve voting history. Otherwise, hard delete.
     */
    public function safeDelete(): bool
    {
        if ($this->votes()->exists()) {
            $this->update(['is_active' => false]);

            return true;
        }

        return (bool) $this->delete();
    }
}
