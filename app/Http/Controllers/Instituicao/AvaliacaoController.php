<?php

namespace App\Http\Controllers\Instituicao;

use App\Http\Controllers\Controller;
use App\Models\Avaliacao;
use App\Models\Doacao;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class AvaliacaoController extends Controller
{
    public function store(Request $request, Doacao $doacao): RedirectResponse
    {
        $instituicaoId = auth()->user()->instituicao->usuario_id;

        abort_if($doacao->instituicao_id !== $instituicaoId, 403);
        abort_if($doacao->status !== 'entregue', 422);
        abort_if($doacao->avaliacao()->exists(), 422);

        $validated = $request->validate([
            'nota'      => ['required', 'integer', 'min:1', 'max:5'],
            'descricao' => ['nullable', 'string', 'max:1000', 'required_if:nota,1', 'required_if:nota,2', 'required_if:nota,3'],
        ]);

        Avaliacao::create([
            'usuario_id' => auth()->id(),
            'doacao_id'  => $doacao->id,
            'nota'       => $validated['nota'],
            'descricao'  => $validated['descricao'] ?? null,
        ]);

        return back();
    }
}
