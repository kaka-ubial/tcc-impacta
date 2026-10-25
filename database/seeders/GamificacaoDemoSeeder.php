<?php

namespace Database\Seeders;

use App\Models\Agendamento;
use App\Models\CategoriaItem;
use App\Models\Doacao;
use App\Models\Doador;
use App\Models\Instituicao;
use App\Models\ItemDoacao;
use App\Models\Notificacao;
use App\Models\User;
use App\Services\GamificacaoService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class GamificacaoDemoSeeder extends Seeder
{
    private const EMAIL = 'kau@doadora.com';

    public function run(GamificacaoService $gamificacao): void
    {
        (new BadgeSeeder)->run();

        $doador = User::where('email', self::EMAIL)->first()?->doador;

        if (! $doador) {
            $this->command?->error('Doador '.self::EMAIL.' não encontrado.');

            return;
        }

        [$a, $b] = $this->escolherInstituicoes();
        $categorias = CategoriaItem::orderBy('id')->get();

        if (! $a || ! $b || $categorias->isEmpty()) {
            $this->command?->error('Faltam instituições aprovadas ou categorias; rode os demais seeders antes.');

            return;
        }

        $this->resetar($doador);

        // Alterna A/B: só 2 instituições distintas e poucas causas, para que
        // a única conquista nova seja "Doador Constante" (5 entregas).
        $entregues = [[$a, 40], [$b, 30], [$a, 20], [$b, 10]];

        foreach ($entregues as $i => [$instituicao, $diasAtras]) {
            $doacao = $this->criarDoacao($doador, $instituicao, 'entregue', $categorias, $i, now()->subDays($diasAtras));
            $gamificacao->registrarEntrega($doacao);
        }

        $this->criarDoacao($doador, $a, 'confirmada', $categorias, 4, now()->subDays(3));

        $doador->refresh();

        $this->command?->info(sprintf(
            '%s: %d pontos, %d badge(s). Instituição para entregar a doação pendente: %s (%s).',
            self::EMAIL,
            $doador->pontuacao_gamificacao,
            $doador->badges()->count(),
            $a->nome_fantasia,
            $a->usuario->email,
        ));
    }

    /**
     * @return array{0: ?Instituicao, 1: ?Instituicao}
     */
    private function escolherInstituicoes(): array
    {
        $candidatas = Instituicao::where('status', 'approved')->with(['causas', 'usuario'])->orderBy('usuario_id')->get()
            ->values();

        foreach ($candidatas as $a) {
            foreach ($candidatas as $b) {
                if ($a->usuario_id === $b->usuario_id) {
                    continue;
                }

                if ($a->causas->pluck('id')->merge($b->causas->pluck('id'))->unique()->count() <= 2) {
                    return [$a, $b];
                }
            }
        }

        return [$candidatas->get(0), $candidatas->get(1)];
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
