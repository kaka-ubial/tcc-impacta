<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\NecessidadeRequest;
use App\Http\Resources\NecessidadeResource;
use App\Models\Necessidade;
use App\Services\NecessidadeService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Contraparte REST/JSON de NecessidadeController. Reaproveita o mesmo
 * NecessidadeService e o mesmo NecessidadeRequest usados pela UI Inertia.
 */
class NecessidadeController extends Controller
{
    public function __construct(private readonly NecessidadeService $necessidades) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $necessidades = Necessidade::with('categoria')
            ->where('instituicao_id', $request->user()->instituicaoId())
            ->get();

        return NecessidadeResource::collection($necessidades);
    }

    public function store(NecessidadeRequest $request)
    {
        $necessidade = $this->necessidades->store($request->validated(), $request->user()->instituicao);

        return (new NecessidadeResource($necessidade))
            ->response()
            ->setStatusCode(201);
    }

    public function update(NecessidadeRequest $request, $id)
    {
        $necessidade = $this->necessidades->update($request->get('necessidade'), $request->validated());

        return new NecessidadeResource($necessidade);
    }

    public function destroy(Request $request, $id)
    {
        $this->necessidades->destroy($request->get('necessidade'));

        return response()->json(null, 204);
    }
}
