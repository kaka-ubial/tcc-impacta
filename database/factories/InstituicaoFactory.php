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
            'nome_fantasia' => fake()->company(),
            'razao_social' => fake()->company() . ' LTDA',
            'cnpj' => fake()->numerify('##.###.###/0001-##'),
            'telefone' => fake()->phoneNumber(),
            'endereco_completo' => fake()->address(),
            'latitude' => fake()->latitude(-25.5, -25.3),
            'longitude' => fake()->longitude(-49.4, -49.2),
            'status' => fake()->randomElement(['pending', 'approved', 'rejected']),
        ];
    }
}
