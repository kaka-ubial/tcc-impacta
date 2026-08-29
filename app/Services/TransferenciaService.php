<?php

namespace App\Services;

use App\Enums\DoacaoStatus;
use App\Enums\TransferenciaStatus;
use App\Exceptions\TransferenciaException;
use App\Models\ItemDoacao;
use App\Models\ItemTransferencia;
use App\Models\Notificacao;
use App\Models\Transferencia;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Regras de negócio das transferências de itens entre instituições.
 * Extraído de Instituicao\TransferenciaController para que a UI Inertia e a
 * API REST reaproveitem exatamente a mesma lógica.
 */
class TransferenciaService
{
    /**
     * @param  array{instituicao_destino_id:int, itens:array<int, array{categoria_id:int, necessidade_id?:int|null, quantidade:int, descricao?:string|null}>, agendamento:array{tipo:string, data_hora:string, horario_disponivel_id?:int|null, endereco_referencia?:string|null}}  $validated
     *
     * @throws TransferenciaException se for autotransferência ou a quantidade exceder o estoque disponível
     */
    public function store(array $validated, User $origemUser): Transferencia
    {
        $origemId = $origemUser->instituicaoId();

        if ($origemId === $validated['instituicao_destino_id']) {
            throw new TransferenciaException('Não é possível transferir para si mesmo.');
        }

        $estoque = self::calcularEstoque($origemId);

        foreach ($validated['itens'] as $item) {
            $disponivel = $estoque[$item['categoria_id']] ?? 0;
            if ($item['quantidade'] > $disponivel) {
                throw new TransferenciaException('Quantidade indisponível para transferência.');
            }
        }

        $ag = $validated['agendamento'];

        $transferencia = DB::transaction(function () use ($validated, $origemId, $ag) {
            $t = Transferencia::create([
                'instituicao_origem_id' => $origemId,
                'instituicao_destino_id' => $validated['instituicao_destino_id'],
                'status' => TransferenciaStatus::Pendente,
                'data_hora' => $ag['data_hora'],
                'tipo' => $ag['tipo'],
                'endereco_referencia' => $ag['endereco_referencia'] ?? null,
                'horario_disponivel_id' => $ag['horario_disponivel_id'] ?? null,
            ]);

            foreach ($validated['itens'] as $item) {
                $t->itens()->create($item);
            }

            return $t;
        });

        Notificacao::enviar(
            $validated['instituicao_destino_id'],
            'Nova solicitação de transferência',
            $origemUser->instituicao->nome_fantasia.' enviou uma solicitação de transferência de itens.'
        );

        return $transferencia->fresh(['origem', 'destino', 'itens.categoria']);
    }

    public function confirmar(Transferencia $transferencia, User $destinoUser): void
    {
        abort_if($transferencia->instituicao_destino_id !== $destinoUser->instituicaoId(), 403);
        abort_if($transferencia->status !== TransferenciaStatus::Pendente, 422);

        DB::transaction(function () use ($transferencia) {
            $transferencia->update(['status' => TransferenciaStatus::Confirmada]);

            foreach ($transferencia->itens()->whereNotNull('necessidade_id')->with('necessidade')->get() as $item) {
                $item->necessidade->increment('quantidade_atual', $item->quantidade);
            }
        });

        Notificacao::enviar(
            $transferencia->instituicao_origem_id,
            'Transferência confirmada',
            $destinoUser->instituicao->nome_fantasia.' confirmou a sua solicitação de transferência.'
        );
    }

    public function recusar(Transferencia $transferencia, User $destinoUser): void
    {
        abort_if($transferencia->instituicao_destino_id !== $destinoUser->instituicaoId(), 403);
        abort_if($transferencia->status !== TransferenciaStatus::Pendente, 422);

        $transferencia->update(['status' => TransferenciaStatus::Recusada]);

        Notificacao::enviar(
            $transferencia->instituicao_origem_id,
            'Transferência recusada',
            $destinoUser->instituicao->nome_fantasia.' recusou a sua solicitação de transferência.'
        );
    }

    public function entregar(Transferencia $transferencia, User $destinoUser): void
    {
        abort_if($transferencia->instituicao_destino_id !== $destinoUser->instituicaoId(), 403);
        abort_if($transferencia->status !== TransferenciaStatus::Confirmada, 422);

        $transferencia->update(['status' => TransferenciaStatus::Entregue]);

        Notificacao::enviar(
            $transferencia->instituicao_origem_id,
            'Transferência concluída',
            $destinoUser->instituicao->nome_fantasia.' marcou a transferência como entregue.'
        );
    }

    public function naoEntregue(Transferencia $transferencia, User $destinoUser): void
    {
        abort_if($transferencia->instituicao_destino_id !== $destinoUser->instituicaoId(), 403);
        abort_if($transferencia->status !== TransferenciaStatus::Confirmada, 422);

        DB::transaction(function () use ($transferencia) {
            foreach ($transferencia->itens()->whereNotNull('necessidade_id')->with('necessidade')->get() as $item) {
                $item->necessidade->decrement('quantidade_atual', $item->quantidade);
            }
            $transferencia->update(['status' => TransferenciaStatus::NaoEntregue]);
        });

        Notificacao::enviar(
            $transferencia->instituicao_origem_id,
            'Transferência não entregue',
            $destinoUser->instituicao->nome_fantasia.' marcou a transferência como não entregue.'
        );
    }

    /**
     * @param  array{data_hora_sugerida:string}  $validated
     */
    public function sugerirAlteracao(array $validated, Transferencia $transferencia, User $destinoUser): void
    {
        abort_if($transferencia->instituicao_destino_id !== $destinoUser->instituicaoId(), 403);

        $transferencia->update([
            'data_hora_sugerida' => $validated['data_hora_sugerida'],
            'status' => TransferenciaStatus::AlteracaoSugerida,
        ]);

        Notificacao::enviar(
            $transferencia->instituicao_origem_id,
            'Nova data sugerida',
            $destinoUser->instituicao->nome_fantasia.' sugeriu uma nova data para a transferência.'
        );
    }

    public function aceitarSugestao(Transferencia $transferencia, User $origemUser): void
    {
        abort_if($transferencia->instituicao_origem_id !== $origemUser->instituicaoId(), 403);
        abort_if($transferencia->status !== TransferenciaStatus::AlteracaoSugerida, 422);

        $transferencia->update([
            'data_hora' => $transferencia->data_hora_sugerida,
            'data_hora_sugerida' => null,
            'status' => TransferenciaStatus::Pendente,
        ]);

        Notificacao::enviar(
            $transferencia->instituicao_destino_id,
            'Sugestão aceita',
            $origemUser->instituicao->nome_fantasia.' aceitou a nova data sugerida.'
        );
    }

    public function recusarSugestao(Transferencia $transferencia, User $origemUser): void
    {
        abort_if($transferencia->instituicao_origem_id !== $origemUser->instituicaoId(), 403);
        abort_if($transferencia->status !== TransferenciaStatus::AlteracaoSugerida, 422);

        $transferencia->update([
            'data_hora_sugerida' => null,
            'status' => TransferenciaStatus::Pendente,
        ]);

        Notificacao::enviar(
            $transferencia->instituicao_destino_id,
            'Sugestão recusada',
            $origemUser->instituicao->nome_fantasia.' recusou a nova data sugerida.'
        );
    }

    public function cancelar(Transferencia $transferencia, User $origemUser): void
    {
        abort_if($transferencia->instituicao_origem_id !== $origemUser->instituicaoId(), 403);
        abort_if($transferencia->status !== TransferenciaStatus::Pendente, 422);

        $transferencia->update(['status' => TransferenciaStatus::Cancelada]);

        Notificacao::enviar(
            $transferencia->instituicao_destino_id,
            'Transferência cancelada',
            $origemUser->instituicao->nome_fantasia.' cancelou a solicitação de transferência.'
        );
    }

    public static function calcularEstoque(int $instituicaoId): array
    {
        $recebido = ItemDoacao::whereHas('doacao', fn ($q) => $q
            ->where('instituicao_id', $instituicaoId)
            ->where('status', DoacaoStatus::Entregue))
            ->selectRaw('categoria_id, SUM(quantidade) as total')
            ->groupBy('categoria_id')
            ->pluck('total', 'categoria_id')
            ->toArray();

        $transferido = ItemTransferencia::whereHas('transferencia', fn ($q) => $q
            ->where('instituicao_origem_id', $instituicaoId)
            ->whereNotIn('status', [TransferenciaStatus::Cancelada, TransferenciaStatus::Recusada]))
            ->selectRaw('categoria_id, SUM(quantidade) as total')
            ->groupBy('categoria_id')
            ->pluck('total', 'categoria_id')
            ->toArray();

        $estoque = [];
        foreach ($recebido as $catId => $qty) {
            $disponivel = $qty - ($transferido[$catId] ?? 0);
            if ($disponivel > 0) {
                $estoque[$catId] = $disponivel;
            }
        }

        return $estoque;
    }
}
