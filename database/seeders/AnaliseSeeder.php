<?php

namespace Database\Seeders;

use App\Models\Analise;
use App\Models\Instituicao;
use App\Models\User;
use Illuminate\Database\Seeder;

class AnaliseSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('tipo_usuario', 'admin')->first();

        if ($admin === null) {
            $this->command?->error('AnaliseSeeder: rode AdminUserSeeder antes.');

            return;
        }

        $observacoes = [
            'approved' => 'Documentação conferida e CNPJ ativo na Receita Federal.',
            'rejected' => 'CNPJ inativo e endereço não confere com o cadastro.',
            'pending'  => null,
        ];

        Instituicao::orderBy('usuario_id')->get()->each(function (Instituicao $instituicao) use ($admin, $observacoes) {
            Analise::firstOrCreate(
                [
                    'instituicao_id' => $instituicao->usuario_id,
                    'admin_id'       => $admin->id,
                ],
                [
                    'status'      => $instituicao->status,
                    'observacoes' => $observacoes[$instituicao->status] ?? null,
                ],
            );
        });

        $this->command?->info('Análises: '.Analise::count().' registros de parecer administrativo.');
    }
}
