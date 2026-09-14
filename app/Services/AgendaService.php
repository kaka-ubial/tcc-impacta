<?php

namespace App\Services;

use App\Enums\AgendamentoStatus;
use App\Models\Agendamento;
use App\Models\User;
use App\Notifications\NovaDataSugerida;

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

        $doadorId = $agendamento->doacao->doador_id;

        $agendamento->update([
            'data_hora_sugerida' => $validated['data_hora_sugerida'],
            'status' => AgendamentoStatus::AlteracaoSugerida,
        ]);

        User::find($doadorId)?->notify(new NovaDataSugerida($agendamento->withoutRelations()));
    }
}
