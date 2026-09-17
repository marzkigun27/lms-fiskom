<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuestionResource extends Model
{
    use HasFactory;

    protected $fillable = ['question_id', 'display_name', 'storage_path', 'mime_type', 'size_bytes', 'uploaded_by'];

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }

    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
