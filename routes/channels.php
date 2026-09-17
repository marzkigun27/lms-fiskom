<?php

use App\Models\PracticumClass;
use App\Models\PracticumSession;
use App\Models\User;
use App\Models\WeeklySchedule;
use Illuminate\Support\Facades\Broadcast;

$canAccessWeeklySchedule = function (User $user, int $weeklyScheduleId): bool {
    if ($user->user_type === 'admin' || $user->isAssistant()) {
        return true;
    }

    return WeeklySchedule::query()
        ->whereKey($weeklyScheduleId)
        ->where(function ($query) use ($user) {
            $query->whereHas('assistants', fn ($assistantQuery) => $assistantQuery->whereKey($user->id))
                ->orWhereHas('groups.members', fn ($participantQuery) => $participantQuery->whereKey($user->id));
        })
        ->exists();
};

Broadcast::channel('App.Models.User.{id}', function (User $user, int $id): bool {
    return $user->id === $id;
});

Broadcast::channel('test-channel', fn (): bool => true);

Broadcast::channel('practicum-control.{weeklyScheduleId}', function (User $user, int $weeklyScheduleId) use ($canAccessWeeklySchedule): bool {
    return $canAccessWeeklySchedule($user, $weeklyScheduleId);
});

Broadcast::channel('practicum.{sessionId}', function (User $user, $sessionId) use ($canAccessWeeklySchedule): array|false {
    $session = PracticumSession::query()->with('practicumSchedule')->find($sessionId);

    if (! $session || ! $session->practicumSchedule) {
        return false;
    }

    if ($user->user_type === 'admin' || $user->isAssistant()) {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'role' => $user->user_type,
        ];
    }

    $schedule = $session->practicumSchedule;
    $hasAccess = false;

    if ($schedule->weekly_schedule_id) {
        $hasAccess = $canAccessWeeklySchedule($user, $schedule->weekly_schedule_id);
    }

    if (! $hasAccess && $schedule->class_id) {
        $hasAccess = PracticumClass::query()
            ->whereKey($schedule->class_id)
            ->where(function ($query) use ($user) {
                $query->whereHas('assistants', fn ($assistantQuery) => $assistantQuery->whereKey($user->id))
                    ->orWhereHas('enrollments', fn ($enrollmentQuery) => $enrollmentQuery->where('participant_id', $user->id)->where('status', 'active'));
            })
            ->exists();
    }

    if (! $hasAccess) {
        return false;
    }

    return [
        'id' => $user->id,
        'name' => $user->name,
        'role' => $user->user_type,
    ];
});

Broadcast::channel('grading', function (User $user): bool {
    return $user->hasRole('assistant');
});
