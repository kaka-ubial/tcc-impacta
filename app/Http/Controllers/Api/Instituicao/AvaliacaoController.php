<?php

namespace App\Http\Controllers\Api\Instituicao;

use App\Http\Controllers\Controller;
use App\Http\Resources\AvaliacaoResource;
use App\Models\Doacao;
use App\Services\AvaliacaoService;
use Illuminate\Http\Request;

/**
 * Contraparte REST/JSON de Instituicao\AvaliacaoController. Reaproveita o
 * mesmo AvaliacaoService usado pela UI Inertia.
 */
class AvaliacaoController extends Controller
{
    public function __construct(private readonly AvaliacaoService $avaliacoes) {}

    public function store(Request $request, Doacao $doacao)
    {
        $validated = $request->validate([
            'nota' => ['required', 'integer', 'min:1', 'max:5'],
            'descricao' => ['string', 'max:1000', 'required'],
        ]);

        $avaliacao = $this->avaliacoes->store($validated, $doacao, $request->user());

        return (new AvaliacaoResource($avaliacao))
            ->response()
            ->setStatusCode(201);
    }
}
