<?php

namespace App\Http\Controllers\Instituicao;

use App\Http\Controllers\Controller;
use App\Http\Requests\Instituicao\SugerirDataRequest;
use App\Models\Agendamento;
use App\Models\HorarioDisponivel;
use App\Models\Transferencia;
use App\Services\AgendaService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class AgendaController extends Controller
{
    public function __construct(private readonly AgendaService $agenda) {}

    public function index(): Response
    {
        $instituicaoId = auth()->user()->instituicaoId();

        $agendamentos = Agendamento::with(['doacao.doador'])
            ->whereHas('doacao', fn ($q) => $q
                ->where('instituicao_id', $instituicaoId)
                ->whereNotIn('status', ['cancelado', 'recusada']))
            ->orderBy('data_hora')
            ->get()
            ->map(fn (Agendamento $a) => [
                'id' => $a->id,
                'doacao_id' => $a->doacao_id,
                'data_hora' => $a->data_hora->toIso8601String(),
                'data_hora_sugerida' => $a->data_hora_sugerida?->toIso8601String(),
                'tipo' => $a->tipo,
                'status' => $a->status,
                'endereco_referencia' => $a->endereco_referencia,
                'doacao_status' => $a->doacao->status,
                'doador' => [
                    'usuario_id' => $a->doacao->doador->usuario_id,
                    'nome' => $a->doacao->doador->nome_completo,
                    'telefone' => $a->doacao->doador->telefone,
                ],
            ]);

        $horarios = HorarioDisponivel::where('instituicao_id', $instituicaoId)
            ->where('ativo', true)
            ->orderBy('dia_semana')
            ->orderBy('hora_inicio')
            ->get()
            ->map(fn (HorarioDisponivel $h) => [
                'id' => $h->id,
                'dia_semana' => $h->dia_semana,
                'hora_inicio' => $h->hora_inicio,
                'hora_fim' => $h->hora_fim,
                'tipo' => $h->tipo,
            ]);

        $transferencias = Transferencia::with(['origem', 'destino'])
            ->where(function ($q) use ($instituicaoId) {
                $q->where('instituicao_origem_id', $instituicaoId)
                    ->orWhere('instituicao_destino_id', $instituicaoId);
            })
            ->whereNotIn('status', ['cancelada', 'recusada'])
            ->get()
            ->map(fn (Transferencia $t) => [
                'id' => $t->id,
                'status' => $t->status,
                'direcao' => $t->instituicao_origem_id === $instituicaoId ? 'enviada' : 'recebida',
                'criado_em' => $t->created_at->toIso8601String(),
                'data_hora' => $t->data_hora?->toIso8601String(),
                'parceiro' => $t->instituicao_origem_id === $instituicaoId
                    ? $t->destino->nome_fantasia
                    : $t->origem->nome_fantasia,
            ]);

        return Inertia::render('instituicao/agenda', [
            'agendamentos' => $agendamentos,
            'horarios' => $horarios,
            'transferencias' => $transferencias,
        ]);
    }

    public function sugerirAlteracao(SugerirDataRequest $request, Agendamento $agendamento): RedirectResponse
    {
        $this->agenda->sugerirAlteracao($request->validated(), $agendamento, auth()->user());

        return back();
    }
}
