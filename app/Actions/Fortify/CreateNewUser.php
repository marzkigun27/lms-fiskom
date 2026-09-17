<?php

namespace App\Actions\Fortify;

use App\Actions\Teams\CreateTeam;
use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\User;
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
     * Validate and create a newly registered participant.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        $registerType = $input['register_type'] ?? 'participant';
        $userType = $registerType === 'asisten' ? 'assistant' : 'participant';

        if ($userType === 'participant' && ! app(RegistrationControlService::class)->isRegistrationAllowed()) {
            throw ValidationException::withMessages([
                'email' => 'Registrasi akun saat ini telah ditutup.',
            ]);
        }

        Validator::make($input, [
            ...$this->profileRules(),
            'identity_number' => ['required', 'string', 'max:50', 'unique:users,identity_number'],
            'password' => $this->passwordRules(),
        ])->validate();

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

            return $user;
        });
    }
}
