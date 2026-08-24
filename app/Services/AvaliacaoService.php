<?php

namespace App\Services;

use App\Models\Avaliacao;
use App\Models\Doacao;
use App\Models\User;

/**
 * Regra de negócio da avaliação que a instituição registra sobre uma doação
 * recebida. Extraído de Instituicao\AvaliacaoController para que a UI
 * Inertia e a API REST reaproveitem exatamente a mesma lógica.
 */
class AvaliacaoService
{
    /**
     * @param  array{nota:int, descricao:string}  $validated
     */
    public function store(array $validated, Doacao $doacao, User $instituicaoUser): Avaliacao
    {
        abort_if($doacao->instituicao_id !== $instituicaoUser->instituicaoId(), 403);
        abort_if($doacao->status !== 'entregue', 422);
        abort_if($doacao->avaliacao()->exists(), 422);

        return Avaliacao::create([
            'usuario_id' => $instituicaoUser->id,
            'doacao_id' => $doacao->id,
            'nota' => $validated['nota'],
            'descricao' => $validated['descricao'],
        ]);
    }
}
