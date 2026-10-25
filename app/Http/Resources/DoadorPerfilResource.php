<?php

namespace App\Http\Resources;

use App\Enums\DoacaoStatus;
use App\Models\Doador;
use App\Services\GamificacaoService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
class DoadorPerfilResource extends JsonResource
{
    public function __construct($resource, protected ?int $instituicaoId = null)
    {
        parent::__construct($resource);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $isOwnProfile = $this->instituicaoId === null;

        $totalDoacoes = $this->doacoes()->count();
        $totalConcluidas = $this->doacoes()->where('status', DoacaoStatus::Entregue)->count();

        $estatisticas = [
            'total_doacoes' => $totalDoacoes,
            'doacoes_concluidas' => $totalConcluidas,
        ];

        if ($isOwnProfile) {
            $estatisticas['doacoes_com_instituicao'] = 0;
        } else {
            $avaliadas = $this->doacoes()->where('status', DoacaoStatus::Entregue)->with('avaliacao')->get();

            $estatisticas['doacoes_com_instituicao'] = $this->doacoes()->where('instituicao_id', $this->instituicaoId)->count();
            $estatisticas['media_avaliacoes'] = $totalConcluidas > 0
                ? round($avaliadas->avg(fn ($d) => $d->avaliacao?->nota), 2)
                : null;
            $estatisticas['total_avaliacoes'] = $avaliadas->filter(fn ($d) => $d->avaliacao !== null)->count();
        }

        return [
            'is_own_profile' => $isOwnProfile,
            'usuario_id' => $this->usuario_id,
            'nome_completo' => $this->nome_completo,
            'email' => $this->usuario->email,
            'telefone' => $this->telefone,
            'endereco_completo' => $this->endereco_completo,
            'foto_perfil' => $this->foto_perfil,
            'pontuacao_gamificacao' => $this->pontuacao_gamificacao ?? 0,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'membro_desde' => $this->created_at?->toIso8601String(),
            'causas' => $this->usuario->causas->map(fn ($c) => [
                'id' => $c->id,
                'nome' => $c->nome,
                'icone' => $c->icone,
            ])->values(),
            'estatisticas' => $estatisticas,
            'conquistas' => $this->when($isOwnProfile, fn () => app(GamificacaoService::class)->conquistas($this->resource)),
            'doacoes_recentes' => $this->doacoes->map(fn ($d) => [
                'id' => $d->id,
                'status' => $d->status,
                'criado_em' => $d->created_at?->toIso8601String(),
                'eh_para_esta_instituicao' => ! $isOwnProfile && $d->instituicao_id === $this->instituicaoId,
                'instituicao' => [
                    'usuario_id' => $d->instituicao->usuario_id,
                    'nome_fantasia' => $d->instituicao->nome_fantasia,
                ],
                'itens' => $d->itens->map(fn ($item) => [
                    'id' => $item->id,
                    'categoria' => $item->categoria->nome,
                    'quantidade' => $item->quantidade,
                ])->values(),
            ])->values(),
        ];
    }
}
