<?php

namespace App\Http\Resources;

use App\Models\Instituicao;
use App\Services\TransferenciaService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Espelha o array completo montado por Instituicao\InstituicaoController::show()
 * (página pública de detalhe). Campos que só fazem sentido para a própria UI
 * Inertia (canTransfer, categorias do formulário) ficam de fora — um
 * consumidor de API já sabe seu próprio papel via /api/me.
 *
 * @mixin Instituicao
 */
class InstituicaoShowResource extends JsonResource
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
            'verificada' => $this->isApproved(),
            'cnpj' => $this->cnpj,
            'telefone' => $this->telefone,
            'endereco_completo' => $this->endereco_completo,
            'descricao' => $this->descricao,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'causas' => $this->causas->map(fn ($c) => ['id' => $c->id, 'nome' => $c->nome, 'icone' => $c->icone]),
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
            'estoque' => $this->when(
                $request->user()?->tipo_usuario === 'instituicao',
                fn () => TransferenciaService::calcularEstoque($request->user()->instituicaoId())
            ),
        ];
    }
}
