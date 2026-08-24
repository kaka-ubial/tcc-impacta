<?php

namespace App\Http\Controllers\Api\Doador;

use App\Http\Controllers\Controller;
use App\Http\Resources\DoadorPerfilResource;
use Illuminate\Http\Request;

/**
 * Contraparte REST/JSON de Doador\PerfilController (perfil próprio do
 * doador).
 */
class PerfilController extends Controller
{
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
