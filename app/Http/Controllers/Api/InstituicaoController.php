<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\InstituicaoListResource;
use App\Http\Resources\InstituicaoShowResource;
use App\Models\Instituicao;
use App\Services\RecommendationService;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Contraparte REST/JSON de Instituicao\InstituicaoController (listagem
 * pública). Reaproveita a mesma query/filtros e a mesma RecommendationService
 * usadas pela UI Inertia.
 */
#[Group('Instituições (Doador)')]
class InstituicaoController extends Controller
{
    /**
     * Listar instituições
     *
     * Lista instituições visíveis, com filtros de busca e causa.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $search = $request->string('search')->trim()->value();
        $causaId = $request->integer('causa') ?: null;

        $instituicoes = Instituicao::with('causas')
            ->withCount(['necessidades as necessidades_ativas_count' => function ($query) {
                $query->whereColumn('quantidade_atual', '<', 'quantidade_objetivo');
            }])
            ->visible()
            ->when($request->user()->tipo_usuario === 'instituicao', fn ($q) => $q
                ->where('usuario_id', '!=', $request->user()->instituicaoId()))
            ->when($search, fn ($q) => $q->where(function ($q) use ($search) {
                $term = '%'.$search.'%';
                $q->where('nome_fantasia', 'ilike', $term)
                    ->orWhere('endereco_completo', 'ilike', $term)
                    ->orWhereHas('causas', fn ($q) => $q->where('nome', 'ilike', $term));
            }))
            ->when($causaId, fn ($q) => $q->whereHas('causas', fn ($q) => $q->where('causas.id', $causaId)))
            ->orderBy('nome_fantasia')
            ->simplePaginate(12);

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
