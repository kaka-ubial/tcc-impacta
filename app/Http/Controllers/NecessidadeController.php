<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Necessidade;
use App\Models\CategoriaItem;
use App\Http\Requests\NecessidadeRequest;
use Inertia\Inertia;
use Inertia\Response;

class NecessidadeController extends Controller
{
    public function index(Request $request): Response {
        $user = $request -> user();

        if ($user->instituicao) {
            $necessidades = Necessidade::with(['categoria'])
            ->where('instituicao_id', $user->instituicao->usuario_id)
            ->get();
        } else {
            $necessidades = Necessidade::with(['categoria', 'instituicao'])->get();
        }

        return Inertia::render('instituicao/necessidades', [
            'necessidades' => $necessidades,
            'necessidades_count' => $user->instituicao
                ? $user->instituicao->necessidades()->count()
                : 0,
            'tem_horarios' => $user->instituicao
                ? $user->instituicao->horarios()->where('ativo', true)->exists()
                : false,
            'categorias' => CategoriaItem::all(),
            'auth' => [
                'user' => $request->user()->load(['doador', 'instituicao']),
            ]
        ]);
    }

    public function create(Request $request): Response {
        return Inertia::render('Necessidades/Create', [
            'categorias' => CategoriaItem::all(),
            'auth' => [
                'user' => $request->user()->load(['doador', 'instituicao']),
            ]
        ]);
    }

    public function store(NecessidadeRequest $request) {
        $instituicao = $request->user()->instituicao;

        if ($instituicao->horarios()->where('ativo', true)->doesntExist()) {
            return redirect()->route('instituicao.horarios.index')
                ->with('error', 'Cadastre ao menos um horário disponível antes de criar necessidades.');
        }

        $data = $request->validated();

        $data['instituicao_id'] = $instituicao->usuario_id;
        $data['quantidade_atual'] = 0;

        Necessidade::create($data);

        return redirect()->route('instituicao.necessidades.index')->with('success', 'Necessidade criada com sucesso!');
    }

    public function update(NecessidadeRequest $request, $id) {
        $necessidade = $request->get('necessidade');

        $necessidade->update($request->validated());

        return redirect()->route('instituicao.necessidades.index');
    }

    public function destroy(Request $request, $id) {
        $necessidade = $request->get('necessidade');

        $necessidade->delete();

        return redirect()->back();
    }
}
