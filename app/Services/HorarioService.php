<?php

namespace App\Services;

use App\Exceptions\HorarioException;
use App\Models\HorarioDisponivel;
use App\Models\Instituicao;

/**
 * Regras de negócio dos horários disponíveis da instituição. Extraído de
 * Instituicao\HorarioController para que a UI Inertia e a API REST
 * reaproveitem exatamente a mesma lógica.
 */
class HorarioService
{
    /**
     * @param  array{dia_semana:int, hora_inicio:string, hora_fim:string, tipo:string}  $validated
     */
    public function store(array $validated, Instituicao $instituicao): HorarioDisponivel
    {
        return HorarioDisponivel::create([
            'instituicao_id' => $instituicao->usuario_id,
            'dia_semana' => $validated['dia_semana'],
            'hora_inicio' => $validated['hora_inicio'],
            'hora_fim' => $validated['hora_fim'],
            'tipo' => $validated['tipo'],
        ]);
    }

    /**
     * @throws HorarioException se houver doações pendentes/confirmadas agendadas neste horário
     */
    public function destroy(HorarioDisponivel $horario, Instituicao $instituicao): void
    {
        abort_if($horario->instituicao_id !== $instituicao->usuario_id, 403);

        $temDoacoesAtivas = $horario->agendamentos()
            ->whereHas('doacao', fn ($q) => $q->whereIn('status', ['pendente', 'confirmada']))
            ->exists();

        if ($temDoacoesAtivas) {
            throw new HorarioException('Não é possível excluir um horário com doações agendadas em andamento.');
        }

        $horario->delete();
    }
}
