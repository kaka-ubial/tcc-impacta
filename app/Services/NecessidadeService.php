<?php

namespace App\Services;

use App\Exceptions\NecessidadeException;
use App\Models\Instituicao;
use App\Models\Necessidade;

/**
 * Regras de negócio do cadastro de necessidades da instituição. Extraído de
 * NecessidadeController para que a UI Inertia e a API REST reaproveitem
 * exatamente a mesma lógica.
 */
class NecessidadeService
{
    /**
     * @param  array{categoria_id:int, descricao:string, quantidade_objetivo:int, prioridade:string}  $validated
     *
     * @throws NecessidadeException se a instituição não tiver horários disponíveis cadastrados
     */
    public function store(array $validated, Instituicao $instituicao): Necessidade
    {
        if ($instituicao->horarios()->where('ativo', true)->doesntExist()) {
            throw new NecessidadeException('Cadastre ao menos um horário disponível antes de criar necessidades.');
        }

        $validated['instituicao_id'] = $instituicao->usuario_id;
        $validated['quantidade_atual'] = 0;

        return Necessidade::create($validated);
    }

    /**
     * @param  array{categoria_id:int, descricao:string, quantidade_objetivo:int, prioridade:string}  $validated
     */
    public function update(Necessidade $necessidade, array $validated): Necessidade
    {
        $necessidade->update($validated);

        return $necessidade;
    }

    public function destroy(Necessidade $necessidade): void
    {
        $necessidade->delete();
    }
}
