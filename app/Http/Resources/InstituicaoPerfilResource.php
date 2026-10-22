<?php

namespace App\Http\Resources;

use App\Enums\DoacaoStatus;
use App\Models\Instituicao;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Perfil próprio da instituição (contraparte de DoadorPerfilResource).
 * Requer os relacionamentos usuario, causas, necessidades (apenas as ainda
 * não atendidas) e horarios (apenas ativos) já carregados.
 *
 * @mixin Instituicao
 */
class InstituicaoPerfilResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'usuario_id' => $this->usuario_id,
            'nome_fantasia' => $this->nome_fantasia,
            'razao_social' => $this->razao_social,
            'cnpj' => $this->cnpj,
            'email' => $this->usuario->email,
            'telefone' => $this->telefone,
            'endereco_completo' => $this->endereco_completo,
            'descricao' => $this->descricao,
            'foto_perfil' => $this->foto_perfil,
            'verificada' => $this->isApproved(),
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'membro_desde' => $this->created_at?->toIso8601String(),
            'causas' => $this->causas->map(fn ($c) => [
                'id' => $c->id,
                'nome' => $c->nome,
                'icone' => $c->icone,
            ])->values(),
            'estatisticas' => [
                'total_doacoes' => $this->doacoes()->count(),
                'doacoes_concluidas' => $this->doacoes()->where('status', DoacaoStatus::Entregue)->count(),
                'doadores_atendidos' => $this->doacoes()->where('status', DoacaoStatus::Entregue)->distinct()->count('doador_id'),
                'necessidades_ativas' => $this->necessidades->count(),
            ],
            'necessidades_ativas' => $this->necessidades->map(fn ($n) => [
                'id' => $n->id,
                'descricao' => $n->descricao,
                'quantidade_objetivo' => $n->quantidade_objetivo,
                'quantidade_atual' => $n->quantidade_atual,
                'prioridade' => $n->prioridade,
                'categoria' => ['id' => $n->categoria->id, 'nome' => $n->categoria->nome],
            ])->values(),
            'horarios_disponiveis' => $this->horarios->map(fn ($h) => [
                'id' => $h->id,
                'dia_semana' => $h->dia_semana,
                'hora_inicio' => $h->hora_inicio,
                'hora_fim' => $h->hora_fim,
                'tipo' => $h->tipo,
            ])->values(),
        ];
    }
}
