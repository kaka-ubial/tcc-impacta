<?php

namespace App\Http\Controllers\Api\Instituicao;

use App\Exceptions\TransferenciaException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Instituicao\StoreTransferenciaRequest;
use App\Http\Requests\Instituicao\SugerirDataRequest;
use App\Http\Resources\TransferenciaResource;
use App\Models\Transferencia;
use App\Services\TransferenciaService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Contraparte REST/JSON de Instituicao\TransferenciaController. Reaproveita
 * o mesmo TransferenciaService usado pela UI Inertia.
 */
class TransferenciaController extends Controller
{
    public function __construct(private readonly TransferenciaService $transferencias) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $id = $request->user()->instituicao->usuario_id;

        $transferencias = Transferencia::with(['origem', 'destino', 'itens.categoria'])
            ->where('instituicao_origem_id', $id)
            ->orWhere('instituicao_destino_id', $id)
            ->orderBy('created_at', 'desc')
            ->get();

        return TransferenciaResource::collection($transferencias);
    }

    public function store(StoreTransferenciaRequest $request)
    {
        try {
            $transferencia = $this->transferencias->store($request->validated(), $request->user());
        } catch (TransferenciaException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return (new TransferenciaResource($transferencia))
            ->response()
            ->setStatusCode(201);
    }

    public function confirmar(Request $request, Transferencia $transferencia)
    {
        $this->transferencias->confirmar($transferencia, $request->user());

        return new TransferenciaResource($transferencia->fresh(['origem', 'destino', 'itens.categoria']));
    }

    public function recusar(Request $request, Transferencia $transferencia)
    {
        $this->transferencias->recusar($transferencia, $request->user());

        return new TransferenciaResource($transferencia->fresh(['origem', 'destino', 'itens.categoria']));
    }

    public function entregar(Request $request, Transferencia $transferencia)
    {
        $this->transferencias->entregar($transferencia, $request->user());

        return new TransferenciaResource($transferencia->fresh(['origem', 'destino', 'itens.categoria']));
    }

    public function naoEntregue(Request $request, Transferencia $transferencia)
    {
        $this->transferencias->naoEntregue($transferencia, $request->user());

        return new TransferenciaResource($transferencia->fresh(['origem', 'destino', 'itens.categoria']));
    }

    public function sugerirAlteracao(SugerirDataRequest $request, Transferencia $transferencia)
    {
        $this->transferencias->sugerirAlteracao($request->validated(), $transferencia, $request->user());

        return new TransferenciaResource($transferencia->fresh(['origem', 'destino', 'itens.categoria']));
    }

    public function aceitarSugestao(Request $request, Transferencia $transferencia)
    {
        $this->transferencias->aceitarSugestao($transferencia, $request->user());

        return new TransferenciaResource($transferencia->fresh(['origem', 'destino', 'itens.categoria']));
    }

    public function recusarSugestao(Request $request, Transferencia $transferencia)
    {
        $this->transferencias->recusarSugestao($transferencia, $request->user());

        return new TransferenciaResource($transferencia->fresh(['origem', 'destino', 'itens.categoria']));
    }

    public function cancelar(Request $request, Transferencia $transferencia)
    {
        $this->transferencias->cancelar($transferencia, $request->user());

        return new TransferenciaResource($transferencia->fresh(['origem', 'destino', 'itens.categoria']));
    }
}
