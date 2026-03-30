<?php

namespace App\Actions\Auth;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use Illuminate\Support\Facades\Validator;

class ValidateRegisterStepOne 
{
    use PasswordValidationRules, ProfileValidationRules;

    public function __invoke(Request $request) {
        $rules = [
            'email' => $this->emailRules(),
            'password' => [...$this->passwordRules(), 'confirmed'],
        ];

        Validator::make($request->only([
            'email',
            'password',
            'password_confirmation',
        ]), $rules)->validate();

        return redirect()->back();
    }
}