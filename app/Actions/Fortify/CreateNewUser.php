<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Actions\UserTypes\UserTypeFactory;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    public function create(array $input): User
    {
        $rules = array_merge($this->profileRules(), [
            'password' => $this->passwordRules(),
        ]);

        Validator::make($input, $rules)->validate();

        return DB::transaction(function () use ($input) {

            $user = User::create([
                'email'        => $input['email'],
                'password'     => $input['password'],
                'tipo_usuario' => $input['tipo_usuario'],
                'status'       => $input['tipo_usuario'] === 'instituicao'
                    ? 'aguardando_validacao'
                    : 'ativo',
            ]);

            $handler = UserTypeFactory::make($input['tipo_usuario']);
            $handler->create($user, $input);

            return $user;
        });
    }
}
