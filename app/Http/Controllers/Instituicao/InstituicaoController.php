<?php

namespace App\Http\Controllers\Instituicao;

use App\Http\Controllers\Controller;
use App\Models\CategoriaItem;
use App\Models\Causa;
use App\Models\Instituicao;
use App\Services\RecommendationService;
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
                ->where('usuario_id', '!=', auth()->user()->instituicao->usuario_id))
            ->when($search, fn ($q) => $q->where(function ($q) use ($search) {
                $term = '%'.$search.'%';
                $q->where('nome_fantasia', 'ilike', $term)
                    ->orWhere('endereco_completo', 'ilike', $term)
                    ->orWhereHas('causas', fn ($q) => $q->where('nome', 'ilike', $term));
            }))
            ->when($causaId, fn ($q) => $q->whereHas('causas', fn ($q) => $q->where('causas.id', $causaId)))
            ->orderBy('nome_fantasia')
            ->simplePaginate(12)
            ->through(fn ($inst) => [
                'usuario_id' => $inst->usuario_id,
                'nome_fantasia' => $inst->nome_fantasia,
                'endereco_completo' => $inst->endereco_completo,
                'verificada' => $inst->isApproved(),
                'causas' => $inst->causas->map(fn ($c) => ['id' => $c->id, 'nome' => $c->nome, 'icone' => $c->icone]),
                'necessidades_ativas_count' => $inst->necessidades_ativas_count,
            ]);

        $isFiltering = $search !== '' || $causaId !== null;

        return Inertia::render('instituicoes/index', [
            'instituicoes' => $instituicoes,
            'causas' => Causa::orderBy('nome')->get(['id', 'nome', 'icone']),
            'filters' => [
                'search' => $search,
                'causa' => $causaId,
            ],
            'recomendacoes' => (!$isFiltering && auth()->user()->tipo_usuario === 'doador')
                ? $recommendations->forDonor(auth()->user())
                : [],
        ]);
    }

    public function show(int $id): Response
    {
        $instituicao = Instituicao::with([
            'causas',
            'necessidades' => fn ($q) => $q->whereColumn('quantidade_atual', '<', 'quantidade_objetivo'),
            'necessidades.categoria',
            'horarios' => fn ($q) => $q->where('ativo', true)->orderBy('dia_semana')->orderBy('hora_inicio'),
        ])->findOrFail($id);

        $categorias = CategoriaItem::orderBy('nome')->get(['id', 'nome']);

        return Inertia::render('instituicoes/show', [
            'instituicao' => [
                'usuario_id' => $instituicao->usuario_id,
                'nome_fantasia' => $instituicao->nome_fantasia,
                'razao_social' => $instituicao->razao_social,
                'verificada' => $instituicao->isApproved(),
                'cnpj' => $instituicao->cnpj,
                'telefone' => $instituicao->telefone,
                'endereco_completo' => $instituicao->endereco_completo,
                'descricao' => $instituicao->descricao,
                'latitude' => $instituicao->latitude,
                'longitude' => $instituicao->longitude,
                'causas' => $instituicao->causas->map(fn ($c) => ['id' => $c->id, 'nome' => $c->nome, 'icone' => $c->icone]),
                'necessidades_ativas' => $instituicao->necessidades->map(fn ($n) => [
                    'id' => $n->id,
                    'descricao' => $n->descricao,
                    'quantidade_objetivo' => $n->quantidade_objetivo,
                    'quantidade_atual' => $n->quantidade_atual,
                    'prioridade' => $n->prioridade,
                    'categoria' => ['id' => $n->categoria->id, 'nome' => $n->categoria->nome],
                ])->values(),
                'horarios_disponiveis' => $instituicao->horarios->map(fn ($h) => [
                    'id' => $h->id,
                    'dia_semana' => $h->dia_semana,
                    'hora_inicio' => $h->hora_inicio,
                    'hora_fim' => $h->hora_fim,
                    'tipo' => $h->tipo,
                ])->values(),
            ],
            'categorias'   => $categorias,
            'canTransfer'  => auth()->user()->tipo_usuario === 'instituicao',
            'estoque'      => auth()->user()->tipo_usuario === 'instituicao'
                ? TransferenciaController::calcularEstoque(auth()->user()->instituicao->usuario_id)
                : [],
        ]);
    }
}
