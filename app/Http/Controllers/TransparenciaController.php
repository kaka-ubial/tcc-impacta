<?php

namespace App\Http\Controllers;

use App\Models\Doacao;
use App\Models\Instituicao;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TransparenciaController extends Controller
{
    private const POR_PAGINA = 20;

    public function index(Request $request): Response
    {
        $filtros = $request->validate([
            'instituicao' => ['nullable', 'integer', 'exists:instituicao,usuario_id'],
            'de'          => ['nullable', 'date'],
            'ate'         => ['nullable', 'date', 'after_or_equal:de'],
        ]);

        $doacoes = Doacao::query()
            ->publicas()
            ->with([
                'instituicao:usuario_id,nome_fantasia',
                'doador:usuario_id,nome_completo,exibir_em_transparencia',
                'itens:id,doacao_id,categoria_id,descricao,quantidade',
                'itens.categoria:id,nome',
            ])
            ->when($filtros['instituicao'] ?? null, fn ($q, $id) => $q->where('instituicao_id', $id))
            ->when($filtros['de'] ?? null, fn ($q, $de) => $q->whereDate('data_entrega', '>=', $de))
            ->when($filtros['ate'] ?? null, fn ($q, $ate) => $q->whereDate('data_entrega', '<=', $ate))
            ->orderByDesc('data_entrega')
            ->orderByDesc('id')
            ->paginate(self::POR_PAGINA)
            ->withQueryString()
            ->through(fn (Doacao $doacao) => [
                'id'           => $doacao->id,
                'data_entrega' => $doacao->data_entrega?->toDateString(),
                'instituicao'  => $doacao->instituicao?->nome_fantasia,
                'doador'       => $doacao->doador?->exibir_em_transparencia
                    ? $doacao->doador->nome_completo
                    : null,
                'itens'        => $doacao->itens->map(fn ($item) => [
                    'categoria'   => $item->categoria?->nome,
                    'descricao'   => $item->descricao,
                    'quantidade'  => $item->quantidade,
                ])->values(),
            ]);

        return Inertia::render('transparencia', [
            'doacoes'      => $doacoes,
            'filtros'      => $filtros,
            'instituicoes' => Instituicao::where('status', 'approved')
                ->orderBy('nome_fantasia')
                ->get(['usuario_id', 'nome_fantasia']),
            'total'        => Doacao::publicas()->count(),
        ]);
    }
}
