<?php

namespace Database\Seeders;

use App\Models\Agendamento;
use App\Models\CategoriaItem;
use App\Models\Causa;
use App\Models\Doacao;
use App\Models\Doador;
use App\Models\Instituicao;
use App\Models\ItemDoacao;
use App\Models\Notificacao;
use App\Models\PontuacaoEvento;
use App\Models\User;
use App\Services\GamificacaoService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Deixa uma conta de doador (padrão kau@doadora.com) a uma entrega de
 * conquistar um badge, para validar a gamificação. O cenário vem de
 * GAMIFICACAO_CENARIO (padrão: doador-constante):
 *
 *  - doador-constante     4 entregues + 1 confirmada        -> "Doador Constante"
 *  - impacto-local        5 entregues em 4 instituições
 *                         + 1 confirmada numa 5ª            -> "Impacto Local"
 *  - parceiro-das-causas  3 entregues em 2 causas
 *                         + 1 confirmada numa 3ª causa      -> "Parceiro das Causas"
 *  - referencia-solidaria 5 entregues + 695 pontos
 *                         + 1 confirmada                    -> "Referência Solidária"
 *
 * Em todos, o badge sai quando a instituição marca a doação confirmada como
 * entregue. Não faz parte do DatabaseSeeder. Rodar com:
 *   GAMIFICACAO_CENARIO=impacto-local php artisan db:seed --class=GamificacaoDemoSeeder
 * É re-executável: apaga as doações e badges dessa conta antes de recriar.
 */
class GamificacaoDemoSeeder extends Seeder
{
    private const EMAIL = 'kau@doadora.com';

    private const CENARIOS = ['doador-constante', 'impacto-local', 'parceiro-das-causas', 'referencia-solidaria'];

    public function run(GamificacaoService $gamificacao): void
    {
        $cenario = env('GAMIFICACAO_CENARIO', 'doador-constante');

        if (! in_array($cenario, self::CENARIOS, true)) {
            $this->command?->error('Cenário inválido. Use: '.implode(', ', self::CENARIOS));

            return;
        }

        (new BadgeSeeder)->run();

        $doador = User::where('email', self::EMAIL)->first()?->doador;

        if (! $doador) {
            $this->command?->error('Doador '.self::EMAIL.' não encontrado.');

            return;
        }

        $categorias = CategoriaItem::orderBy('id')->get();
        $instituicoes = Instituicao::where('status', 'approved')->with('usuario')->orderBy('usuario_id')->get();

        if ($instituicoes->count() < 5 || $categorias->isEmpty()) {
            $this->command?->error('Faltam instituições aprovadas ou categorias; rode os demais seeders antes.');

            return;
        }

        $this->resetar($doador);

        // [índice da instituição, dias atrás] de cada entregue; $pendente é o índice da que falta entregar.
        [$entregues, $pendente] = match ($cenario) {
            'impacto-local' => [[[0, 50], [1, 40], [2, 30], [3, 20], [0, 10]], 4],
            'parceiro-das-causas' => [[[0, 30], [1, 20], [0, 10]], 2],
            'referencia-solidaria' => [[[0, 50], [1, 40], [0, 30], [1, 20], [0, 10]], 0],
            default => [[[0, 40], [1, 30], [0, 20], [1, 10]], 0],
        };

        if ($cenario === 'parceiro-das-causas') {
            $this->atribuirCausas($instituicoes->take(3));
        }

        foreach ($entregues as $i => [$idx, $diasAtras]) {
            $doacao = $this->criarDoacao($doador, $instituicoes[$idx], 'entregue', $categorias, $i, now()->subDays($diasAtras));
            $gamificacao->registrarEntrega($doacao);
        }

        if ($cenario === 'referencia-solidaria') {
            $this->completarPontos($doador, 695);
        }

        $alvo = $instituicoes[$pendente];
        $this->criarDoacao($doador, $alvo, 'confirmada', $categorias, count($entregues), now()->subDays(3));

        $doador->refresh();

        $this->command?->info(sprintf(
            '[%s] %s: %d pontos, %d badge(s). Entregue a doação pendente como %s (%s).',
            $cenario,
            self::EMAIL,
            $doador->pontuacao_gamificacao,
            $doador->badges()->count(),
            $alvo->nome_fantasia,
            $alvo->usuario->email,
        ));
    }

    /**
     * Dá uma causa distinta a cada instituição que ainda não tem nenhuma.
     */
    private function atribuirCausas($instituicoes): void
    {
        $causas = Causa::orderBy('id')->pluck('id');

        foreach ($instituicoes->values() as $i => $instituicao) {
            if ($instituicao->causas()->doesntExist()) {
                $instituicao->usuario->causas()->attach($causas[$i]);
            }
        }
    }

    /**
     * Acrescenta um evento avulso para o total chegar a $alvo pontos.
     */
    private function completarPontos(Doador $doador, int $alvo): void
    {
        $doador->refresh();

        PontuacaoEvento::create([
            'doador_id' => $doador->usuario_id,
            'doacao_id' => $doador->doacoes()->value('id'),
            'tipo' => 'ajuste_demo',
            'pontos' => $alvo - $doador->pontuacao_gamificacao,
        ]);

        $doador->update(['pontuacao_gamificacao' => $alvo]);
    }

    private function resetar(Doador $doador): void
    {
        DB::transaction(function () use ($doador) {
            $doador->doacoes()->delete();
            $doador->badges()->detach();
            $doador->update(['pontuacao_gamificacao' => 0]);
            Notificacao::where('usuario_id', $doador->usuario_id)->where('titulo', 'Nova conquista!')->delete();
        });
    }

    private function criarDoacao(Doador $doador, Instituicao $instituicao, string $status, $categorias, int $i, $criadaEm): Doacao
    {
        $entregueEm = $status === 'entregue' ? $criadaEm->copy()->addDays(2) : null;

        $doacao = Doacao::create([
            'doador_id' => $doador->usuario_id,
            'instituicao_id' => $instituicao->usuario_id,
            'status' => $status,
            'data_entrega' => $entregueEm,
        ]);

        $doacao->forceFill(['created_at' => $criadaEm, 'updated_at' => $entregueEm ?? $criadaEm])->save();

        ItemDoacao::create([
            'doacao_id' => $doacao->id,
            'categoria_id' => $categorias[$i % $categorias->count()]->id,
            'descricao' => 'Doação de demonstração',
            'quantidade' => 2 + $i,
        ]);

        Agendamento::create([
            'doacao_id' => $doacao->id,
            'data_hora' => ($entregueEm ?? now()->addDay())->copy()->setTime(14, 0),
            'tipo' => 'entrega',
            'endereco_referencia' => null,
            'status' => 'confirmado',
        ]);

        return $doacao;
    }
}
