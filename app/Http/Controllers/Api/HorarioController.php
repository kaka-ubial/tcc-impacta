<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Instituicao\StoreHorarioRequest;
use App\Http\Resources\HorarioResource;
use App\Models\HorarioDisponivel;
use App\Services\HorarioService;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Contraparte REST/JSON de Instituicao\HorarioController. Reaproveita o
 * mesmo HorarioService usado pela UI Inertia.
 */
#[Group('Horários (Instituição)')]
class HorarioController extends Controller
{
    public function __construct(private readonly HorarioService $horarios) {}

    /**
     * Listar horários
     *
     * Lista os horários de coleta ativos da instituição autenticada.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $horarios = HorarioDisponivel::where('instituicao_id', $request->user()->instituicaoId())
            ->where('ativo', true)
            ->orderBy('dia_semana')
            ->orderBy('hora_inicio')
            ->get();

        return HorarioResource::collection($horarios);
    }

    /**
     * Criar horário
     *
     * Cadastra um novo horário de coleta para a instituição autenticada.
     */
    public function store(StoreHorarioRequest $request)
    {
        $horario = $this->horarios->store($request->validated(), $request->user()->instituicao);

        return (new HorarioResource($horario))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Remover horário
     *
     * Remove um horário de coleta da instituição autenticada.
     */
    public function destroy(Request $request, HorarioDisponivel $horario)
    {
        $this->horarios->destroy($horario, $request->user()->instituicao);

        return response()->json(null, 204);
    }
}
