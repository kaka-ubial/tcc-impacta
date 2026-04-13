<?php

namespace App\Http\Controllers\Instituicao;

use App\Http\Controllers\Controller;
use App\Models\HorarioDisponivel;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HorarioController extends Controller
{
    public function index(): Response
    {
        $instituicaoId = auth()->user()->instituicao->usuario_id;

        $horarios = HorarioDisponivel::where('instituicao_id', $instituicaoId)
            ->where('ativo', true)
            ->orderBy('dia_semana')
            ->orderBy('hora_inicio')
            ->get()
            ->map(fn ($h) => [
                'id'          => $h->id,
                'dia_semana'  => $h->dia_semana,
                'hora_inicio' => $h->hora_inicio,
                'hora_fim'    => $h->hora_fim,
                'tipo'        => $h->tipo,
            ]);

        return Inertia::render('instituicao/horarios', [
            'horarios' => $horarios,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'dia_semana'  => ['required', 'integer', 'between:0,6'],
            'hora_inicio' => ['required', 'date_format:H:i'],
            'hora_fim'    => ['required', 'date_format:H:i', 'after:hora_inicio'],
            'tipo'        => ['required', 'in:coleta,entrega'],
        ]);

        $instituicaoId = auth()->user()->instituicao->usuario_id;

        HorarioDisponivel::create([
            'instituicao_id' => $instituicaoId,
            'dia_semana'     => $validated['dia_semana'],
            'hora_inicio'    => $validated['hora_inicio'],
            'hora_fim'       => $validated['hora_fim'],
            'tipo'           => $validated['tipo'],
        ]);

        return back();
    }

    public function destroy(HorarioDisponivel $horario)
    {
        abort_if(
            $horario->instituicao_id !== auth()->user()->instituicao->usuario_id,
            403
        );

        $horario->delete();

        return back();
    }
}
