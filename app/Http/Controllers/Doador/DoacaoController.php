<?php

namespace App\Http\Controllers\Doador;

use App\Http\Controllers\Controller;
use App\Http\Requests\Doador\StoreDoacaoRequest;
use App\Models\Agendamento;
use App\Models\Doacao;
use App\Models\HorarioDisponivel;
use App\Models\ItemDoacao;
use App\Models\Notificacao;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DoacaoController extends Controller
{
    public function index(): Response
    {
        $doadorId = auth()->user()->doador->usuario_id;

        $doacoes = Doacao::with(['instituicao', 'itens.categoria', 'agendamento', 'avaliacao'])
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
                    'status'              => $d->agendamento->status,
                    'data_hora_sugerida'  => $d->agendamento->data_hora_sugerida?->toIso8601String(),
                ] : null,
                'criado_em'  => $d->created_at->toIso8601String(),
                'avaliacao'  => $d->avaliacao ? ['nota' => $d->avaliacao->nota, 'descricao' => $d->avaliacao->descricao] : null,
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

        Notificacao::enviar(
            $doacao->instituicao_id,
            'Doação cancelada',
            auth()->user()->doador->nome_completo.' cancelou uma solicitação de doação.'
        );

        return back();
    }

    public function store(StoreDoacaoRequest $request)
    {
        $validated = $request->validated();
        $doadorId = auth()->user()->doador->usuario_id;

        $temHorarios = HorarioDisponivel::where('instituicao_id', $validated['instituicao_id'])
            ->where('ativo', true)
            ->exists();

        if (! $temHorarios) {
            return back()->with('error', 'Esta instituição ainda não cadastrou horários disponíveis para receber doações.');
        }

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
                'doacao_id'             => $doacao->id,
                'horario_disponivel_id' => $validated['agendamento']['horario_disponivel_id'] ?? null,
                'data_hora'             => $validated['agendamento']['data_hora'],
                'tipo'                  => $validated['agendamento']['tipo'],
                'endereco_referencia'   => $validated['agendamento']['endereco_referencia'] ?? null,
            ]);
        });

        Notificacao::enviar(
            $validated['instituicao_id'],
            'Nova solicitação de doação',
            auth()->user()->doador->nome_completo.' enviou uma nova solicitação de doação.'
        );

        return back()->with('success', 'Solicitação de doação enviada com sucesso!');
    }

    public function aceitarSugestao(Doacao $doacao): \Illuminate\Http\RedirectResponse
    {
        abort_if($doacao->doador_id !== auth()->user()->doador->usuario_id, 403);

        $agendamento = $doacao->agendamento;
        abort_if(! $agendamento || $agendamento->status !== 'alteracao_sugerida', 422);

        $agendamento->update([
            'data_hora'          => $agendamento->data_hora_sugerida,
            'data_hora_sugerida' => null,
            'status'             => 'confirmado',
        ]);

        Notificacao::enviar(
            $doacao->instituicao_id,
            'Nova data aceita',
            auth()->user()->doador->nome_completo.' aceitou a nova data sugerida.'
        );

        return back();
    }

    public function recusarSugestao(Doacao $doacao): \Illuminate\Http\RedirectResponse
    {
        abort_if($doacao->doador_id !== auth()->user()->doador->usuario_id, 403);

        $agendamento = $doacao->agendamento;
        abort_if(! $agendamento || $agendamento->status !== 'alteracao_sugerida', 422);

        $agendamento->update([
            'data_hora_sugerida' => null,
            'status'             => 'confirmado',
        ]);

        Notificacao::enviar(
            $doacao->instituicao_id,
            'Nova data recusada',
            auth()->user()->doador->nome_completo.' recusou a nova data sugerida.'
        );

        return back();
    }
}
