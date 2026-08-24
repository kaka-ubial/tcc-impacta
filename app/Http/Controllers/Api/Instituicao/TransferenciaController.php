<?php

namespace App\Http\Controllers\Api\Instituicao;

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
    /** Relações recarregadas após cada transição de estado, antes de montar o Resource. */
    private const RELATIONS = ['origem', 'destino', 'itens.categoria'];

    public function __construct(private readonly TransferenciaService $transferencias) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $id = $request->user()->instituicaoId();

        $transferencias = Transferencia::with(self::RELATIONS)
            ->where('instituicao_origem_id', $id)
            ->orWhere('instituicao_destino_id', $id)
            ->orderBy('created_at', 'desc')
            ->get();

        return TransferenciaResource::collection($transferencias);
    }

    public function store(StoreTransferenciaRequest $request)
    {
        $transferencia = $this->transferencias->store($request->validated(), $request->user());

        return (new TransferenciaResource($transferencia))
            ->response()
            ->setStatusCode(201);
    }

    public function confirmar(Request $request, Transferencia $transferencia)
    {
        $this->transferencias->confirmar($transferencia, $request->user());

        return new TransferenciaResource($transferencia->fresh(self::RELATIONS));
    }

    public function recusar(Request $request, Transferencia $transferencia)
    {
        $this->transferencias->recusar($transferencia, $request->user());

        return new TransferenciaResource($transferencia->fresh(self::RELATIONS));
    }

    public function entregar(Request $request, Transferencia $transferencia)
    {
        $this->transferencias->entregar($transferencia, $request->user());

        return new TransferenciaResource($transferencia->fresh(self::RELATIONS));
    }

    public function naoEntregue(Request $request, Transferencia $transferencia)
    {
        $this->transferencias->naoEntregue($transferencia, $request->user());

        return new TransferenciaResource($transferencia->fresh(self::RELATIONS));
    }

    public function sugerirAlteracao(SugerirDataRequest $request, Transferencia $transferencia)
    {
        $this->transferencias->sugerirAlteracao($request->validated(), $transferencia, $request->user());

        return new TransferenciaResource($transferencia->fresh(self::RELATIONS));
    }

    public function aceitarSugestao(Request $request, Transferencia $transferencia)
    {
        $this->transferencias->aceitarSugestao($transferencia, $request->user());

        return new TransferenciaResource($transferencia->fresh(self::RELATIONS));
    }

    public function recusarSugestao(Request $request, Transferencia $transferencia)
    {
        $this->transferencias->recusarSugestao($transferencia, $request->user());

        return new TransferenciaResource($transferencia->fresh(self::RELATIONS));
    }

    public function cancelar(Request $request, Transferencia $transferencia)
    {
        $this->transferencias->cancelar($transferencia, $request->user());

        return new TransferenciaResource($transferencia->fresh(self::RELATIONS));
    }
}
