<?php

namespace App\Http\Resources;

use App\Models\Instituicao;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Espelha o formato do ->through() usado por Instituicao\InstituicaoController::index()
 * (listagem pública, compacta). Para o detalhe completo, ver InstituicaoShowResource.
 *
 * @mixin Instituicao
 */
class InstituicaoListResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'usuario_id' => $this->usuario_id,
            'nome_fantasia' => $this->nome_fantasia,
            'endereco_completo' => $this->endereco_completo,
            'verificada' => $this->isApproved(),
            'causas' => $this->causas->map(fn ($c) => ['id' => $c->id, 'nome' => $c->nome, 'icone' => $c->icone]),
            'necessidades_ativas_count' => $this->necessidades_ativas_count,
            // Só presente quando a query aplicou selectDistance() (RF4 —
            // busca por proximidade); ausente do payload nas listagens sem
            // localização, em vez de sempre mandar null. Checado via
            // getAttributes() e não isset()/$this->distancia_km porque a
            // instituição pode legitimamente não ter lat/lng (distância
            // NULL) mesmo com a coluna selecionada.
            'distancia_km' => $this->when(
                array_key_exists('distancia_km', $this->getAttributes()),
                fn () => $this->distancia_km !== null ? round($this->distancia_km, 1) : null
            ),
        ];
    }
}
