<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Vote extends Model
{
    use HasFactory;

    protected $fillable = [
        'vote_period_id',
        'vote_category_id',
        'voter_id',
        'assistant_id',
    ];

    public function votePeriod(): BelongsTo
    {
        return $this->belongsTo(VotePeriod::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(VoteCategory::class, 'vote_category_id');
    }

    public function voter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'voter_id');
    }

    public function assistant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assistant_id');
    }
}
