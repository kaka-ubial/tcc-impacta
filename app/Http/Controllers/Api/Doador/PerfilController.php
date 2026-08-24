<?php

namespace App\Http\Controllers\Api\Doador;

use App\Http\Controllers\Controller;
use App\Http\Resources\DoadorPerfilResource;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\Request;

/**
 * Contraparte REST/JSON de Doador\PerfilController (perfil próprio do
 * doador).
 */
#[Group('Perfil (Doador)')]
class PerfilController extends Controller
{
    /**
     * Meu perfil
     *
     * Retorna o perfil do doador autenticado, com histórico de doações
     * entregues.
     */
    public function show(Request $request): DoadorPerfilResource
    {
        $doador = $request->user()->doador;

        abort_unless($doador, 403);

        $doador->load([
            'usuario.causas',
            'doacoes' => fn ($q) => $q->where('status', 'entregue')
                ->orderBy('created_at', 'desc')
                ->limit(10),
            'doacoes.instituicao',
            'doacoes.itens.categoria',
        ]);

        return new DoadorPerfilResource($doador);
    }
}
