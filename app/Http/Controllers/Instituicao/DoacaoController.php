<?php

namespace App\Http\Controllers\Instituicao;

use App\Http\Controllers\Controller;
use App\Http\Resources\HorarioResource;
use App\Http\Resources\InstituicaoDoacaoResource;
use App\Models\CategoriaItem;
use App\Models\Doacao;
use App\Models\HorarioDisponivel;
use App\Services\DoacaoService;
use App\Services\TransferenciaService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DoacaoController extends Controller
{
    public function __construct(private readonly DoacaoService $doacoes) {}

    public function index(Request $request): Response
    {
        $instituicaoId = auth()->user()->instituicaoId();

        $doacoes = Doacao::with(['doador', 'itens.categoria', 'agendamento', 'avaliacao'])
            ->where('instituicao_id', $instituicaoId)
            ->orderBy('created_at', 'desc')
            ->get();

        $estoque = TransferenciaService::calcularEstoque($instituicaoId);
        $categoriaIds = array_keys($estoque);
        $categorias = CategoriaItem::whereIn('id', $categoriaIds)->pluck('nome', 'id');

        $itensRecebidos = collect($estoque)->map(fn ($qty, $catId) => [
            'categoria_id' => (int) $catId,
            'categoria' => $categorias[$catId] ?? '',
            'quantidade' => $qty,
        ])->values();

        $horarios = HorarioDisponivel::where('instituicao_id', $instituicaoId)
            ->where('ativo', true)
            ->orderBy('dia_semana')
            ->orderBy('hora_inicio')
            ->get();

        return Inertia::render('instituicao/doacoes', [
            'doacoes' => InstituicaoDoacaoResource::collection($doacoes)->resolve($request),
            'itens_recebidos' => $itensRecebidos,
            'horarios' => HorarioResource::collection($horarios)->resolve($request),
        ]);
    }

    public function confirm(Doacao $doacao): RedirectResponse
    {
        $this->doacoes->confirm($doacao, auth()->user());

        return back();
    }

    public function reject(Doacao $doacao): RedirectResponse
    {
        $this->doacoes->reject($doacao, auth()->user());

        return back();
    }

    public function deliver(Doacao $doacao): RedirectResponse
    {
        $this->doacoes->deliver($doacao, auth()->user());

        return back();
    }

    public function notDelivered(Doacao $doacao): RedirectResponse
    {
        $this->doacoes->notDelivered($doacao, auth()->user());

        return back();
    }
}
