<?php

namespace App\Http\Controllers\Api\Instituicao;

use App\Http\Controllers\Controller;
use App\Http\Resources\DoadorPerfilResource;
use App\Models\Doacao;
use App\Models\Doador;
use Illuminate\Http\Request;

/**
 * Contraparte REST/JSON de Instituicao\DoadorController (visão da
 * instituição sobre um doador com quem já interagiu).
 */
class DoadorController extends Controller
{
    public function show(Request $request, Doador $doador): DoadorPerfilResource
    {
        $instituicaoId = $request->user()->instituicaoId();

        $temDoacao = Doacao::where('doador_id', $doador->usuario_id)
            ->where('instituicao_id', $instituicaoId)
            ->exists();

        abort_unless($temDoacao, 403);

        $doador->load([
            'usuario.causas',
            'doacoes' => fn ($q) => $q->where('status', 'entregue')
                ->orderBy('created_at', 'desc')
                ->limit(10),
            'doacoes.instituicao',
            'doacoes.itens.categoria',
        ]);

        return new DoadorPerfilResource($doador, $instituicaoId);
    }
}
