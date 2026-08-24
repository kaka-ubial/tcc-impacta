<?php

namespace App\Http\Controllers\Instituicao;

use App\Exceptions\HorarioException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Instituicao\StoreHorarioRequest;
use App\Http\Resources\HorarioResource;
use App\Models\HorarioDisponivel;
use App\Services\HorarioService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HorarioController extends Controller
{
    public function __construct(private readonly HorarioService $horarios) {}

    public function index(Request $request): Response
    {
        $instituicaoId = auth()->user()->instituicaoId();

        $horarios = HorarioDisponivel::where('instituicao_id', $instituicaoId)
            ->where('ativo', true)
            ->withExists(['agendamentos as tem_doacoes_ativas' => fn ($q) => $q
                ->whereHas('doacao', fn ($q) => $q->whereIn('status', ['pendente', 'confirmada']))])
            ->orderBy('dia_semana')
            ->orderBy('hora_inicio')
            ->get();

        return Inertia::render('instituicao/horarios', [
            'horarios' => HorarioResource::collection($horarios)->resolve($request),
        ]);
    }

    public function store(StoreHorarioRequest $request)
    {
        $this->horarios->store($request->validated(), auth()->user()->instituicao);

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
