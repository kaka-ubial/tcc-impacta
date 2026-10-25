<?php

namespace App\Services;

use App\Enums\DoacaoStatus;
use App\Models\Badge;
use App\Models\Doacao;
use App\Models\Doador;
use App\Models\Notificacao;
use App\Models\PontuacaoEvento;
use Illuminate\Support\Facades\DB;

class GamificacaoService
{
    public const PONTOS_ENTREGA = 10;

    public const PONTOS_NOVA_INSTITUICAO = 5;

    public const PONTOS_NOVA_CAUSA = 5;

    public const REGRA_DOACOES = 'doacoes_entregues';

    public const REGRA_INSTITUICOES = 'instituicoes_distintas';

    public const REGRA_CAUSAS = 'causas_distintas';

    public const REGRA_PONTOS = 'pontos';

    /**
     * @return list<Badge>
     */
    public function registrarEntrega(Doacao $doacao, bool $notificar = true): array
    {
        if ($doacao->status !== DoacaoStatus::Entregue) {
            return [];
        }

        $doador = Doador::find($doacao->doador_id);

        if (! $doador) {
            return [];
        }

        return DB::transaction(function () use ($doacao, $doador, $notificar) {
            $jaProcessada = PontuacaoEvento::where('doacao_id', $doacao->id)
                ->where('tipo', PontuacaoEvento::ENTREGA)
                ->exists();

            if (! $jaProcessada) {
                $this->gravarEventos($doacao, $doador);
            }

            $doador->update([
                'pontuacao_gamificacao' => (int) PontuacaoEvento::where('doador_id', $doador->usuario_id)->sum('pontos'),
            ]);

            return $this->avaliarBadges($doador, $doacao->data_entrega ?? now(), $notificar);
        });
    }

    private function gravarEventos(Doacao $doacao, Doador $doador): void
    {
        $evento = fn (string $tipo, int $pontos, ?int $referenciaId = null) => PontuacaoEvento::create([
            'doador_id' => $doador->usuario_id,
            'doacao_id' => $doacao->id,
            'tipo' => $tipo,
            'referencia_id' => $referenciaId,
            'pontos' => $pontos,
        ]);

        $evento(PontuacaoEvento::ENTREGA, self::PONTOS_ENTREGA);

        $novaInstituicao = ! PontuacaoEvento::where('doador_id', $doador->usuario_id)
            ->where('tipo', PontuacaoEvento::BONUS_INSTITUICAO)
            ->where('referencia_id', $doacao->instituicao_id)
            ->exists();

        if ($novaInstituicao) {
            $evento(PontuacaoEvento::BONUS_INSTITUICAO, self::PONTOS_NOVA_INSTITUICAO, $doacao->instituicao_id);
        }

        $causaIds = $doacao->instituicao?->causas()->pluck('causas.id') ?? collect();

        foreach ($causaIds as $causaId) {
            $novaCausa = ! PontuacaoEvento::where('doador_id', $doador->usuario_id)
                ->where('tipo', PontuacaoEvento::BONUS_CAUSA)
                ->where('referencia_id', $causaId)
                ->exists();

            if ($novaCausa) {
                $evento(PontuacaoEvento::BONUS_CAUSA, self::PONTOS_NOVA_CAUSA, $causaId);
            }
        }
    }

    /**
     * @return list<Badge>
     */
    private function avaliarBadges(Doador $doador, $conquistadoEm, bool $notificar): array
    {
        $progresso = $this->progresso($doador);
        $jaTem = $doador->badges()->pluck('badges.id')->all();
        $novos = [];

        foreach (Badge::whereNotNull('regra')->get() as $badge) {
            if (in_array($badge->id, $jaTem, true)) {
                continue;
            }

            if (($progresso[$badge->regra] ?? 0) < $badge->limiar) {
                continue;
            }

            $doador->badges()->attach($badge->id, ['conquistado_em' => $conquistadoEm]);
            $novos[] = $badge;

            if ($notificar) {
                Notificacao::enviar(
                    $doador->usuario_id,
                    'Nova conquista!',
                    'Você ganhou o badge "'.$badge->nome.'".',
                    '/perfil'
                );
            }
        }

        return $novos;
    }

    /**
     * Contadores que alimentam as regras dos badges.
     *
     * @return array<string, int>
     */
    public function progresso(Doador $doador): array
    {
        $contar = fn (string $tipo) => PontuacaoEvento::where('doador_id', $doador->usuario_id)
            ->where('tipo', $tipo)
            ->count();

        return [
            self::REGRA_DOACOES => $contar(PontuacaoEvento::ENTREGA),
            self::REGRA_INSTITUICOES => $contar(PontuacaoEvento::BONUS_INSTITUICAO),
            self::REGRA_CAUSAS => $contar(PontuacaoEvento::BONUS_CAUSA),
            self::REGRA_PONTOS => (int) $doador->pontuacao_gamificacao,
        ];
    }

    /**
     * Catálogo completo com o estado do doador em cada badge (conquistado,
     * progresso e, se ele já compartilhou, a URL pública).
     *
     * @return list<array<string, mixed>>
     */
    public function conquistas(Doador $doador): array
    {
        $progresso = $this->progresso($doador);
        $conquistados = $doador->badges()->get()->keyBy('id');

        return Badge::whereNotNull('regra')->orderBy('id')->get()->map(function (Badge $badge) use ($progresso, $conquistados) {
            $conquistado = $conquistados->get($badge->id);
            $token = $conquistado?->pivot->compartilhavel_token;

            return [
                'id' => $badge->id,
                'codigo' => $badge->codigo,
                'nome' => $badge->nome,
                'descricao' => $badge->descricao,
                'imagem_url' => $badge->imagem_url,
                'conquistada' => $conquistado !== null,
                'conquistado_em' => $conquistado?->pivot->conquistado_em?->toIso8601String(),
                'progresso' => [
                    'atual' => min($progresso[$badge->regra] ?? 0, $badge->limiar),
                    'limiar' => $badge->limiar,
                ],
                'url_compartilhamento' => $token ? route('conquistas.publica', $token) : null,
            ];
        })->all();
    }
}
