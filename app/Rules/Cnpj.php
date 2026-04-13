<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Translation\PotentiallyTranslatedString;

class Cnpj implements ValidationRule
{
    /**
     * Run the validation rule.
     *
     * @param  Closure(string, ?string=): PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $cnpj = preg_replace('/\D/', '', $value);

        if (strlen($cnpj) !== 14) {
            $fail('CNPJ inválido');
            return;
        }

        if (preg_match('/(\d)\1{13}/', $cnpj)) {
            $fail('CNPJ inválido');
            return;
        }

        $tamanho = [12, 13];
        $multiplicadores = [
            [5,4,3,2,9,8,7,6,5,4,3,2],
            [6,5,4,3,2,9,8,7,6,5,4,3,2]
        ];

        for ($i = 0; $i < 2; $i++) {
            $soma = 0;

            for ($j = 0; $j < $tamanho[$i]; $j++) {
                $soma += $cnpj[$j] * $multiplicadores[$i][$j];
            }

            $resto = $soma % 11;
            $digito = $resto < 2 ? 0 : 11 - $resto;

            if ((int)$cnpj[$tamanho[$i]] !== $digito) {
                $fail('CNPJ inválido');
                return;
            }
        }
    }
}
