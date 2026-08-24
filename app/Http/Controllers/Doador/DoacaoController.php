<?php

namespace App\Http\Controllers\Doador;

use App\Exceptions\DoacaoException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Doador\StoreDoacaoRequest;
use App\Models\Doacao;
use App\Services\DoacaoService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class DoacaoController extends Controller
{
    public function __construct(private readonly DoacaoService $doacoes) {}

    public function index(): Response
    {
        $user = auth()->user();
        $doadorId = $user->doador->usuario_id;

        $doacoes = Doacao::with(['instituicao', 'itens.categoria', 'agendamento', 'avaliacao'])
            ->where('doador_id', $doadorId)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn (Doacao $d) => [
                'id' => $d->id,
                'status' => $d->status,
                'instituicao' => [
                    'id' => $d->instituicao->usuario_id,
                    'nome_fantasia' => $d->instituicao->nome_fantasia,
                ],
                'itens' => $d->itens->map(fn ($item) => [
                    'id' => $item->id,
                    'categoria' => $item->categoria->nome,
                    'quantidade' => $item->quantidade,
                    'descricao' => $item->descricao,
                ]),
                'agendamento' => $d->agendamento ? [
                    'data_hora' => $d->agendamento->data_hora->toIso8601String(),
                    'tipo' => $d->agendamento->tipo,
                    'endereco_referencia' => $d->agendamento->endereco_referencia,
                    'status' => $d->agendamento->status,
                    'data_hora_sugerida' => $d->agendamento->data_hora_sugerida?->toIso8601String(),
                ] : null,
                'criado_em' => $d->created_at->toIso8601String(),
                'avaliacao' => $d->avaliacao ? ['nota' => $d->avaliacao->nota, 'descricao' => $d->avaliacao->descricao] : null,
            ]);

        return Inertia::render('doador/doacoes', [
            'doacoes' => $doacoes,
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
