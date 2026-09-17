<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Concerns\HasTeams;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Traits\HasRoles;

/**
 * @property int $id
 * @property string $name
 * @property string|null $identity_number
 * @property string $email
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property string $user_type
 * @property string $status
 * @property Carbon|null $last_login_at
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property string|null $remember_token
 * @property int|null $current_team_id
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 * @property-read Team|null $currentTeam
 * @property-read Collection<int, Team> $ownedTeams
 * @property-read Collection<int, Membership> $teamMemberships
 * @property-read Collection<int, Team> $teams
 */
#[Fillable(['name', 'identity_number', 'email', 'password', 'current_team_id', 'user_type', 'status', 'last_login_at'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasRoles, HasTeams, Notifiable, SoftDeletes {
        HasTeams::teams insteadof HasRoles;
        HasRoles::teams as spatieTeams;
    }

    public function isAssistant(): bool
    {
        return $this->user_type === 'assistant';
    }

    public function isParticipant(): bool
    {
        return $this->user_type === 'participant';
    }

    public function assistantAssignments(): HasMany
    {
        return $this->hasMany(AssistantAssignment::class, 'assistant_id');
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(ParticipantEnrollment::class, 'participant_id');
    }

    public function assistantModuleParticipants(): HasMany
    {
        return $this->hasMany(AssistantModuleParticipant::class, 'assistant_id');
    }

    /**
     * Get all participant IDs guided by this assistant for a given module (or all modules).
     *
     * @return array<int>
     */
    public function getGuidedParticipantIdsForModule(?int $moduleId = null): array
    {
        $participantIds = collect();

        // 1. Explicit direct assignment in assistant_module_participants
        if (Schema::hasTable('assistant_module_participants')) {
            $directIds = AssistantModuleParticipant::query()
                ->where('assistant_id', $this->id)
                ->when($moduleId, fn ($q) => $q->where('module_id', $moduleId))
                ->pluck('participant_id');
            $participantIds = $participantIds->concat($directIds);
        }

        // 2. Schedule-based via weekly_schedules & practicum_schedules
        if (Schema::hasTable('weekly_schedule_assistant') && Schema::hasTable('weekly_schedule_group_member')) {
            $weeklyScheduleQuery = WeeklySchedule::query()
                ->whereHas('assistants', fn ($q) => $q->whereKey($this->id));

            if ($moduleId) {
                $weeklyScheduleIdsWithModule = PracticumSchedule::query()
                    ->where('module_id', $moduleId)
                    ->whereNotNull('weekly_schedule_id')
                    ->pluck('weekly_schedule_id');
                $weeklyScheduleQuery->whereIn('id', $weeklyScheduleIdsWithModule);
            }

            $weeklyScheduleIds = $weeklyScheduleQuery->pluck('id');

            if ($weeklyScheduleIds->isNotEmpty()) {
                $weeklyMemberIds = DB::table('weekly_schedule_group_member')
                    ->join('weekly_schedule_groups', 'weekly_schedule_group_member.weekly_schedule_group_id', '=', 'weekly_schedule_groups.id')
                    ->whereIn('weekly_schedule_groups.weekly_schedule_id', $weeklyScheduleIds)
                    ->pluck('weekly_schedule_group_member.participant_id');
                $participantIds = $participantIds->concat($weeklyMemberIds);
            }
        }

        // 3. Class/Group assignment via assistant_assignments & participant_enrollments
        if (Schema::hasTable('assistant_assignments')) {
            $assignmentQuery = AssistantAssignment::query()
                ->where('assistant_id', $this->id)
                ->where('status', 'active');

            if ($moduleId) {
                $classIdsWithModule = PracticumSchedule::query()
                    ->where('module_id', $moduleId)
                    ->whereNotNull('class_id')
                    ->pluck('class_id');
                $assignmentQuery->whereIn('class_id', $classIdsWithModule);
            }

            $assignments = $assignmentQuery->get();
            foreach ($assignments as $assignment) {
                $enrollmentQuery = ParticipantEnrollment::query()
                    ->where('class_id', $assignment->class_id)
                    ->where('status', 'active');

                if ($assignment->group_id) {
                    $enrollmentQuery->where('group_id', $assignment->group_id);
                }

                $participantIds = $participantIds->concat($enrollmentQuery->pluck('participant_id'));
            }
        }

        // 4. Feedback-based: praktikan who selected this assistant on this module
        if (Schema::hasTable('feedback')) {
            $feedbackIds = Feedback::query()
                ->where('target_assistant_id', $this->id)
                ->when($moduleId, fn ($q) => $q->where('module_id', $moduleId))
                ->pluck('sender_id');
            $participantIds = $participantIds->concat($feedbackIds);
        }

        // 5. Legacy group relationship fallback
        if (Schema::hasColumn('groups', 'assistant_id') && Schema::hasColumn('users', 'group_id')) {
            $legacyGroupIds = Group::where('assistant_id', $this->id)->pluck('id');
            if ($legacyGroupIds->isNotEmpty()) {
                $legacyUserIds = static::whereIn('group_id', $legacyGroupIds)->pluck('id');
                $participantIds = $participantIds->concat($legacyUserIds);
            }
        }

        return $participantIds->unique()->map(fn ($id) => (int) $id)->values()->all();
    }

    public function canGradeParticipant(int $participantId, int $moduleId): bool
    {
        return in_array($participantId, $this->getGuidedParticipantIdsForModule($moduleId), true);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
}
