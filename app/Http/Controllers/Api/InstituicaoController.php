<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\InstituicaoListResource;
use App\Http\Resources\InstituicaoShowResource;
use App\Models\Instituicao;
use App\Services\InstituicaoQueryService;
use App\Services\RecommendationService;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Contraparte REST/JSON de Instituicao\InstituicaoController (listagem
 * pública). Reaproveita a mesma query/filtros (InstituicaoQueryService) e a
 * mesma RecommendationService usadas pela UI Inertia.
 */
#[Group('Instituições (Doador)')]
class InstituicaoController extends Controller
{
    /**
     * Listar instituições
     *
     * Lista instituições visíveis, com filtros de busca, causa, categoria de
     * item necessário (RF4) e raio de proximidade em km (RF4, requer que o
     * doador autenticado tenha localização cadastrada).
     */
    public function index(Request $request, InstituicaoQueryService $query): AnonymousResourceCollection
    {
        $instituicoes = $query->search($request->user(), [
            'search' => $request->string('search')->trim()->value(),
            'causa' => $request->integer('causa') ?: null,
            'categoria' => $request->integer('categoria') ?: null,
            'raio' => $request->integer('raio') ?: null,
        ]);

        return InstituicaoListResource::collection($instituicoes);
    }

    /**
     * Instituições recomendadas
     *
     * Retorna instituições recomendadas ao doador autenticado (afinidade de
     * causas e proximidade).
     */
    public function recomendadas(Request $request, RecommendationService $recommendations): JsonResponse
    {
        abort_if($request->user()->tipo_usuario !== 'doador', 403);

        // RecommendationService já devolve arrays prontos (usuario_id,
        // nome_fantasia, causas, causa_overlap, distancia_km) — não models
        // Instituicao — por isso não passa por um Resource aqui.
        return response()->json([
            'data' => $recommendations->forDonor($request->user())->values(),
        ]);
    }

    /**
     * Detalhar instituição
     *
     * Retorna os detalhes públicos de uma instituição, incluindo necessidades
     * ativas e horários disponíveis.
     */
    public function show(int $id): InstituicaoShowResource
    {
        $instituicao = Instituicao::with([
            'causas',
            'necessidades' => fn ($q) => $q->whereColumn('quantidade_atual', '<', 'quantidade_objetivo'),
            'necessidades.categoria',
            'horarios' => fn ($q) => $q->where('ativo', true)->orderBy('dia_semana')->orderBy('hora_inicio'),
        ])->findOrFail($id);

        return new InstituicaoShowResource($instituicao);
    }
}
