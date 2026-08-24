<?php

namespace App\Http\Controllers\Doador;

use App\Exceptions\DoacaoException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Doador\StoreDoacaoRequest;
use App\Http\Resources\DoacaoResource;
use App\Models\Doacao;
use App\Services\DoacaoService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DoacaoController extends Controller
{
    public function __construct(private readonly DoacaoService $doacoes) {}

    public function index(Request $request): Response
    {
        $doadorId = $request->user()->doadorId();

        $doacoes = Doacao::with(['instituicao', 'itens.categoria', 'agendamento', 'avaliacao'])
            ->where('doador_id', $doadorId)
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('doador/doacoes', [
            'doacoes' => DoacaoResource::collection($doacoes)->resolve($request),
        ]);
    }

    public function cancel(Doacao $doacao): RedirectResponse
    {
        $this->doacoes->cancel($doacao, auth()->user());

        return back();
    }

    public function store(StoreDoacaoRequest $request)
    {
        try {
            $this->doacoes->store($request->validated(), auth()->user());
        } catch (DoacaoException $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Solicitação de doação enviada com sucesso!');
    }

    public function aceitarSugestao(Doacao $doacao): RedirectResponse
    {
        $this->doacoes->aceitarSugestao($doacao, auth()->user());

        return back();
    }

    public function recusarSugestao(Doacao $doacao): RedirectResponse
    {
        $this->doacoes->recusarSugestao($doacao, auth()->user());

        return back();
    }
}
