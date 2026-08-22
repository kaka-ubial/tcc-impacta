<?php

namespace Database\Seeders;

use App\Models\Agendamento;
use App\Models\Avaliacao;
use App\Models\CategoriaItem;
use App\Models\Doacao;
use App\Models\Doador;
use App\Models\Instituicao;
use App\Models\ItemDoacao;
use App\Models\Necessidade;
use App\Models\Notificacao;
use Illuminate\Database\Seeder;

class DoacaoSeeder extends Seeder
{
    private const TOTAL = 60;

    /**
     * Distribuição dos 60 registros. As entregues dominam de propósito:
     * são as únicas que aparecem no portal de transparência.
     */
    private const DISTRIBUICAO = [
        'entregue'     => 34,
        'confirmada'   => 8,
        'pendente'     => 8,
        'cancelado'    => 4,
        'recusada'     => 3,
        'nao_entregue' => 3,
    ];

    private const DESCRICOES = [
        'Pacotes de arroz 5kg', 'Cobertores de solteiro', 'Kits de higiene pessoal',
        'Fraldas geriátricas', 'Livros infantis usados', 'Agasalhos de inverno',
        'Leite em pó integral', 'Material escolar variado', 'Calçados infantis',
        'Cestas básicas completas', 'Brinquedos educativos', 'Roupas de cama',
    ];

    public function run(): void
    {
        if (Doacao::exists()) {
            $this->command?->warn('DoacaoSeeder: já existem doações no banco, nada foi criado.');

            return;
        }

        $doadores = Doador::orderBy('usuario_id')->get();
        $instituicoes = Instituicao::where('status', 'approved')->orderBy('usuario_id')->get();
        $categorias = CategoriaItem::orderBy('id')->get();

        if ($doadores->isEmpty() || $instituicoes->isEmpty() || $categorias->isEmpty()) {
            $this->command?->error('DoacaoSeeder: rode DoadorSeeder, InstituicaoSeeder e CategoriaItemSeeder antes.');

            return;
        }

        $statuses = [];
        foreach (self::DISTRIBUICAO as $status => $quantidade) {
            $statuses = array_merge($statuses, array_fill(0, $quantidade, $status));
        }

        foreach (range(0, self::TOTAL - 1) as $i) {
            $status = $statuses[$i];
            $doador = $doadores[$i % $doadores->count()];
            $instituicao = $instituicoes[$i % $instituicoes->count()];

            $criadaEm = now()->subDays(180 - $i * 2)->setTime(9 + $i % 8, ($i * 7) % 60);
            $entregueEm = $status === 'entregue' ? $criadaEm->copy()->addDays(3 + $i % 9) : null;

            $doacao = Doacao::create([
                'doador_id'      => $doador->usuario_id,
                'instituicao_id' => $instituicao->usuario_id,
                'status'         => $status,
                'data_entrega'   => $entregueEm,
            ]);

            $doacao->forceFill([
                'created_at' => $criadaEm,
                'updated_at' => $entregueEm ?? $criadaEm,
            ])->save();

            $this->criarItens($doacao, $categorias, $instituicao, $i);

            Agendamento::create([
                'doacao_id'           => $doacao->id,
                'data_hora'           => ($entregueEm ?? $criadaEm->copy()->addDays(4))->copy()->setTime(14, 0),
                'tipo'                => $i % 3 === 0 ? 'coleta' : 'entrega',
                'endereco_referencia' => $i % 3 === 0 ? $doador->endereco_completo : null,
                'status'              => in_array($status, ['entregue', 'confirmada'], true) ? 'confirmado' : 'pendente',
            ]);

            if ($status === 'entregue' && $i % 2 === 0) {
                Avaliacao::create([
                    'usuario_id' => $instituicao->usuario_id,
                    'doacao_id'  => $doacao->id,
                    'nota'       => 3 + $i % 3,
                    'descricao'  => 'Doação recebida em ótimo estado. Obrigado pela contribuição!',
                ]);
            }

            $this->notificar($doacao, $doador, $instituicao, $status);
        }

        $this->command?->info('Doações: '.Doacao::count().' criadas ('.Doacao::where('status', 'entregue')->count().' entregues, visíveis no portal).');
    }

    private function criarItens(Doacao $doacao, $categorias, Instituicao $instituicao, int $i): void
    {
        $quantidadeItens = 1 + $i % 3;

        foreach (range(0, $quantidadeItens - 1) as $j) {
            $categoria = $categorias[($i + $j) % $categorias->count()];

            $necessidade = Necessidade::where('instituicao_id', $instituicao->usuario_id)
                ->where('categoria_id', $categoria->id)
                ->first();

            ItemDoacao::create([
                'doacao_id'     => $doacao->id,
                'necessidade_id' => $necessidade?->id,
                'categoria_id'  => $categoria->id,
                'descricao'     => self::DESCRICOES[($i + $j) % count(self::DESCRICOES)],
                'quantidade'    => 1 + ($i + $j) % 12,
            ]);
        }
    }

    private function notificar(Doacao $doacao, Doador $doador, Instituicao $instituicao, string $status): void
    {
        $mensagens = [
            'entregue'     => ['Doação concluída', $instituicao->nome_fantasia.' marcou a sua doação como entregue.'],
            'confirmada'   => ['Doação confirmada', $instituicao->nome_fantasia.' confirmou o recebimento agendado.'],
            'pendente'     => ['Doação registrada', 'Sua doação foi enviada para '.$instituicao->nome_fantasia.'.'],
            'cancelado'    => ['Doação cancelada', 'A doação para '.$instituicao->nome_fantasia.' foi cancelada.'],
            'recusada'     => ['Doação recusada', $instituicao->nome_fantasia.' não pôde aceitar esta doação.'],
            'nao_entregue' => ['Doação não entregue', $instituicao->nome_fantasia.' registrou que a doação não chegou.'],
        ];

        [$titulo, $mensagem] = $mensagens[$status];

        Notificacao::create([
            'usuario_id' => $doador->usuario_id,
            'titulo'     => $titulo,
            'mensagem'   => $mensagem,
            'lida'       => $doacao->id % 3 === 0,
        ]);
    }
}
