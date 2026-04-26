<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Instituicao;
use App\Models\Causa;
use Illuminate\Support\Facades\Hash;

class InstituicaoSeeder extends Seeder
{
    public function run(): void
    {
        $instituicoes = [
            [
                'nome_fantasia' => 'Lar Esperança Curitiba',
                'razao_social' => 'Associação Beneficente Lar Esperança LTDA',
                'cnpj' => '12.345.678/0001-90',
                'telefone' => '(41) 99812-3456',
                'endereco_completo' => 'Rua XV de Novembro, 1200 - Centro, Curitiba/PR - CEP 80060-000',
                'latitude' => -25.4284,
                'longitude' => -49.2733,
            ],
            [
                'nome_fantasia' => 'Instituto Vida Nova',
                'razao_social' => 'Instituto Vida Nova de Assistência Social LTDA',
                'cnpj' => '23.456.789/0001-01',
                'telefone' => '(41) 98765-4321',
                'endereco_completo' => 'Av. Sete de Setembro, 3456 - Batel, Curitiba/PR - CEP 80250-210',
                'latitude' => -25.4400,
                'longitude' => -49.2900,
            ],
            [
                'nome_fantasia' => 'Casa da Criança Feliz',
                'razao_social' => 'Associação Casa da Criança Feliz',
                'cnpj' => '34.567.890/0001-12',
                'telefone' => '(41) 99634-5678',
                'endereco_completo' => 'Rua Marechal Deodoro, 630 - Centro Cívico, Curitiba/PR - CEP 80020-320',
                'latitude' => -25.4195,
                'longitude' => -49.2680,
            ],
            [
                'nome_fantasia' => 'Abrigo São Francisco',
                'razao_social' => 'Abrigo São Francisco de Assis',
                'cnpj' => '45.678.901/0001-23',
                'telefone' => '(41) 98456-7890',
                'endereco_completo' => 'Rua Comendador Araújo, 478 - Batel, Curitiba/PR - CEP 80420-000',
                'latitude' => -25.4380,
                'longitude' => -49.2850,
            ],
            [
                'nome_fantasia' => 'ONG Mãos que Ajudam',
                'razao_social' => 'Organização Mãos que Ajudam',
                'cnpj' => '56.789.012/0001-34',
                'telefone' => '(41) 99123-4567',
                'endereco_completo' => 'Rua Visconde de Nácar, 1350 - Centro, Curitiba/PR - CEP 80410-201',
                'latitude' => -25.4350,
                'longitude' => -49.2700,
            ],
            [
                'nome_fantasia' => 'Recanto do Idoso',
                'razao_social' => 'Associação Recanto do Idoso Curitiba LTDA',
                'cnpj' => '67.890.123/0001-45',
                'telefone' => '(41) 98321-6543',
                'endereco_completo' => 'Rua Padre Anchieta, 2150 - Bigorrilho, Curitiba/PR - CEP 80730-000',
                'latitude' => -25.4420,
                'longitude' => -49.3000,
            ],
            [
                'nome_fantasia' => 'Projeto Renascer',
                'razao_social' => 'Instituto Projeto Renascer',
                'cnpj' => '78.901.234/0001-56',
                'telefone' => '(41) 99456-7891',
                'endereco_completo' => 'Av. República Argentina, 4750 - Novo Mundo, Curitiba/PR - CEP 81050-001',
                'latitude' => -25.4700,
                'longitude' => -49.2800,
            ],
            [
                'nome_fantasia' => 'Centro Comunitário Bom Pastor',
                'razao_social' => 'Centro Comunitário Bom Pastor de Curitiba',
                'cnpj' => '89.012.345/0001-67',
                'telefone' => '(41) 98567-8901',
                'endereco_completo' => 'Rua Engenheiro Rebouças, 1870 - Rebouças, Curitiba/PR - CEP 80215-100',
                'latitude' => -25.4450,
                'longitude' => -49.2650,
            ],
            [
                'nome_fantasia' => 'Ação Solidária PR',
                'razao_social' => 'Ação Solidária do Paraná',
                'cnpj' => '90.123.456/0001-78',
                'telefone' => '(41) 99678-1234',
                'endereco_completo' => 'Rua João Negrão, 280 - Centro, Curitiba/PR - CEP 80010-200',
                'latitude' => -25.4310,
                'longitude' => -49.2710,
            ],
            [
                'nome_fantasia' => 'Fundação Amparo e Caridade',
                'razao_social' => 'Fundação Amparo e Caridade do Sul',
                'cnpj' => '01.234.567/0001-89',
                'telefone' => '(41) 98789-0123',
                'endereco_completo' => 'Av. Iguaçu, 3020 - Água Verde, Curitiba/PR - CEP 80240-031',
                'latitude' => -25.4530,
                'longitude' => -49.2780,
            ],
        ];

        $causaIds = Causa::pluck('id')->toArray();

        foreach ($instituicoes as $inst) {
            $user = User::create([
                'email' => fake()->unique()->safeEmail(),
                'password' => Hash::make('Senha123'),
                'tipo_usuario' => 'instituicao',
                'status' => 'ativo',
                'email_verified_at' => now(),
            ]);

            $user->instituicao()->create(array_merge($inst, [
                'status' => 'approved',
            ]));

            if (!empty($causaIds)) {
                $randomCausas = collect($causaIds)->random(rand(1, min(3, count($causaIds))));
                $user->causas()->attach($randomCausas);
            }
        }
    }
}
