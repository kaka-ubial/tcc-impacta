<?php

namespace App\Http\Controllers\Api\Instituicao;

use App\Http\Controllers\Controller;
use App\Http\Resources\InstituicaoDoacaoResource;
use App\Models\Doacao;
use App\Services\DoacaoService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Contraparte REST/JSON de Instituicao\DoacaoController. Reaproveita o
 * mesmo DoacaoService usado pela UI Inertia e pelo Api\DoacaoController
 * (lado doador).
 */
class DoacaoController extends Controller
{
    public function __construct(private readonly DoacaoService $doacoes) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $instituicaoId = $request->user()->instituicaoId();

        $doacoes = Doacao::with(['doador', 'itens.categoria', 'agendamento', 'avaliacao'])
            ->where('instituicao_id', $instituicaoId)
            ->orderBy('created_at', 'desc')
            ->get();

        return InstituicaoDoacaoResource::collection($doacoes);
    }

    public function confirm(Request $request, Doacao $doacao)
    {
        $this->doacoes->confirm($doacao, $request->user());

        return new InstituicaoDoacaoResource($doacao->fresh(['doador', 'itens.categoria', 'agendamento']));
    }

    public function reject(Request $request, Doacao $doacao)
    {
        $this->doacoes->reject($doacao, $request->user());

        return new InstituicaoDoacaoResource($doacao->fresh(['doador', 'itens.categoria', 'agendamento']));
    }

    public function deliver(Request $request, Doacao $doacao)
    {
        $this->doacoes->deliver($doacao, $request->user());

        return new InstituicaoDoacaoResource($doacao->fresh(['doador', 'itens.categoria', 'agendamento']));
    }

    public function notDelivered(Request $request, Doacao $doacao)
    {
        $this->doacoes->notDelivered($doacao, $request->user());

        return new InstituicaoDoacaoResource($doacao->fresh(['doador', 'itens.categoria', 'agendamento']));
    }
}
