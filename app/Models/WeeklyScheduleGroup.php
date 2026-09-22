<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class WeeklyScheduleGroup extends Model
{
    protected $fillable = ['weekly_schedule_id', 'number', 'code'];

    public function schedule(): BelongsTo
    {
        return $this->belongsTo(WeeklySchedule::class, 'weekly_schedule_id');
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'weekly_schedule_group_member', 'weekly_schedule_group_id', 'participant_id');
    }
}
