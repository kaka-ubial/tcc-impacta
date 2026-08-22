<?php

namespace Database\Seeders;

use App\Models\CategoriaItem;
use App\Models\Instituicao;
use App\Models\ItemTransferencia;
use App\Models\Transferencia;
use Illuminate\Database\Seeder;

class TransferenciaSeeder extends Seeder
{
    private const TOTAL = 12;

    private const STATUSES = [
        'entregue', 'entregue', 'entregue', 'entregue',
        'confirmada', 'confirmada',
        'pendente', 'pendente', 'pendente',
        'recusada', 'cancelada', 'nao_entregue',
    ];

    private const DESCRICOES = [
        'Excedente de cestas básicas', 'Cobertores extras do inverno',
        'Kits de higiene não utilizados', 'Roupas infantis em excesso',
        'Material escolar excedente', 'Alimentos não perecíveis',
    ];

    public function run(): void
    {
        if (Transferencia::exists()) {
            $this->command?->warn('TransferenciaSeeder: já existem transferências, nada foi criado.');

            return;
        }

        $instituicoes = Instituicao::where('status', 'approved')->orderBy('usuario_id')->get();
        $categorias = CategoriaItem::orderBy('id')->get();

        if ($instituicoes->count() < 2 || $categorias->isEmpty()) {
            $this->command?->error('TransferenciaSeeder: precisa de ao menos 2 instituições aprovadas e categorias.');

            return;
        }

        foreach (range(0, self::TOTAL - 1) as $i) {
            $origem = $instituicoes[$i % $instituicoes->count()];
            $destino = $instituicoes[($i + 1) % $instituicoes->count()];

            $transferencia = Transferencia::create([
                'instituicao_origem_id'  => $origem->usuario_id,
                'instituicao_destino_id' => $destino->usuario_id,
                'status'                 => self::STATUSES[$i],
                'data_hora'              => now()->subDays(90 - $i * 6)->setTime(10 + $i % 6, 0),
                'tipo'                   => $i % 2 === 0 ? 'coleta' : 'entrega',
                'endereco_referencia'    => $i % 2 === 0 ? $origem->endereco_completo : null,
            ]);

            foreach (range(0, $i % 2) as $j) {
                ItemTransferencia::create([
                    'transferencia_id' => $transferencia->id,
                    'categoria_id'     => $categorias[($i + $j) % $categorias->count()]->id,
                    'quantidade'       => 2 + ($i + $j) % 8,
                    'descricao'        => self::DESCRICOES[($i + $j) % count(self::DESCRICOES)],
                ]);
            }
        }

        $this->command?->info('Transferências: '.Transferencia::count().' criadas com '.ItemTransferencia::count().' itens.');
    }
}
