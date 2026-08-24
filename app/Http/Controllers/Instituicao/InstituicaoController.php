<?php

namespace App\Http\Controllers\Instituicao;

use App\Http\Controllers\Controller;
use App\Http\Resources\InstituicaoListResource;
use App\Http\Resources\InstituicaoShowResource;
use App\Models\CategoriaItem;
use App\Models\Causa;
use App\Models\Instituicao;
use App\Services\RecommendationService;
use App\Services\TransferenciaService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InstituicaoController extends Controller
{
    public function index(Request $request, RecommendationService $recommendations): Response
    {
        $search = $request->string('search')->trim()->value();
        $causaId = $request->integer('causa') ?: null;

        $instituicoes = Instituicao::with('causas')
            ->withCount(['necessidades as necessidades_ativas_count' => function ($query) {
                $query->whereColumn('quantidade_atual', '<', 'quantidade_objetivo');
            }])
            ->visible()
            ->when(auth()->user()->tipo_usuario === 'instituicao', fn ($q) => $q
                ->where('usuario_id', '!=', auth()->user()->instituicaoId()))
            ->when($search, fn ($q) => $q->where(function ($q) use ($search) {
                $term = '%'.$search.'%';
                $q->where('nome_fantasia', 'ilike', $term)
                    ->orWhere('endereco_completo', 'ilike', $term)
                    ->orWhereHas('causas', fn ($q) => $q->where('nome', 'ilike', $term));
            }))
            ->when($causaId, fn ($q) => $q->whereHas('causas', fn ($q) => $q->where('causas.id', $causaId)))
            ->orderBy('nome_fantasia')
            ->simplePaginate(12)
            ->through(fn ($inst) => (new InstituicaoListResource($inst))->resolve($request));

        $isFiltering = $search !== '' || $causaId !== null;

        return Inertia::render('instituicoes/index', [
            'instituicoes' => $instituicoes,
            'causas' => Causa::orderBy('nome')->get(['id', 'nome', 'icone']),
            'filters' => [
                'search' => $search,
                'causa' => $causaId,
            ],
            'recomendacoes' => (! $isFiltering && auth()->user()->tipo_usuario === 'doador')
                ? $recommendations->forDonor(auth()->user())
                : [],
        ]);
    }

    public function show(Request $request, int $id): Response
    {
        $instituicao = Instituicao::with([
            'causas',
            'necessidades' => fn ($q) => $q->whereColumn('quantidade_atual', '<', 'quantidade_objetivo'),
            'necessidades.categoria',
            'horarios' => fn ($q) => $q->where('ativo', true)->orderBy('dia_semana')->orderBy('hora_inicio'),
        ])->findOrFail($id);

        $categorias = CategoriaItem::orderBy('nome')->get(['id', 'nome']);

        return Inertia::render('instituicoes/show', [
            'instituicao' => (new InstituicaoShowResource($instituicao))->resolve($request),
            'categorias' => $categorias,
            'canTransfer' => auth()->user()->tipo_usuario === 'instituicao',
            'estoque' => auth()->user()->tipo_usuario === 'instituicao'
                ? TransferenciaService::calcularEstoque(auth()->user()->instituicaoId())
                : [],
        ]);
    }
}
