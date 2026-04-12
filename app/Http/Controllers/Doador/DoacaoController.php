<?php

namespace App\Http\Controllers\Doador;

use App\Http\Controllers\Controller;
use App\Http\Requests\Doador\StoreDoacaoRequest;
use App\Models\Agendamento;
use App\Models\Doacao;
use App\Models\ItemDoacao;
use Illuminate\Support\Facades\DB;

class DoacaoController extends Controller
{
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
                    'doacao_id'   => $doacao->id,
                    'categoria_id' => $item['categoria_id'],
                    'quantidade'  => $item['quantidade'],
                    'descricao'   => $item['descricao'] ?? null,
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
