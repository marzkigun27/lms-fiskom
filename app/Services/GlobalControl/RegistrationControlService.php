<?php

namespace App\Services\GlobalControl;

use App\Models\AuditLog;
use App\Models\PracticumClass;
use App\Models\Semester;
use App\Models\SystemSetting;
use App\Models\WeeklySchedule;
use Carbon\Carbon;

class RegistrationControlService
{
    // Legacy generic settings (used as default/fallback for participant)
    public const SETTING_ENABLED = 'registration_is_enabled';

    public const SETTING_START_AT = 'registration_start_at';

    public const SETTING_END_AT = 'registration_end_at';

    // Role-specific settings
    public const SETTING_PARTICIPANT_ENABLED = 'registration_participant_is_enabled';

    public const SETTING_PARTICIPANT_START_AT = 'registration_participant_start_at';

    public const SETTING_PARTICIPANT_END_AT = 'registration_participant_end_at';

    public const SETTING_ASSISTANT_ENABLED = 'registration_assistant_is_enabled';

    public const SETTING_ASSISTANT_START_AT = 'registration_assistant_start_at';

    public const SETTING_ASSISTANT_END_AT = 'registration_assistant_end_at';

    /**
     * Determine if registration is currently allowed for the given role.
     */
    public function isRegistrationAllowed(string $role = 'participant'): bool
    {
        $role = $this->normalizeRole($role);

        $enabledKey = $role === 'assistant'
            ? self::SETTING_ASSISTANT_ENABLED
            : (SystemSetting::where('key', self::SETTING_PARTICIPANT_ENABLED)->exists()
                ? self::SETTING_PARTICIPANT_ENABLED
                : self::SETTING_ENABLED);

        $startKey = $role === 'assistant'
            ? self::SETTING_ASSISTANT_START_AT
            : (SystemSetting::where('key', self::SETTING_PARTICIPANT_START_AT)->exists()
                ? self::SETTING_PARTICIPANT_START_AT
                : self::SETTING_START_AT);

        $endKey = $role === 'assistant'
            ? self::SETTING_ASSISTANT_END_AT
            : (SystemSetting::where('key', self::SETTING_PARTICIPANT_END_AT)->exists()
                ? self::SETTING_PARTICIPANT_END_AT
                : self::SETTING_END_AT);

        $isEnabled = (bool) SystemSetting::get($enabledKey, true);

        if (! $isEnabled) {
            return false;
        }

        $startAt = SystemSetting::get($startKey);
        $endAt = SystemSetting::get($endKey);

        if (! $startAt && ! $endAt) {
            return true;
        }

        $now = Carbon::now();

        if ($startAt && $now->lt(Carbon::parse($startAt))) {
            return false;
        }

        if ($endAt && $now->gt(Carbon::parse($endAt))) {
            return false;
        }

        return true;
    }

    /**
     * Get registration state for a specific role.
     *
     * @return array{
     *     status: 'not_started'|'open'|'closed',
     *     status_label: string,
     *     is_allowed: bool,
     *     is_enabled: bool,
     *     start_at: ?string,
     *     end_at: ?string,
     *     start_at_formatted: ?string,
     *     end_at_formatted: ?string
     * }
     */
    public function getRoleState(string $role): array
    {
        $role = $this->normalizeRole($role);

        $enabledKey = $role === 'assistant'
            ? self::SETTING_ASSISTANT_ENABLED
            : (SystemSetting::where('key', self::SETTING_PARTICIPANT_ENABLED)->exists()
                ? self::SETTING_PARTICIPANT_ENABLED
                : self::SETTING_ENABLED);

        $startKey = $role === 'assistant'
            ? self::SETTING_ASSISTANT_START_AT
            : (SystemSetting::where('key', self::SETTING_PARTICIPANT_START_AT)->exists()
                ? self::SETTING_PARTICIPANT_START_AT
                : self::SETTING_START_AT);

        $endKey = $role === 'assistant'
            ? self::SETTING_ASSISTANT_END_AT
            : (SystemSetting::where('key', self::SETTING_PARTICIPANT_END_AT)->exists()
                ? self::SETTING_PARTICIPANT_END_AT
                : self::SETTING_END_AT);

        $isEnabled = (bool) SystemSetting::get($enabledKey, true);
        $startAtRaw = SystemSetting::get($startKey);
        $endAtRaw = SystemSetting::get($endKey);

        $startAt = $startAtRaw ? Carbon::parse($startAtRaw) : null;
        $endAt = $endAtRaw ? Carbon::parse($endAtRaw) : null;
        $now = Carbon::now();

        if (! $isEnabled) {
            $status = 'closed';
            $statusLabel = 'Ditutup (Manual)';
        } elseif ($startAt && $now->lt($startAt)) {
            $status = 'not_started';
            $statusLabel = 'Belum Dibuka';
        } elseif ($endAt && $now->gt($endAt)) {
            $status = 'closed';
            $statusLabel = 'Sudah Ditutup';
        } else {
            $status = 'open';
            $statusLabel = 'Dibuka';
        }

        return [
            'status' => $status,
            'status_label' => $statusLabel,
            'is_allowed' => $this->isRegistrationAllowed($role),
            'is_enabled' => $isEnabled,
            'start_at' => $startAt?->toIso8601String(),
            'end_at' => $endAt?->toIso8601String(),
            'start_at_formatted' => $startAt?->translatedFormat('d M Y H:i'),
            'end_at_formatted' => $endAt?->translatedFormat('d M Y H:i'),
        ];
    }

    /**
     * Get complete registration state for control panel & views.
     */
    public function getState(?string $role = null): array
    {
        if ($role !== null) {
            return $this->getRoleState($role);
        }

        $participantState = $this->getRoleState('participant');
        $assistantState = $this->getRoleState('assistant');

        return [
            'participant' => $participantState,
            'assistant' => $assistantState,

            // Root fallback for backwards compatibility
            'status' => $participantState['status'],
            'status_label' => $participantState['status_label'],
            'is_allowed' => $participantState['is_allowed'],
            'is_enabled' => $participantState['is_enabled'],
            'start_at' => $participantState['start_at'],
            'end_at' => $participantState['end_at'],
            'start_at_formatted' => $participantState['start_at_formatted'],
            'end_at_formatted' => $participantState['end_at_formatted'],

            'options' => $this->getRegistrationOptions(),
        ];
    }

    /**
     * Update registration configuration for a role.
     */
    public function updateSettings(
        string $role,
        bool $isEnabled,
        ?Carbon $startAt,
        ?Carbon $endAt,
        int $userId
    ): array {
        $role = $this->normalizeRole($role);
        $oldState = $this->getRoleState($role);

        $enabledKey = $role === 'assistant' ? self::SETTING_ASSISTANT_ENABLED : self::SETTING_PARTICIPANT_ENABLED;
        $startKey = $role === 'assistant' ? self::SETTING_ASSISTANT_START_AT : self::SETTING_PARTICIPANT_START_AT;
        $endKey = $role === 'assistant' ? self::SETTING_ASSISTANT_END_AT : self::SETTING_PARTICIPANT_END_AT;

        SystemSetting::set($enabledKey, $isEnabled ? '1' : '0', 'boolean', $userId);
        SystemSetting::set($startKey, $startAt?->toDateTimeString(), 'datetime', $userId);
        SystemSetting::set($endKey, $endAt?->toDateTimeString(), 'datetime', $userId);

        // Keep legacy keys synced when updating participant for backward compatibility
        if ($role === 'participant') {
            SystemSetting::set(self::SETTING_ENABLED, $isEnabled ? '1' : '0', 'boolean', $userId);
            SystemSetting::set(self::SETTING_START_AT, $startAt?->toDateTimeString(), 'datetime', $userId);
            SystemSetting::set(self::SETTING_END_AT, $endAt?->toDateTimeString(), 'datetime', $userId);
        }

        $newState = $this->getRoleState($role);

        AuditLog::record(
            "registration.{$role}_settings_updated",
            'system_settings',
            $oldState,
            $newState,
            $userId
        );

        return $this->getState();
    }

    /**
     * Get available classes and shifts with groups for participant registration.
     *
     * @return array{
     *     classes: array<int, array{id: int, code: string, name: string}>,
     *     shifts: array<int, array{id: int, day: string, shift: string, label: string, groups: array<int, array{id: int, number: int, name: string}>}>
     * }
     */
    public function getRegistrationOptions(): array
    {
        $activeSemester = Semester::where('is_active', true)->first();
        $semesterId = $activeSemester?->id;

        if (! $semesterId) {
            return [
                'classes' => [],
                'shifts' => [],
            ];
        }

        $classes = PracticumClass::where('semester_id', $semesterId)
            ->where('status', 'active')
            ->orderBy('code')
            ->get(['id', 'code', 'name'])
            ->toArray();

        $shifts = WeeklySchedule::where('semester_id', $semesterId)
            ->with(['groups:id,weekly_schedule_id,number'])
            ->get()
            ->map(function (WeeklySchedule $ws): array {
                $groups = $ws->groups->map(fn ($g): array => [
                    'id' => $g->id,
                    'number' => (int) $g->number,
                    'name' => 'Kelompok '.$g->number,
                ]);

                // If schedule has no groups initialized in db yet, provide default Kelompok 1 - 5
                if ($groups->isEmpty()) {
                    $groups = collect(range(1, 5))->map(fn (int $n): array => [
                        'id' => $n,
                        'number' => $n,
                        'name' => 'Kelompok '.$n,
                    ]);
                }

                return [
                    'id' => $ws->id,
                    'day' => $ws->day,
                    'shift' => $ws->shift,
                    'label' => "{$ws->day} - {$ws->shift}",
                    'groups' => $groups->values()->all(),
                ];
            })
            ->values()
            ->all();

        return [
            'classes' => $classes,
            'shifts' => $shifts,
        ];
    }

    private function normalizeRole(string $role): string
    {
        $role = strtolower(trim($role));
        if ($role === 'asisten' || $role === 'assistant') {
            return 'assistant';
        }

        return 'participant';
    }
}
