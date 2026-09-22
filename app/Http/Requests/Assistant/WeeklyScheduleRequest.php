<?php

namespace App\Http\Requests\Assistant;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class WeeklyScheduleRequest extends FormRequest
{
    public const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

    public const SHIFTS = ['Shift 1 (06:30 - 09:30)', 'Shift 2 (09:30 - 12:30)', 'Shift 3 (12:30 - 15:30)', 'Shift 4 (15:30 - 18:30)'];

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $user = fn (string $role) => Rule::exists('users', 'id')->where('user_type', $role)->where('status', 'active')->whereNull('deleted_at');

        return [
            'semester_id' => ['required', 'integer', Rule::exists('semesters', 'id')],
            'day' => ['required', Rule::in(self::DAYS)],
            'shift' => ['required', Rule::in(self::SHIFTS)],
            'assistant_ids' => ['required', 'array', 'min:1', 'max:5'],
            'assistant_ids.*' => ['required', 'integer', 'distinct', $user('assistant')],
            'groups' => ['required', 'array', 'min:1', 'max:5'],
            'groups.*' => ['required', 'array:number,code,participant_ids'],
            'groups.*.number' => ['required', 'integer', 'between:1,5', 'distinct'],
            'groups.*.code' => ['nullable', 'string', 'max:50'],
            'groups.*.participant_ids' => ['required', 'array', 'min:3', 'max:4'],
            'groups.*.participant_ids.*' => ['required', 'integer', 'distinct', $user('participant')],
        ];
    }
}
