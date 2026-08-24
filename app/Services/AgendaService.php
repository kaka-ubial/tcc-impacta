<?php

namespace App\Services;

use App\Models\Agendamento;
use App\Models\Notificacao;
use App\Models\User;

/**
 * Regra de negócio da sugestão de nova data pela instituição sobre um
 * agendamento de doação. Extraído de Instituicao\AgendaController para que
 * a UI Inertia e a API REST reaproveitem exatamente a mesma lógica.
 */
class AgendaService
{
    /**
     * @param  array{data_hora_sugerida:string}  $validated
     */
    public function sugerirAlteracao(array $validated, Agendamento $agendamento, User $instituicaoUser): void
    {
        abort_if(
            $agendamento->doacao->instituicao_id !== $instituicaoUser->instituicaoId(),
            403
        );

        $agendamento->update([
            'data_hora_sugerida' => $validated['data_hora_sugerida'],
            'status' => 'alteracao_sugerida',
        ]);

        Notificacao::enviar(
            $agendamento->doacao->doador_id,
            'Nova data sugerida',
            $instituicaoUser->instituicao->nome_fantasia.' sugeriu uma nova data para a sua doação.'
        );
    }
}
