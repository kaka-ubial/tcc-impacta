<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\HorarioException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Instituicao\StoreHorarioRequest;
use App\Http\Resources\HorarioResource;
use App\Models\HorarioDisponivel;
use App\Services\HorarioService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Contraparte REST/JSON de Instituicao\HorarioController. Reaproveita o
 * mesmo HorarioService usado pela UI Inertia.
 */
class HorarioController extends Controller
{
    public function __construct(private readonly HorarioService $horarios) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $horarios = HorarioDisponivel::where('instituicao_id', $request->user()->instituicao->usuario_id)
            ->where('ativo', true)
            ->orderBy('dia_semana')
            ->orderBy('hora_inicio')
            ->get();

        return HorarioResource::collection($horarios);
    }

    public function store(StoreHorarioRequest $request)
    {
        $horario = $this->horarios->store($request->validated(), $request->user()->instituicao);

        return (new HorarioResource($horario))
            ->response()
            ->setStatusCode(201);
    }

    public function destroy(Request $request, HorarioDisponivel $horario)
    {
        try {
            $this->horarios->destroy($horario, $request->user()->instituicao);
        } catch (HorarioException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(null, 204);
    }
}
