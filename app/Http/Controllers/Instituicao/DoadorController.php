<?php

namespace App\Http\Controllers\Instituicao;

use App\Enums\DoacaoStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\DoadorPerfilResource;
use App\Models\Doacao;
use App\Models\Doador;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DoadorController extends Controller
{
    public function show(Request $request, Doador $doador): Response
    {
        $instituicaoId = auth()->user()->instituicaoId();

        $temDoacao = Doacao::where('doador_id', $doador->usuario_id)
            ->where('instituicao_id', $instituicaoId)
            ->exists();

        abort_unless($temDoacao, 403);

        $doador->load([
            'usuario.causas',
            'doacoes' => fn ($q) => $q->where('status', DoacaoStatus::Entregue)
                ->orderBy('created_at', 'desc')
                ->limit(10),
            'doacoes.instituicao',
            'doacoes.itens.categoria',
        ]);

        return Inertia::render('instituicao/doadores/show', [
            'isOwnProfile' => false,
            'doador' => (new DoadorPerfilResource($doador, $instituicaoId))->resolve($request),
        ]);
    }
}
