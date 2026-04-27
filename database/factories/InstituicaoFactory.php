<?php

namespace Database\Factories;

use App\Models\Instituicao;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Instituicao>
 */
class InstituicaoFactory extends Factory
{
    public function definition(): array
    {
        return [
            'nome_fantasia' => fake('pt_BR')->company(),
            'razao_social' => fake('pt_BR')->company() . ' LTDA',
            'cnpj' => fake('pt_BR')->cnpj(),
            'telefone' => fake('pt_BR')->cellphoneNumber(),
            'endereco_completo' => fake('pt_BR')->streetAddress() . ' - ' .
                fake('pt_BR')->city() . '/' . fake('pt_BR')->stateAbbr() .
                ' - CEP ' . fake('pt_BR')->postcode(),
            'latitude' => fake()->latitude(-25.5, -25.3),
            'longitude' => fake()->longitude(-49.4, -49.2),
            'status' => 'approved',
        ];
    }
}
