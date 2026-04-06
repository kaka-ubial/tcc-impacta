<?php

namespace App\Http\Controllers\Instituicao;

use App\Http\Controllers\Controller;
use App\Models\Instituicao;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InstituicaoController extends Controller
{
    public function index(Request $request): Response
    {
        $instituicoes = Instituicao::with('causas')
            ->withCount(['necessidades as necessidades_ativas_count' => function ($query) {
                $query->whereColumn('quantidade_atual', '<', 'quantidade_objetivo');
            }])
            ->visible()
            ->when($request->search, fn ($q) => $q->where('nome_fantasia', 'like', '%'.$request->search.'%'))
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

        return Inertia::render('instituicoes/index', [
            'instituicoes' => $instituicoes,
            'filters' => ['search' => $request->search ?? ''],
        ]);
    }

    public function show(int $id): Response
    {
        $instituicao = Instituicao::with([
            'causas',
            'necessidades' => fn ($q) => $q->whereColumn('quantidade_atual', '<', 'quantidade_objetivo'),
            'necessidades.categoria',
        ])->findOrFail($id);

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
            ],
        ]);
    }
}
