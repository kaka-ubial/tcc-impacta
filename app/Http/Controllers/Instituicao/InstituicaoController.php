<?php

namespace App\Http\Controllers\Instituicao;

use App\Enums\UserType;
use App\Http\Controllers\Controller;
use App\Http\Resources\InstituicaoListResource;
use App\Http\Resources\InstituicaoShowResource;
use App\Models\CategoriaItem;
use App\Models\Causa;
use App\Models\Instituicao;
use App\Services\InstituicaoQueryService;
use App\Services\RecommendationService;
use App\Services\TransferenciaService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InstituicaoController extends Controller
{
    public function index(
        Request $request,
        InstituicaoQueryService $query,
        RecommendationService $recommendations
    ): Response {
        $search = $request->string('search')->trim()->value();
        $causaId = $request->integer('causa') ?: null;
        $categoriaId = $request->integer('categoria') ?: null;
        $raioKm = $request->integer('raio') ?: null;

        $filters = [
            'search' => $search,
            'causa' => $causaId,
            'categoria' => $categoriaId,
            'raio' => $raioKm,
        ];

        $instituicoes = $query->search($request->user(), $filters)
            ->through(fn ($inst) => (new InstituicaoListResource($inst))->resolve($request));

        $doador = $request->user()->tipo_usuario === UserType::Doador ? $request->user()->doador : null;
        $isFiltering = $search !== '' || $causaId !== null || $categoriaId !== null || $raioKm !== null;

        return Inertia::render('instituicoes/index', [
            'instituicoes' => $instituicoes,
            'causas' => Causa::orderBy('nome')->get(['id', 'nome', 'icone']),
            'categorias' => CategoriaItem::orderBy('nome')->get(['id', 'nome']),
            'hasLocation' => $doador !== null && $doador->latitude !== null && $doador->longitude !== null,
            'filters' => $filters,
            'recomendacoes' => (! $isFiltering && $request->user()->tipo_usuario === UserType::Doador)
                ? $recommendations->forDonor($request->user())
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
            'canTransfer' => auth()->user()->tipo_usuario === UserType::Instituicao,
            'estoque' => auth()->user()->tipo_usuario === UserType::Instituicao
                ? TransferenciaService::calcularEstoque(auth()->user()->instituicaoId())
                : [],
        ]);
    }
}
