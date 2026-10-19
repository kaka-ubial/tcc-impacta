<?php

namespace App\Services;

use App\Enums\DoacaoStatus;
use App\Enums\TransferenciaStatus;
use App\Models\Avaliacao;
use App\Models\Doacao;
use App\Models\ItemDoacao;
use App\Models\ItemTransferencia;
use App\Models\Transferencia;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

/**
 * Estatísticas agregadas (RF19) de uma instituição. Doações e transferências
 * entram no período pela data de criação (created_at); avaliações e itens
 * seguem as doações/transferências do período. A agregação por data é feita
 * em PHP para não depender de funções de data do banco (produção é pgsql,
 * testes rodam em sqlite).
 */
class EstatisticasInstituicaoService
{
    public const PERIODOS = ['30d', '90d', '12m', 'todo'];

    private const FINALIZADAS = [
        DoacaoStatus::Entregue,
        DoacaoStatus::Cancelado,
        DoacaoStatus::Recusada,
        DoacaoStatus::NaoEntregue,
    ];

    /**
     * @return array<string, mixed>
     */
    public function gerar(int $instituicaoId, string $periodo): array
    {
        $agora = CarbonImmutable::now();
        $inicio = match ($periodo) {
            '30d' => $agora->subDays(29)->startOfDay(),
            '90d' => $agora->subDays(89)->startOfDay(),
            '12m' => $agora->subMonths(11)->startOfMonth(),
            default => null,
        };

        return [
            'periodo' => $periodo,
            'doacoes' => $this->doacoes($instituicaoId, $inicio),
            'serie' => $this->serie($instituicaoId, $inicio, $agora, $periodo === '30d'),
            'doadores' => $this->doadores($instituicaoId, $inicio),
            'itens_por_categoria' => $this->itensPorCategoria($instituicaoId, $inicio),
            'transferencias' => $this->transferencias($instituicaoId, $inicio),
            'avaliacoes' => $this->avaliacoes($instituicaoId, $inicio),
        ];
    }

    private function doacoesDoPeriodo(int $instituicaoId, ?CarbonImmutable $inicio)
    {
        return Doacao::query()
            ->where('instituicao_id', $instituicaoId)
            ->when($inicio, fn ($q) => $q->where('created_at', '>=', $inicio));
    }

    /**
     * @return array<string, int|float|null>
     */
    private function doacoes(int $instituicaoId, ?CarbonImmutable $inicio): array
    {
        $porStatus = $this->doacoesDoPeriodo($instituicaoId, $inicio)
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $conta = fn (DoacaoStatus $s): int => (int) ($porStatus[$s->value] ?? 0);
        $finalizadas = array_sum(array_map($conta, self::FINALIZADAS));

        return [
            'total' => (int) $porStatus->sum(),
            'pendentes' => $conta(DoacaoStatus::Pendente),
            'confirmadas' => $conta(DoacaoStatus::Confirmada),
            'entregues' => $conta(DoacaoStatus::Entregue),
            'canceladas' => $conta(DoacaoStatus::Cancelado),
            'recusadas' => $conta(DoacaoStatus::Recusada),
            'nao_entregues' => $conta(DoacaoStatus::NaoEntregue),
            // entregues / doações já encerradas (exclui pendentes e confirmadas em andamento)
            'taxa_conclusao' => $finalizadas > 0
                ? round($conta(DoacaoStatus::Entregue) / $finalizadas * 100, 1)
                : null,
        ];
    }

    /**
     * @return list<array{rotulo: string, solicitadas: int, entregues: int, canceladas: int}>
     */
    private function serie(int $instituicaoId, ?CarbonImmutable $inicio, CarbonImmutable $agora, bool $diaria): array
    {
        $linhas = $this->doacoesDoPeriodo($instituicaoId, $inicio)->get(['status', 'created_at']);

        $formato = $diaria ? 'Y-m-d' : 'Y-m';
        $primeiro = $inicio ?? ($linhas->min('created_at')
            ? CarbonImmutable::parse($linhas->min('created_at'))
            : $agora);

        $buckets = [];
        for ($d = $diaria ? $primeiro->startOfDay() : $primeiro->startOfMonth();
            $d <= $agora;
            $d = $diaria ? $d->addDay() : $d->addMonth()) {
            $buckets[$d->format($formato)] = [
                'rotulo' => $d->format($diaria ? 'd/m' : 'm/Y'),
                'solicitadas' => 0,
                'entregues' => 0,
                'canceladas' => 0,
            ];
        }

        foreach ($linhas as $linha) {
            $chave = $linha->created_at->format($formato);
            if (! isset($buckets[$chave])) {
                continue;
            }
            $buckets[$chave]['solicitadas']++;
            if ($linha->status === DoacaoStatus::Entregue) {
                $buckets[$chave]['entregues']++;
            } elseif ($linha->status === DoacaoStatus::Cancelado) {
                $buckets[$chave]['canceladas']++;
            }
        }

        return array_values($buckets);
    }

    /**
     * Primeira vez: a 1ª doação entregue do doador para esta instituição caiu
     * no período. Recorrente: entregou no período, mas já tinha entregue
     * antes dele. No período "todo" não há "antes", então recorrente = 0.
     *
     * @return array{unicos: int, primeira_vez: int, recorrentes: int}
     */
    private function doadores(int $instituicaoId, ?CarbonImmutable $inicio): array
    {
        $doadoresNoPeriodo = $this->doacoesDoPeriodo($instituicaoId, $inicio)
            ->where('status', DoacaoStatus::Entregue)
            ->distinct()
            ->pluck('doador_id');

        $recorrentes = $inicio === null || $doadoresNoPeriodo->isEmpty()
            ? 0
            : Doacao::query()
                ->where('instituicao_id', $instituicaoId)
                ->where('status', DoacaoStatus::Entregue)
                ->where('created_at', '<', $inicio)
                ->whereIn('doador_id', $doadoresNoPeriodo)
                ->distinct()
                ->count('doador_id');

        return [
            'unicos' => $doadoresNoPeriodo->count(),
            'primeira_vez' => $doadoresNoPeriodo->count() - $recorrentes,
            'recorrentes' => $recorrentes,
        ];
    }

    /**
     * @return list<array{categoria: string, quantidade: int}>
     */
    private function itensPorCategoria(int $instituicaoId, ?CarbonImmutable $inicio): array
    {
        return ItemDoacao::query()
            ->join('categorias_itens', 'categorias_itens.id', '=', 'itens_doacao.categoria_id')
            ->whereIn('itens_doacao.doacao_id', $this->doacoesDoPeriodo($instituicaoId, $inicio)
                ->where('status', DoacaoStatus::Entregue)
                ->select('id'))
            ->groupBy('categorias_itens.nome')
            ->orderByDesc(DB::raw('sum(itens_doacao.quantidade)'))
            ->selectRaw('categorias_itens.nome as categoria, sum(itens_doacao.quantidade) as quantidade')
            ->get()
            ->map(fn ($l) => ['categoria' => $l->categoria, 'quantidade' => (int) $l->quantidade])
            ->all();
    }

    /**
     * @return array{enviadas: array<string, int>, recebidas: array<string, int>, itens_enviados: int, itens_recebidos: int}
     */
    private function transferencias(int $instituicaoId, ?CarbonImmutable $inicio): array
    {
        $resumo = fn (string $coluna): array => [
            'total' => 0,
            ...array_fill_keys(TransferenciaStatus::values(), 0),
            ...Transferencia::query()
                ->where($coluna, $instituicaoId)
                ->when($inicio, fn ($q) => $q->where('created_at', '>=', $inicio))
                ->selectRaw('status, count(*) as total')
                ->groupBy('status')
                ->pluck('total', 'status')
                ->map(fn ($n) => (int) $n)
                ->all(),
        ];

        $itens = fn (string $coluna): int => (int) ItemTransferencia::query()
            ->whereIn('transferencia_id', Transferencia::query()
                ->where($coluna, $instituicaoId)
                ->where('status', TransferenciaStatus::Entregue)
                ->when($inicio, fn ($q) => $q->where('created_at', '>=', $inicio))
                ->select('id'))
            ->sum('quantidade');

        $enviadas = $resumo('instituicao_origem_id');
        $recebidas = $resumo('instituicao_destino_id');
        $enviadas['total'] = array_sum(array_slice($enviadas, 1));
        $recebidas['total'] = array_sum(array_slice($recebidas, 1));

        return [
            'enviadas' => $enviadas,
            'recebidas' => $recebidas,
            'itens_enviados' => $itens('instituicao_origem_id'),
            'itens_recebidos' => $itens('instituicao_destino_id'),
        ];
    }

    /**
     * @return array{total: int, media: float|null, distribuicao: array<int, int>, percentual_avaliadas: float|null}
     */
    private function avaliacoes(int $instituicaoId, ?CarbonImmutable $inicio): array
    {
        $entregues = $this->doacoesDoPeriodo($instituicaoId, $inicio)->where('status', DoacaoStatus::Entregue);

        $porNota = Avaliacao::query()
            ->whereIn('doacao_id', (clone $entregues)->select('id'))
            ->selectRaw('nota, count(*) as total')
            ->groupBy('nota')
            ->pluck('total', 'nota');

        $total = (int) $porNota->sum();
        $soma = $porNota->map(fn ($n, $nota) => $n * $nota)->sum();
        $totalEntregues = (clone $entregues)->count();

        return [
            'total' => $total,
            'media' => $total > 0 ? round($soma / $total, 2) : null,
            'distribuicao' => collect(range(1, 5))->mapWithKeys(fn ($n) => [$n => (int) ($porNota[$n] ?? 0)])->all(),
            'percentual_avaliadas' => $totalEntregues > 0 ? round($total / $totalEntregues * 100, 1) : null,
        ];
    }
}
