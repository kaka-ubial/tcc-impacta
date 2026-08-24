<?php

namespace App\Http\Controllers;

use App\Exceptions\NecessidadeException;
use App\Http\Requests\NecessidadeRequest;
use App\Models\CategoriaItem;
use App\Models\Necessidade;
use App\Services\NecessidadeService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NecessidadeController extends Controller
{
    public function __construct(private readonly NecessidadeService $necessidades) {}

    public function index(Request $request): Response
    {
        $user = $request->user();

        if ($user->instituicao) {
            $necessidades = Necessidade::with(['categoria'])
                ->where('instituicao_id', $user->instituicaoId())
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
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('Necessidades/Create', [
            'categorias' => CategoriaItem::all(),
            'auth' => [
                'user' => $request->user()->load(['doador', 'instituicao']),
            ],
        ]);
    }

    public function store(NecessidadeRequest $request)
    {
        try {
            $this->necessidades->store($request->validated(), $request->user()->instituicao);
        } catch (NecessidadeException $e) {
            return redirect()->route('instituicao.horarios.index')->with('error', $e->getMessage());
        }

        return redirect()->route('instituicao.necessidades.index')->with('success', 'Necessidade criada com sucesso!');
    }

    public function update(NecessidadeRequest $request, $id)
    {
        $this->necessidades->update($request->get('necessidade'), $request->validated());

        return redirect()->route('instituicao.necessidades.index');
    }

    public function destroy(Request $request, $id)
    {
        $this->necessidades->destroy($request->get('necessidade'));

        return redirect()->back();
    }
}
