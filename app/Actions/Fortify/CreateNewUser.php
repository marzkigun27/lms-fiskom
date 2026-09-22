<?php

namespace App\Actions\Fortify;

use App\Actions\Teams\CreateTeam;
use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\Group;
use App\Models\ParticipantEnrollment;
use App\Models\Semester;
use App\Models\User;
use App\Models\WeeklySchedule;
use App\Models\WeeklyScheduleGroup;
use App\Services\GlobalControl\RegistrationControlService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Contracts\CreatesNewUsers;
use Spatie\Permission\Models\Role;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    public function __construct(private CreateTeam $createTeam)
    {
        //
    }

    /**
     * Validate and create a newly registered participant or assistant.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        $registerType = $input['register_type'] ?? 'participant';
        $userType = ($registerType === 'asisten' || $registerType === 'assistant') ? 'assistant' : 'participant';

        $regService = app(RegistrationControlService::class);

        if (! $regService->isRegistrationAllowed($userType)) {
            $roleLabel = $userType === 'assistant' ? 'asisten' : 'praktikan';
            throw ValidationException::withMessages([
                'email' => "Registrasi akun saat ini telah ditutup untuk {$roleLabel}.",
            ]);
        }

        $rules = [
            ...$this->profileRules(),
            'identity_number' => ['required', 'string', 'max:50', 'unique:users,identity_number'],
            'password' => $this->passwordRules(),
        ];

        if ($userType === 'participant') {
            $rules['class_id'] = ['required', 'integer', 'exists:classes,id'];
            $rules['weekly_schedule_id'] = ['required', 'integer', 'exists:weekly_schedules,id'];
            $rules['group_number'] = ['required', 'integer', 'min:1', 'max:255'];
        }

        Validator::make($input, $rules)->validate();

        return DB::transaction(function () use ($input, $userType): User {
            $user = User::create([
                'name' => $input['name'],
                'email' => $input['email'],
                'identity_number' => $input['identity_number'],
                'password' => $input['password'],
                'user_type' => $userType,
                'status' => 'active',
            ]);

            $user->assignRole(Role::findOrCreate($userType, 'web'));
            $this->createTeam->handle($user, $user->name."'s Team", isPersonal: true);

            // Auto-plotting for participant into weekly schedule and class enrollment
            if ($userType === 'participant') {
                $weeklyScheduleId = (int) $input['weekly_schedule_id'];
                $groupNumber = (int) $input['group_number'];
                $classId = (int) $input['class_id'];

                $weeklyGroup = WeeklyScheduleGroup::firstOrCreate([
                    'weekly_schedule_id' => $weeklyScheduleId,
                    'number' => $groupNumber,
                ]);

                $weeklyGroup->members()->syncWithoutDetaching([$user->id]);

                $weeklySchedule = WeeklySchedule::find($weeklyScheduleId);
                $semesterId = $weeklySchedule?->semester_id ?? Semester::where('is_active', true)->value('id');

                $classGroup = Group::where('class_id', $classId)
                    ->where(function ($q) use ($groupNumber, $weeklyGroup) {
                        if ($weeklyGroup->code) {
                            $q->where('code', $weeklyGroup->code)
                                ->orWhere('name', 'like', '%'.$weeklyGroup->code.'%');
                        }
                        $q->orWhere('code', (string) $groupNumber)
                            ->orWhere('code', 'K'.$groupNumber)
                            ->orWhere('name', 'like', '%Kelompok '.$groupNumber.'%');
                    })->first();

                ParticipantEnrollment::create([
                    'semester_id' => $semesterId,
                    'participant_id' => $user->id,
                    'class_id' => $classId,
                    'group_id' => $classGroup?->id,
                    'status' => 'active',
                    'enrolled_at' => now(),
                ]);
            }

            return $user;
        });
    }
}
