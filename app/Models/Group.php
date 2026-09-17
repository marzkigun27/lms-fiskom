<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Group extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['class_id', 'code', 'name', 'status'];

    public function class(): BelongsTo
    {
        return $this->belongsTo(PracticumClass::class, 'class_id');
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(ParticipantEnrollment::class);
    }

    public function assistantAssignments(): HasMany
    {
        return $this->hasMany(AssistantAssignment::class);
    }
}
