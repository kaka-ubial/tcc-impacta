<?php

namespace App\Http\Controllers\Instituicao;

use App\Http\Controllers\Controller;
use App\Models\Doacao;
use App\Models\Notificacao;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DoacaoController extends Controller
{
    public function index(): Response
    {
        $instituicaoId = auth()->user()->instituicao->usuario_id;

        $doacoes = Doacao::with(['doador', 'itens.categoria', 'agendamento', 'avaliacao'])
            ->where('instituicao_id', $instituicaoId)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn (Doacao $d) => [
                'id'     => $d->id,
                'status' => $d->status,
                'doador' => [
                    'usuario_id'  => $d->doador->usuario_id,
                    'nome'        => $d->doador->nome_completo,
                    'telefone'    => $d->doador->telefone,
                    'foto_perfil' => $d->doador->foto_perfil,
                ],
                'itens' => $d->itens->map(fn ($item) => [
                    'id'           => $item->id,
                    'categoria'    => $item->categoria->nome,
                    'quantidade'   => $item->quantidade,
                    'descricao'    => $item->descricao,
                ]),
                'agendamento' => $d->agendamento ? [
                    'data_hora'           => $d->agendamento->data_hora->toIso8601String(),
                    'tipo'                => $d->agendamento->tipo,
                    'endereco_referencia' => $d->agendamento->endereco_referencia,
                ] : null,
                'criado_em'  => $d->created_at->toIso8601String(),
                'avaliacao'  => $d->avaliacao ? ['nota' => $d->avaliacao->nota] : null,
            ]);

        return Inertia::render('instituicao/doacoes', [
            'doacoes' => $doacoes,
        ]);
    }

    public function confirm(Doacao $doacao): \Illuminate\Http\RedirectResponse
    {
        abort_if($doacao->instituicao_id !== auth()->user()->instituicao->usuario_id, 403);
        abort_if($doacao->status !== 'pendente', 422);

        DB::transaction(function () use ($doacao) {
            $doacao->update(['status' => 'confirmada']);

            foreach ($doacao->itens()->whereNotNull('necessidade_id')->with('necessidade')->get() as $item) {
                $item->necessidade->increment('quantidade_atual', $item->quantidade);
            }
        });

        Notificacao::enviar(
            $doacao->doador_id,
            'Doação confirmada',
            auth()->user()->instituicao->nome_fantasia.' confirmou a sua solicitação de doação.'
        );

        return back();
    }

    public function reject(Doacao $doacao): \Illuminate\Http\RedirectResponse
    {
        abort_if($doacao->instituicao_id !== auth()->user()->instituicao->usuario_id, 403);
        abort_if($doacao->status !== 'pendente', 422);

        $doacao->update(['status' => 'recusada']);

        Notificacao::enviar(
            $doacao->doador_id,
            'Doação recusada',
            auth()->user()->instituicao->nome_fantasia.' recusou a sua solicitação de doação.'
        );

        return back();
    }

    public function deliver(Doacao $doacao): \Illuminate\Http\RedirectResponse
    {
        abort_if($doacao->instituicao_id !== auth()->user()->instituicao->usuario_id, 403);
        abort_if($doacao->status !== 'confirmada', 422);

        $doacao->update(['status' => 'entregue']);

        Notificacao::enviar(
            $doacao->doador_id,
            'Doação concluída',
            auth()->user()->instituicao->nome_fantasia.' marcou a sua doação como entregue.'
        );

        return back();
    }

    public function notDelivered(Doacao $doacao): \Illuminate\Http\RedirectResponse
    {
        abort_if($doacao->instituicao_id !== auth()->user()->instituicao->usuario_id, 403);
        abort_if($doacao->status !== 'confirmada', 422);

        DB::transaction(function () use ($doacao) {
            if ($doacao->status === 'confirmada') {
                foreach ($doacao->itens()->whereNotNull('necessidade_id')->with('necessidade')->get() as $item) {
                    $item->necessidade->decrement('quantidade_atual', $item->quantidade);
                }
            }
            $doacao->update(['status' => 'nao_entregue']);
        });

        Notificacao::enviar(
            $doacao->doador_id,
            'Doação não entregue',
            auth()->user()->instituicao->nome_fantasia.' marcou a sua doação como não entregue.'
        );

        return back();
    }
}
