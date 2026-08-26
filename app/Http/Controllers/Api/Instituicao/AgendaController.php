<?php

namespace App\Http\Controllers\Api\Instituicao;

use App\Enums\DoacaoStatus;
use App\Enums\TransferenciaStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Instituicao\SugerirDataRequest;
use App\Http\Resources\AgendamentoResource;
use App\Http\Resources\HorarioResource;
use App\Http\Resources\TransferenciaResource;
use App\Models\Agendamento;
use App\Models\HorarioDisponivel;
use App\Models\Transferencia;
use App\Services\AgendaService;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Contraparte REST/JSON de Instituicao\AgendaController. Reaproveita o
 * mesmo AgendaService usado pela UI Inertia, além das Resources de
 * horários e transferências já existentes.
 */
#[Group('Agenda (Instituição)')]
class AgendaController extends Controller
{
    public function __construct(private readonly AgendaService $agenda) {}

    /**
     * Agenda da instituição
     *
     * Retorna agendamentos, horários ativos e transferências em andamento
     * da instituição autenticada, para montar a visão de agenda.
     */
    public function index(Request $request): JsonResponse
    {
        $instituicaoId = $request->user()->instituicaoId();

        $agendamentos = Agendamento::with(['doacao.doador'])
            ->whereHas('doacao', fn ($q) => $q
                ->where('instituicao_id', $instituicaoId)
                ->whereNotIn('status', [DoacaoStatus::Cancelado, DoacaoStatus::Recusada]))
            ->orderBy('data_hora')
            ->get();

        $horarios = HorarioDisponivel::where('instituicao_id', $instituicaoId)
            ->where('ativo', true)
            ->orderBy('dia_semana')
            ->orderBy('hora_inicio')
            ->get();

        $transferencias = Transferencia::with(['origem', 'destino', 'itens.categoria'])
            ->where(fn ($q) => $q
                ->where('instituicao_origem_id', $instituicaoId)
                ->orWhere('instituicao_destino_id', $instituicaoId))
            ->whereNotIn('status', [TransferenciaStatus::Cancelada, TransferenciaStatus::Recusada])
            ->get();

        return response()->json([
            'agendamentos' => AgendamentoResource::collection($agendamentos)->resolve($request),
            'horarios' => HorarioResource::collection($horarios)->resolve($request),
            'transferencias' => TransferenciaResource::collection($transferencias)->resolve($request),
        ]);
    }

    /**
     * Sugerir alteração de agendamento
     *
     * Propõe uma nova data/horário para um agendamento de doação.
     */
    public function sugerirAlteracao(SugerirDataRequest $request, Agendamento $agendamento): AgendamentoResource
    {
        $this->agenda->sugerirAlteracao($request->validated(), $agendamento, $request->user());

        return new AgendamentoResource($agendamento->fresh(['doacao.doador']));
    }
}
