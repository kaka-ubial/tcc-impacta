<?php

namespace App\Http\Controllers\Instituicao;

use App\Http\Controllers\Controller;
use App\Models\Agendamento;
use App\Models\HorarioDisponivel;
use App\Models\Notificacao;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AgendaController extends Controller
{
    public function index(): Response
    {
        $instituicaoId = auth()->user()->instituicao->usuario_id;

        $agendamentos = Agendamento::with(['doacao.doador'])
            ->whereHas('doacao', fn ($q) => $q
                ->where('instituicao_id', $instituicaoId)
                ->whereNotIn('status', ['cancelado', 'recusada']))
            ->orderBy('data_hora')
            ->get()
            ->map(fn (Agendamento $a) => [
                'id'                 => $a->id,
                'doacao_id'          => $a->doacao_id,
                'data_hora'          => $a->data_hora->toIso8601String(),
                'data_hora_sugerida' => $a->data_hora_sugerida?->toIso8601String(),
                'tipo'               => $a->tipo,
                'status'             => $a->status,
                'endereco_referencia' => $a->endereco_referencia,
                'doacao_status'      => $a->doacao->status,
                'doador'             => [
                    'nome'     => $a->doacao->doador->nome_completo,
                    'telefone' => $a->doacao->doador->telefone,
                ],
            ]);

        $horarios = HorarioDisponivel::where('instituicao_id', $instituicaoId)
            ->where('ativo', true)
            ->orderBy('dia_semana')
            ->orderBy('hora_inicio')
            ->get()
            ->map(fn (HorarioDisponivel $h) => [
                'id'          => $h->id,
                'dia_semana'  => $h->dia_semana,
                'hora_inicio' => $h->hora_inicio,
                'hora_fim'    => $h->hora_fim,
                'tipo'        => $h->tipo,
            ]);

        return Inertia::render('instituicao/agenda', [
            'agendamentos' => $agendamentos,
            'horarios'     => $horarios,
        ]);
    }

    public function sugerirAlteracao(Request $request, Agendamento $agendamento): \Illuminate\Http\RedirectResponse
    {
        abort_if(
            $agendamento->doacao->instituicao_id !== auth()->user()->instituicao->usuario_id,
            403
        );

        $validated = $request->validate([
            'data_hora_sugerida' => ['required', 'date', 'after:now'],
        ]);

        $agendamento->update([
            'data_hora_sugerida' => $validated['data_hora_sugerida'],
            'status'             => 'alteracao_sugerida',
        ]);

        Notificacao::enviar(
            $agendamento->doacao->doador_id,
            'Nova data sugerida',
            auth()->user()->instituicao->nome_fantasia.' sugeriu uma nova data para a sua doação.'
        );

        return back();
    }
}
