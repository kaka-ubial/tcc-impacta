<?php

namespace App\Http\Controllers\Api\Instituicao;

use App\Enums\DoacaoStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\DoadorPerfilResource;
use App\Models\Doacao;
use App\Models\Doador;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\Request;

/**
 * Contraparte REST/JSON de Instituicao\DoadorController (visão da
 * instituição sobre um doador com quem já interagiu).
 */
#[Group('Doadores (Instituição)')]
class DoadorController extends Controller
{
    /**
     * Detalhar doador
     *
     * Retorna o perfil de um doador que já doou para a instituição
     * autenticada.
     */
    public function show(Request $request, Doador $doador): DoadorPerfilResource
    {
        $instituicaoId = $request->user()->instituicaoId();

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

        return new DoadorPerfilResource($doador, $instituicaoId);
    }
}
