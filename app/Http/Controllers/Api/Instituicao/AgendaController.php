<?php

namespace App\Http\Controllers\Api\Instituicao;

use App\Http\Controllers\Controller;
use App\Http\Resources\AgendamentoResource;
use App\Http\Resources\HorarioResource;
use App\Http\Resources\TransferenciaResource;
use App\Models\Agendamento;
use App\Models\HorarioDisponivel;
use App\Models\Transferencia;
use App\Services\AgendaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Contraparte REST/JSON de Instituicao\AgendaController. Reaproveita o
 * mesmo AgendaService usado pela UI Inertia, além das Resources de
 * horários e transferências já existentes.
 */
class AgendaController extends Controller
{
    public function __construct(private readonly AgendaService $agenda) {}

    public function index(Request $request): JsonResponse
    {
        $instituicaoId = $request->user()->instituicao->usuario_id;

        $agendamentos = Agendamento::with(['doacao.doador'])
            ->whereHas('doacao', fn ($q) => $q
                ->where('instituicao_id', $instituicaoId)
                ->whereNotIn('status', ['cancelado', 'recusada']))
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
            ->whereNotIn('status', ['cancelada', 'recusada'])
            ->get();

        return response()->json([
            'agendamentos' => AgendamentoResource::collection($agendamentos)->resolve($request),
            'horarios' => HorarioResource::collection($horarios)->resolve($request),
            'transferencias' => TransferenciaResource::collection($transferencias)->resolve($request),
        ]);
    }

    public function sugerirAlteracao(Request $request, Agendamento $agendamento): AgendamentoResource
    {
        $validated = $request->validate([
            'data_hora_sugerida' => ['required', 'date', 'after:now'],
        ]);

        $this->agenda->sugerirAlteracao($validated, $agendamento, $request->user());

        return new AgendamentoResource($agendamento->fresh(['doacao.doador']));
    }
}
