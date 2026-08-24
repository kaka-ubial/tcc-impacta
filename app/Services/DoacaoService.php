<?php

namespace App\Services;

use App\Exceptions\DoacaoException;
use App\Models\Agendamento;
use App\Models\Doacao;
use App\Models\HorarioDisponivel;
use App\Models\ItemDoacao;
use App\Models\Notificacao;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Regras de negócio do fluxo de doação do doador. Extraído de
 * Doador\DoacaoController para que a UI Inertia e a API REST reaproveitem
 * exatamente a mesma lógica (transações, transições de status, notificações).
 */
class DoacaoService
{
    /**
     * @param  array{instituicao_id:int, itens:array<int, array{necessidade_id?:int|null, categoria_id:int, quantidade:int, descricao?:string|null}>, agendamento:array{tipo:string, data_hora:string, horario_disponivel_id?:int|null, endereco_referencia?:string|null}}  $validated
     *
     * @throws DoacaoException se a instituição não tiver horários disponíveis cadastrados
     */
    public function store(array $validated, User $doadorUser): Doacao
    {
        $doadorId = $doadorUser->doador->usuario_id;

        $temHorarios = HorarioDisponivel::where('instituicao_id', $validated['instituicao_id'])
            ->where('ativo', true)
            ->exists();

        if (! $temHorarios) {
            throw new DoacaoException('Esta instituição ainda não cadastrou horários disponíveis para receber doações.');
        }

        $doacao = DB::transaction(function () use ($validated, $doadorId) {
            $doacao = Doacao::create([
                'doador_id' => $doadorId,
                'instituicao_id' => $validated['instituicao_id'],
                'status' => 'pendente',
            ]);

            foreach ($validated['itens'] as $item) {
                ItemDoacao::create([
                    'doacao_id' => $doacao->id,
                    'necessidade_id' => $item['necessidade_id'] ?? null,
                    'categoria_id' => $item['categoria_id'],
                    'quantidade' => $item['quantidade'],
                    'descricao' => $item['descricao'] ?? null,
                ]);
            }

            Agendamento::create([
                'doacao_id' => $doacao->id,
                'horario_disponivel_id' => $validated['agendamento']['horario_disponivel_id'] ?? null,
                'data_hora' => $validated['agendamento']['data_hora'],
                'tipo' => $validated['agendamento']['tipo'],
                'endereco_referencia' => $validated['agendamento']['endereco_referencia'] ?? null,
            ]);

            return $doacao;
        });

        Notificacao::enviar(
            $validated['instituicao_id'],
            'Nova solicitação de doação',
            $doadorUser->doador->nome_completo.' enviou uma nova solicitação de doação.'
        );

        return $doacao->fresh(['instituicao', 'itens.categoria', 'agendamento']);
    }

    public function cancel(Doacao $doacao, User $doadorUser): void
    {
        abort_if($doacao->doador_id !== $doadorUser->doador->usuario_id, 403);
        abort_if(! in_array($doacao->status, ['pendente', 'confirmada']), 422);

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
            $doadorUser->doador->nome_completo.' cancelou uma solicitação de doação.'
        );
    }

    public function aceitarSugestao(Doacao $doacao, User $doadorUser): void
    {
        abort_if($doacao->doador_id !== $doadorUser->doador->usuario_id, 403);

        $agendamento = $doacao->agendamento;
        abort_if(! $agendamento || $agendamento->status !== 'alteracao_sugerida', 422);

        $agendamento->update([
            'data_hora' => $agendamento->data_hora_sugerida,
            'data_hora_sugerida' => null,
            'status' => 'confirmado',
        ]);

        Notificacao::enviar(
            $doacao->instituicao_id,
            'Nova data aceita',
            $doadorUser->doador->nome_completo.' aceitou a nova data sugerida.'
        );
    }

    public function recusarSugestao(Doacao $doacao, User $doadorUser): void
    {
        abort_if($doacao->doador_id !== $doadorUser->doador->usuario_id, 403);

        $agendamento = $doacao->agendamento;
        abort_if(! $agendamento || $agendamento->status !== 'alteracao_sugerida', 422);

        $agendamento->update([
            'data_hora_sugerida' => null,
            'status' => 'confirmado',
        ]);

        Notificacao::enviar(
            $doacao->instituicao_id,
            'Nova data recusada',
            $doadorUser->doador->nome_completo.' recusou a nova data sugerida.'
        );
    }

    public function confirm(Doacao $doacao, User $instituicaoUser): void
    {
        abort_if($doacao->instituicao_id !== $instituicaoUser->instituicao->usuario_id, 403);
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
            $instituicaoUser->instituicao->nome_fantasia.' confirmou a sua solicitação de doação.'
        );
    }

    public function reject(Doacao $doacao, User $instituicaoUser): void
    {
        abort_if($doacao->instituicao_id !== $instituicaoUser->instituicao->usuario_id, 403);
        abort_if($doacao->status !== 'pendente', 422);

        $doacao->update(['status' => 'recusada']);

        Notificacao::enviar(
            $doacao->doador_id,
            'Doação recusada',
            $instituicaoUser->instituicao->nome_fantasia.' recusou a sua solicitação de doação.'
        );
    }

    public function deliver(Doacao $doacao, User $instituicaoUser): void
    {
        abort_if($doacao->instituicao_id !== $instituicaoUser->instituicao->usuario_id, 403);
        abort_if($doacao->status !== 'confirmada', 422);

        $doacao->update(['status' => 'entregue', 'data_entrega' => now()]);

        Notificacao::enviar(
            $doacao->doador_id,
            'Doação concluída',
            $instituicaoUser->instituicao->nome_fantasia.' marcou a sua doação como entregue.'
        );
    }

    public function notDelivered(Doacao $doacao, User $instituicaoUser): void
    {
        abort_if($doacao->instituicao_id !== $instituicaoUser->instituicao->usuario_id, 403);
        abort_if($doacao->status !== 'confirmada', 422);

        DB::transaction(function () use ($doacao) {
            foreach ($doacao->itens()->whereNotNull('necessidade_id')->with('necessidade')->get() as $item) {
                $item->necessidade->decrement('quantidade_atual', $item->quantidade);
            }
            $doacao->update(['status' => 'nao_entregue']);
        });

        Notificacao::enviar(
            $doacao->doador_id,
            'Doação não entregue',
            $instituicaoUser->instituicao->nome_fantasia.' marcou a sua doação como não entregue.'
        );
    }
}
