<?php

namespace App\Services\GlobalControl;

use App\Models\AuditLog;
use App\Models\SystemSetting;
use Carbon\Carbon;

class RegistrationControlService
{
    public const SETTING_ENABLED = 'registration_is_enabled';

    public const SETTING_START_AT = 'registration_start_at';

    public const SETTING_END_AT = 'registration_end_at';

    /**
     * Determine if new participant registration is currently allowed.
     */
    public function isRegistrationAllowed(): bool
    {
        $isEnabled = (bool) SystemSetting::get(self::SETTING_ENABLED, true);

        if (! $isEnabled) {
            return false;
        }

        $startAt = SystemSetting::get(self::SETTING_START_AT);
        $endAt = SystemSetting::get(self::SETTING_END_AT);

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
     * Get complete registration state for control panel & views.
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
    public function getState(): array
    {
        $isEnabled = (bool) SystemSetting::get(self::SETTING_ENABLED, true);
        $startAtRaw = SystemSetting::get(self::SETTING_START_AT);
        $endAtRaw = SystemSetting::get(self::SETTING_END_AT);

        $startAt = $startAtRaw ? Carbon::parse($startAtRaw) : null;
        $endAt = $endAtRaw ? Carbon::parse($endAtRaw) : null;
        $now = Carbon::now();

        $status = 'closed';
        $statusLabel = 'Ditutup';

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
            'is_allowed' => $this->isRegistrationAllowed(),
            'is_enabled' => $isEnabled,
            'start_at' => $startAt?->toIso8601String(),
            'end_at' => $endAt?->toIso8601String(),
            'start_at_formatted' => $startAt?->translatedFormat('d M Y H:i'),
            'end_at_formatted' => $endAt?->translatedFormat('d M Y H:i'),
        ];
    }

    /**
     * Update registration configuration.
     */
    public function updateSettings(
        bool $isEnabled,
        ?Carbon $startAt,
        ?Carbon $endAt,
        int $userId
    ): array {
        $oldState = $this->getState();

        SystemSetting::set(self::SETTING_ENABLED, $isEnabled ? '1' : '0', 'boolean', $userId);
        SystemSetting::set(self::SETTING_START_AT, $startAt?->toDateTimeString(), 'datetime', $userId);
        SystemSetting::set(self::SETTING_END_AT, $endAt?->toDateTimeString(), 'datetime', $userId);

        $newState = $this->getState();

        AuditLog::record(
            'registration.settings_updated',
            'system_settings',
            $oldState,
            $newState,
            $userId
        );

        return $newState;
    }
}
