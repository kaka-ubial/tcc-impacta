<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\NecessidadeRequest;
use App\Http\Resources\NecessidadeResource;
use App\Models\Necessidade;
use App\Services\NecessidadeService;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Contraparte REST/JSON de NecessidadeController. Reaproveita o mesmo
 * NecessidadeService e o mesmo NecessidadeRequest usados pela UI Inertia.
 */
#[Group('Necessidades (Instituição)')]
class NecessidadeController extends Controller
{
    public function __construct(private readonly NecessidadeService $necessidades) {}

    /**
     * Listar necessidades
     *
     * Lista as necessidades cadastradas pela instituição autenticada.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $necessidades = Necessidade::with('categoria')
            ->where('instituicao_id', $request->user()->instituicaoId())
            ->get();

        return NecessidadeResource::collection($necessidades);
    }

    /**
     * Criar necessidade
     *
     * Cadastra uma nova necessidade para a instituição autenticada.
     */
    public function store(NecessidadeRequest $request)
    {
        $necessidade = $this->necessidades->store($request->validated(), $request->user()->instituicao);

        return (new NecessidadeResource($necessidade))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Atualizar necessidade
     *
     * Atualiza uma necessidade existente da instituição autenticada.
     */
    public function update(NecessidadeRequest $request, $id)
    {
        $necessidade = $this->necessidades->update($request->get('necessidade'), $request->validated());

        return new NecessidadeResource($necessidade);
    }

    /**
     * Remover necessidade
     *
     * Remove uma necessidade da instituição autenticada.
     */
    public function destroy(Request $request, $id)
    {
        $this->necessidades->destroy($request->get('necessidade'));

        return response()->json(null, 204);
    }
}
