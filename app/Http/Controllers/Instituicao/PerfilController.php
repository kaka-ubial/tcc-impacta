<?php

namespace App\Http\Controllers\Instituicao;

use App\Http\Controllers\Controller;
use App\Http\Resources\InstituicaoPerfilResource;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PerfilController extends Controller
{
    public function show(Request $request): Response
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

        return Inertia::render('instituicao/perfil', [
            'instituicao' => (new InstituicaoPerfilResource($instituicao))->resolve($request),
        ]);
    }
}
