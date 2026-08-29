<?php

namespace App\Http\Controllers\Instituicao;

use App\Http\Controllers\Controller;
use App\Http\Requests\Instituicao\StoreAvaliacaoRequest;
use App\Models\Doacao;
use App\Services\AvaliacaoService;
use Illuminate\Http\RedirectResponse;

class AvaliacaoController extends Controller
{
    public function __construct(private readonly AvaliacaoService $avaliacoes) {}

    public function store(StoreAvaliacaoRequest $request, Doacao $doacao): RedirectResponse
    {
        $this->avaliacoes->store($request->validated(), $doacao, auth()->user());

        return back();
    }
}
