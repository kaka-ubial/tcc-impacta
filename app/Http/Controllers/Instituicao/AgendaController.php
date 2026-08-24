<?php

namespace App\Http\Controllers\Instituicao;

use App\Http\Controllers\Controller;
use App\Http\Requests\Instituicao\SugerirDataRequest;
use App\Http\Resources\AgendamentoResource;
use App\Http\Resources\HorarioResource;
use App\Http\Resources\TransferenciaResource;
use App\Models\Agendamento;
use App\Models\HorarioDisponivel;
use App\Models\Transferencia;
use App\Services\AgendaService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AgendaController extends Controller
{
    public function __construct(private readonly AgendaService $agenda) {}

    public function index(Request $request): Response
    {
        $instituicaoId = auth()->user()->instituicaoId();

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
            ->where(function ($q) use ($instituicaoId) {
                $q->where('instituicao_origem_id', $instituicaoId)
                    ->orWhere('instituicao_destino_id', $instituicaoId);
            })
            ->whereNotIn('status', ['cancelada', 'recusada'])
            ->get();

        return Inertia::render('instituicao/agenda', [
            'agendamentos' => AgendamentoResource::collection($agendamentos)->resolve($request),
            'horarios' => HorarioResource::collection($horarios)->resolve($request),
            'transferencias' => TransferenciaResource::collection($transferencias)->resolve($request),
        ]);
    }

    public function sugerirAlteracao(SugerirDataRequest $request, Agendamento $agendamento): RedirectResponse
    {
        $this->agenda->sugerirAlteracao($request->validated(), $agendamento, auth()->user());

        return back();
    }
}
