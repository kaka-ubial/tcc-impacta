<?php

namespace App\Http\Controllers\Instituicao;

use App\Exceptions\HorarioException;
use App\Http\Controllers\Controller;
use App\Models\HorarioDisponivel;
use App\Services\HorarioService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HorarioController extends Controller
{
    public function __construct(private readonly HorarioService $horarios) {}

    public function index(): Response
    {
        $instituicaoId = auth()->user()->instituicao->usuario_id;

        $horarios = HorarioDisponivel::where('instituicao_id', $instituicaoId)
            ->where('ativo', true)
            ->withExists(['agendamentos as tem_doacoes_ativas' => fn ($q) => $q
                ->whereHas('doacao', fn ($q) => $q->whereIn('status', ['pendente', 'confirmada']))])
            ->orderBy('dia_semana')
            ->orderBy('hora_inicio')
            ->get()
            ->map(fn ($h) => [
                'id' => $h->id,
                'dia_semana' => $h->dia_semana,
                'hora_inicio' => $h->hora_inicio,
                'hora_fim' => $h->hora_fim,
                'tipo' => $h->tipo,
                'pode_excluir' => ! $h->tem_doacoes_ativas,
            ]);

        return Inertia::render('instituicao/horarios', [
            'horarios' => $horarios,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'dia_semana' => ['required', 'integer', 'between:0,6'],
            'hora_inicio' => ['required', 'date_format:H:i'],
            'hora_fim' => ['required', 'date_format:H:i', 'after:hora_inicio'],
            'tipo' => ['required', 'in:coleta,entrega'],
        ]);

        $this->horarios->store($validated, auth()->user()->instituicao);

        return back();
    }

    public function destroy(HorarioDisponivel $horario)
    {
        try {
            $this->horarios->destroy($horario, auth()->user()->instituicao);
        } catch (HorarioException $e) {
            return back()->with('error', $e->getMessage());
        }

        return back();
    }
}
