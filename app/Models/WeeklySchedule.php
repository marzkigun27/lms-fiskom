<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WeeklySchedule extends Model
{
    protected $fillable = ['semester_id', 'day', 'shift'];

    public function semester(): BelongsTo
    {
        return $this->belongsTo(Semester::class);
    }

    public function assistants(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'weekly_schedule_assistant', 'weekly_schedule_id', 'assistant_id');
    }

    public function groups(): HasMany
    {
        return $this->hasMany(WeeklyScheduleGroup::class)->orderBy('number');
    }
}
