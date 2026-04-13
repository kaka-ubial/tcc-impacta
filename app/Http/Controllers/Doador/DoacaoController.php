<?php

namespace App\Http\Controllers\Doador;

use App\Http\Controllers\Controller;
use App\Http\Requests\Doador\StoreDoacaoRequest;
use App\Models\Agendamento;
use App\Models\Doacao;
use App\Models\ItemDoacao;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DoacaoController extends Controller
{
    public function index(): Response
    {
        $doadorId = auth()->user()->doador->usuario_id;

        $doacoes = Doacao::with(['instituicao', 'itens.categoria', 'agendamento'])
            ->where('doador_id', $doadorId)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn (Doacao $d) => [
                'id'     => $d->id,
                'status' => $d->status,
                'instituicao' => [
                    'id'           => $d->instituicao->usuario_id,
                    'nome_fantasia' => $d->instituicao->nome_fantasia,
                ],
                'itens' => $d->itens->map(fn ($item) => [
                    'id'        => $item->id,
                    'categoria' => $item->categoria->nome,
                    'quantidade' => $item->quantidade,
                    'descricao' => $item->descricao,
                ]),
                'agendamento' => $d->agendamento ? [
                    'data_hora'           => $d->agendamento->data_hora->toIso8601String(),
                    'tipo'                => $d->agendamento->tipo,
                    'endereco_referencia' => $d->agendamento->endereco_referencia,
                ] : null,
                'criado_em' => $d->created_at->toIso8601String(),
            ]);

        return Inertia::render('doador/doacoes', [
            'doacoes' => $doacoes,
        ]);
    }

    public function cancel(Doacao $doacao): \Illuminate\Http\RedirectResponse
    {
        abort_if($doacao->doador_id !== auth()->user()->doador->usuario_id, 403);
        abort_if(!in_array($doacao->status, ['pendente', 'confirmada']), 422);

        DB::transaction(function () use ($doacao) {
            if ($doacao->status === 'confirmada') {
                foreach ($doacao->itens()->whereNotNull('necessidade_id')->with('necessidade')->get() as $item) {
                    $item->necessidade->decrement('quantidade_atual', $item->quantidade);
                }
            }
            $doacao->update(['status' => 'cancelado']);
        });

        return back();
    }

    public function store(StoreDoacaoRequest $request)
    {
        $validated = $request->validated();
        $doadorId = auth()->user()->doador->usuario_id;

        DB::transaction(function () use ($validated, $doadorId) {
            $doacao = Doacao::create([
                'doador_id'      => $doadorId,
                'instituicao_id' => $validated['instituicao_id'],
                'status'         => 'pendente',
            ]);

            foreach ($validated['itens'] as $item) {
                ItemDoacao::create([
                    'doacao_id'      => $doacao->id,
                    'necessidade_id' => $item['necessidade_id'] ?? null,
                    'categoria_id'   => $item['categoria_id'],
                    'quantidade'     => $item['quantidade'],
                    'descricao'      => $item['descricao'] ?? null,
                ]);
            }

            Agendamento::create([
                'doacao_id'           => $doacao->id,
                'data_hora'           => $validated['agendamento']['data_hora'],
                'tipo'                => $validated['agendamento']['tipo'],
                'endereco_referencia' => $validated['agendamento']['endereco_referencia'] ?? null,
            ]);
        });

        return back()->with('success', 'Solicitação de doação enviada com sucesso!');
    }
}
