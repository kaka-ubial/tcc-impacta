<?php

namespace App\Http\Controllers\Doador;

use App\Enums\DoacaoStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\DoadorPerfilResource;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PerfilController extends Controller
{
    public function show(Request $request): Response
    {
        $doador = $request->user()->doador;

        abort_unless($doador, 403);

        $doador->load([
            'usuario.causas',
            'doacoes' => fn ($q) => $q->where('status', DoacaoStatus::Entregue)
                ->orderBy('created_at', 'desc')
                ->limit(10),
            'doacoes.instituicao',
            'doacoes.itens.categoria',
        ]);

        return Inertia::render('instituicao/doadores/show', [
            'isOwnProfile' => true,
            'doador' => (new DoadorPerfilResource($doador))->resolve($request),
        ]);
    }
}
