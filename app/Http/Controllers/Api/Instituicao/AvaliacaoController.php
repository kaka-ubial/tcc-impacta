<?php

namespace App\Http\Controllers\Api\Instituicao;

use App\Http\Controllers\Controller;
use App\Http\Requests\Instituicao\StoreAvaliacaoRequest;
use App\Http\Resources\AvaliacaoResource;
use App\Models\Doacao;
use App\Services\AvaliacaoService;
use Dedoc\Scramble\Attributes\Group;

/**
 * Contraparte REST/JSON de Instituicao\AvaliacaoController. Reaproveita o
 * mesmo AvaliacaoService usado pela UI Inertia.
 */
#[Group('Avaliações (Instituição)')]
class AvaliacaoController extends Controller
{
    public function __construct(private readonly AvaliacaoService $avaliacoes) {}

    /**
     * Avaliar doação
     *
     * Registra a avaliação da instituição sobre uma doação entregue.
     */
    public function store(StoreAvaliacaoRequest $request, Doacao $doacao)
    {
        $avaliacao = $this->avaliacoes->store($request->validated(), $doacao, $request->user());

        return (new AvaliacaoResource($avaliacao))
            ->response()
            ->setStatusCode(201);
    }
}
