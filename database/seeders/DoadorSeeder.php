<?php

namespace Database\Seeders;

use App\Models\Causa;
use App\Models\Doador;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DoadorSeeder extends Seeder
{
    private const TOTAL = 20;

    private const NOMES = [
        'Ana Beatriz Moreira', 'Bruno Carvalho Lima', 'Camila Souza Rocha',
        'Diego Fernandes Alves', 'Eduarda Pinto Ramos', 'Felipe Andrade Costa',
        'Gabriela Nunes Teixeira', 'Henrique Barbosa Dias', 'Isabela Cardoso Mendes',
        'João Pedro Vasconcelos', 'Karina Oliveira Prado', 'Lucas Martins Ferreira',
        'Mariana Duarte Campos', 'Nathan Ribeiro Gomes', 'Olívia Santana Freitas',
        'Paulo Henrique Correia', 'Queren Lopes Batista', 'Rafael Monteiro Pires',
        'Sofia Almeida Bastos', 'Thiago Nogueira Cunha',
    ];

    private const BAIRROS = [
        'Centro', 'Batel', 'Água Verde', 'Portão', 'Santa Felicidade',
        'Boa Vista', 'Cabral', 'Bigorrilho', 'Rebouças', 'Mercês',
    ];

    public function run(): void
    {
        $causas = Causa::pluck('id')->all();

        foreach (range(0, self::TOTAL - 1) as $i) {
            $nome = self::NOMES[$i];
            $email = 'doador'.($i + 1).'@impacta.test';
            $cpf = $this->cpfValido($i);

            $user = User::firstOrCreate(
                ['email' => $email],
                [
                    'password'     => Hash::make('senha_segura'),
                    'tipo_usuario' => 'doador',
                    'status'       => 'ativo',
                ],
            );

            if ($user->email_verified_at === null) {
                $user->forceFill(['email_verified_at' => now()])->save();
            }

            Doador::firstOrCreate(
                ['usuario_id' => $user->id],
                [
                    'nome_completo'           => $nome,
                    'cpf'                     => $cpf,
                    'telefone'                => sprintf('(41) 9%04d-%04d', 1000 + $i * 37, 2000 + $i * 53),
                    'endereco_completo'       => sprintf('Rua das Flores, %d - %s, Curitiba/PR', 100 + $i * 17, self::BAIRROS[$i % count(self::BAIRROS)]),
                    'pontuacao_gamificacao'   => $i * 35,
                    'exibir_em_transparencia' => $i % 5 < 2,
                    'latitude'                => -25.42 - ($i % 10) * 0.006,
                    'longitude'               => -49.27 - ($i % 10) * 0.005,
                ],
            );

            if ($causas !== []) {
                $escolhidas = [
                    $causas[$i % count($causas)],
                    $causas[($i + 3) % count($causas)],
                ];
                $user->causas()->syncWithoutDetaching(array_unique($escolhidas));
            }
        }

        $this->command?->info('Doadores: '.Doador::count().' no banco ('.Doador::where('exibir_em_transparencia', true)->count().' com opt-in de transparência).');
    }

    /**
     * Gera um CPF com dígitos verificadores válidos a partir de uma base
     * determinística, para o seeder poder rodar de novo sem colidir.
     */
    private function cpfValido(int $indice): string
    {
        $base = str_pad((string) (11122233 + $indice * 7717), 9, '0', STR_PAD_LEFT);
        $digitos = array_map('intval', str_split(substr($base, 0, 9)));

        foreach ([10, 11] as $peso) {
            $soma = 0;
            foreach ($digitos as $posicao => $digito) {
                $soma += $digito * ($peso - $posicao);
            }
            $resto = ($soma * 10) % 11;
            $digitos[] = $resto === 10 ? 0 : $resto;
        }

        $cpf = implode('', $digitos);

        return substr($cpf, 0, 3).'.'.substr($cpf, 3, 3).'.'.substr($cpf, 6, 3).'-'.substr($cpf, 9, 2);
    }
}
