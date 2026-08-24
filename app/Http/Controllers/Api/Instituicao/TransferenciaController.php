<?php

namespace App\Http\Controllers\Api\Instituicao;

use App\Http\Controllers\Controller;
use App\Http\Requests\Instituicao\StoreTransferenciaRequest;
use App\Http\Requests\Instituicao\SugerirDataRequest;
use App\Http\Resources\TransferenciaResource;
use App\Models\Transferencia;
use App\Services\TransferenciaService;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Contraparte REST/JSON de Instituicao\TransferenciaController. Reaproveita
 * o mesmo TransferenciaService usado pela UI Inertia.
 */
#[Group('Transferências (Instituição)')]
class TransferenciaController extends Controller
{
    /** Relações recarregadas após cada transição de estado, antes de montar o Resource. */
    private const RELATIONS = ['origem', 'destino', 'itens.categoria'];

    public function __construct(private readonly TransferenciaService $transferencias) {}

    /**
     * Listar transferências
     *
     * Lista as transferências entre instituições em que a instituição
     * autenticada é origem ou destino.
     */
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

    /**
     * Criar transferência
     *
     * Inicia uma transferência de itens para outra instituição.
     */
    public function store(StoreTransferenciaRequest $request)
    {
        $transferencia = $this->transferencias->store($request->validated(), $request->user());

        return (new TransferenciaResource($transferencia))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Confirmar transferência
     *
     * Confirma o agendamento de uma transferência pendente.
     */
    public function confirmar(Request $request, Transferencia $transferencia)
    {
        $this->transferencias->confirmar($transferencia, $request->user());

        return new TransferenciaResource($transferencia->fresh(self::RELATIONS));
    }

    /**
     * Recusar transferência
     *
     * Recusa uma transferência pendente.
     */
    public function recusar(Request $request, Transferencia $transferencia)
    {
        $this->transferencias->recusar($transferencia, $request->user());

        return new TransferenciaResource($transferencia->fresh(self::RELATIONS));
    }

    /**
     * Marcar transferência como entregue
     *
     * Marca uma transferência confirmada como entregue.
     */
    public function entregar(Request $request, Transferencia $transferencia)
    {
        $this->transferencias->entregar($transferencia, $request->user());

        return new TransferenciaResource($transferencia->fresh(self::RELATIONS));
    }

    /**
     * Marcar transferência como não entregue
     *
     * Marca uma transferência confirmada como não entregue.
     */
    public function naoEntregue(Request $request, Transferencia $transferencia)
    {
        $this->transferencias->naoEntregue($transferencia, $request->user());

        return new TransferenciaResource($transferencia->fresh(self::RELATIONS));
    }

    /**
     * Sugerir alteração de transferência
     *
     * Propõe uma nova data/horário para a transferência.
     */
    public function sugerirAlteracao(SugerirDataRequest $request, Transferencia $transferencia)
    {
        $this->transferencias->sugerirAlteracao($request->validated(), $transferencia, $request->user());

        return new TransferenciaResource($transferencia->fresh(self::RELATIONS));
    }

    /**
     * Aceitar sugestão de alteração
     *
     * Aceita a alteração de data/horário sugerida para a transferência.
     */
    public function aceitarSugestao(Request $request, Transferencia $transferencia)
    {
        $this->transferencias->aceitarSugestao($transferencia, $request->user());

        return new TransferenciaResource($transferencia->fresh(self::RELATIONS));
    }

    /**
     * Recusar sugestão de alteração
     *
     * Recusa a alteração de data/horário sugerida para a transferência.
     */
    public function recusarSugestao(Request $request, Transferencia $transferencia)
    {
        $this->transferencias->recusarSugestao($transferencia, $request->user());

        return new TransferenciaResource($transferencia->fresh(self::RELATIONS));
    }

    /**
     * Cancelar transferência
     *
     * Cancela uma transferência em andamento.
     */
    public function cancelar(Request $request, Transferencia $transferencia)
    {
        $this->transferencias->cancelar($transferencia, $request->user());

        return new TransferenciaResource($transferencia->fresh(self::RELATIONS));
    }
}
