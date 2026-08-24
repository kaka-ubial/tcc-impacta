<?php

namespace App\Http\Controllers\Instituicao;

use App\Http\Controllers\Controller;
use App\Models\Doacao;
use App\Services\AvaliacaoService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class AvaliacaoController extends Controller
{
    public function __construct(private readonly AvaliacaoService $avaliacoes) {}

    public function store(Request $request, Doacao $doacao): RedirectResponse
    {
        $validated = $request->validate([
            'nota' => ['required', 'integer', 'min:1', 'max:5'],
            'descricao' => ['string', 'max:1000', 'required'],
        ]);

        $this->avaliacoes->store($validated, $doacao, auth()->user());

        return back();
    }
}
