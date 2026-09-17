<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SystemSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'value',
        'value_type',
        'updated_by',
    ];

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Get setting value by key with optional default.
     */
    public static function get(string $key, mixed $default = null): mixed
    {
        $setting = static::where('key', $key)->first();

        if (! $setting || $setting->value === null) {
            return $default;
        }

        return match ($setting->value_type) {
            'boolean' => filter_var($setting->value, FILTER_VALIDATE_BOOLEAN),
            'number' => is_numeric($setting->value) ? (str_contains($setting->value, '.') ? (float) $setting->value : (int) $setting->value) : $setting->value,
            'json' => json_decode($setting->value, true),
            'datetime' => $setting->value ? Carbon::parse($setting->value) : null,
            default => $setting->value,
        };
    }

    /**
     * Set setting value by key.
     */
    public static function set(string $key, mixed $value, string $valueType = 'string', ?int $updatedBy = null): static
    {
        $rawValue = match ($valueType) {
            'boolean' => $value ? '1' : '0',
            'json' => json_encode($value),
            'datetime' => $value instanceof \DateTimeInterface ? $value->format('Y-m-d H:i:s') : (string) $value,
            default => (string) $value,
        };

        $userId = $updatedBy ?? auth()->id() ?? User::query()->value('id');
        if (! $userId) {
            $userId = User::factory()->create(['email' => 'system@physpracticum.test'])->id;
        }

        return static::updateOrCreate(
            ['key' => $key],
            [
                'value' => $rawValue,
                'value_type' => $valueType,
                'updated_by' => $userId,
            ]
        );
    }
}
