<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\DoacaoException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Doador\StoreDoacaoRequest;
use App\Http\Resources\DoacaoResource;
use App\Models\Doacao;
use App\Services\DoacaoService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Contraparte REST/JSON de Doador\DoacaoController. Reaproveita o mesmo
 * DoacaoService (regra de negócio) e o mesmo StoreDoacaoRequest (validação)
 * usados pela UI Inertia — só a camada de apresentação muda.
 */
class DoacaoController extends Controller
{
    public function __construct(private readonly DoacaoService $doacoes) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $doadorId = $request->user()->doador->usuario_id;

        $doacoes = Doacao::with(['instituicao', 'itens.categoria', 'agendamento', 'avaliacao'])
            ->where('doador_id', $doadorId)
            ->orderBy('created_at', 'desc')
            ->get();

        return DoacaoResource::collection($doacoes);
    }

    public function store(StoreDoacaoRequest $request)
    {
        try {
            $doacao = $this->doacoes->store($request->validated(), $request->user());
        } catch (DoacaoException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return (new DoacaoResource($doacao))
            ->response()
            ->setStatusCode(201);
    }

    public function cancel(Request $request, Doacao $doacao)
    {
        $this->doacoes->cancel($doacao, $request->user());

        return response()->json(null, 204);
    }

    public function aceitarSugestao(Request $request, Doacao $doacao)
    {
        $this->doacoes->aceitarSugestao($doacao, $request->user());

        return response()->json(null, 204);
    }

    public function recusarSugestao(Request $request, Doacao $doacao)
    {
        $this->doacoes->recusarSugestao($doacao, $request->user());

        return response()->json(null, 204);
    }
}
