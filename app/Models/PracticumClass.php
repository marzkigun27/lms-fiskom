<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class PracticumClass extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'classes';

    protected $fillable = ['semester_id', 'code', 'name', 'status'];

    public function semester(): BelongsTo
    {
        return $this->belongsTo(Semester::class);
    }

    public function groups(): HasMany
    {
        return $this->hasMany(Group::class, 'class_id');
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(ParticipantEnrollment::class, 'class_id');
    }

    public function assistantAssignments(): HasMany
    {
        return $this->hasMany(AssistantAssignment::class, 'class_id');
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(PracticumSchedule::class, 'class_id');
    }
}
