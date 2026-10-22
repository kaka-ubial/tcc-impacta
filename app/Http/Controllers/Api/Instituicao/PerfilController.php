<?php

namespace App\Http\Controllers\Api\Instituicao;

use App\Http\Controllers\Controller;
use App\Http\Resources\InstituicaoPerfilResource;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\Request;

/**
 * Contraparte REST/JSON de Instituicao\PerfilController (perfil próprio da
 * instituição).
 */
#[Group('Perfil (Instituição)')]
class PerfilController extends Controller
{
    /**
     * Meu perfil
     *
     * Retorna o perfil da instituição autenticada, com estatísticas,
     * necessidades ativas e horários disponíveis.
     */
    public function show(Request $request): InstituicaoPerfilResource
    {
        $instituicao = $request->user()->instituicao;

        abort_unless($instituicao, 403);

        $instituicao->load([
            'usuario',
            'causas',
            'necessidades' => fn ($q) => $q->whereColumn('quantidade_atual', '<', 'quantidade_objetivo'),
            'necessidades.categoria',
            'horarios' => fn ($q) => $q->where('ativo', true)->orderBy('dia_semana')->orderBy('hora_inicio'),
        ]);

        return new InstituicaoPerfilResource($instituicao);
    }
}
