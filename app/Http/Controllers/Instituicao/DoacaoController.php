<?php

namespace App\Http\Controllers\Instituicao;

use App\Http\Controllers\Controller;
use App\Models\CategoriaItem;
use App\Models\Doacao;
use App\Models\HorarioDisponivel;
use App\Services\DoacaoService;
use App\Services\TransferenciaService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class DoacaoController extends Controller
{
    public function __construct(private readonly DoacaoService $doacoes) {}

    public function index(): Response
    {
        $instituicaoId = auth()->user()->instituicao->usuario_id;

        $doacoes = Doacao::with(['doador', 'itens.categoria', 'agendamento', 'avaliacao'])
            ->where('instituicao_id', $instituicaoId)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn (Doacao $d) => [
                'id' => $d->id,
                'status' => $d->status,
                'doador' => [
                    'usuario_id' => $d->doador->usuario_id,
                    'nome' => $d->doador->nome_completo,
                    'telefone' => $d->doador->telefone,
                    'foto_perfil' => $d->doador->foto_perfil,
                ],
                'itens' => $d->itens->map(fn ($item) => [
                    'id' => $item->id,
                    'categoria' => $item->categoria->nome,
                    'quantidade' => $item->quantidade,
                    'descricao' => $item->descricao,
                ]),
                'agendamento' => $d->agendamento ? [
                    'id' => $d->agendamento->id,
                    'data_hora' => $d->agendamento->data_hora->toIso8601String(),
                    'tipo' => $d->agendamento->tipo,
                    'status' => $d->agendamento->status,
                    'data_hora_sugerida' => $d->agendamento->data_hora_sugerida?->toIso8601String(),
                    'endereco_referencia' => $d->agendamento->endereco_referencia,
                ] : null,
                'criado_em' => $d->created_at->toIso8601String(),
                'avaliacao' => $d->avaliacao ? ['nota' => $d->avaliacao->nota, 'descricao' => $d->avaliacao->descricao] : null,
            ]);

        $estoque = TransferenciaService::calcularEstoque($instituicaoId);
        $categoriaIds = array_keys($estoque);
        $categorias = CategoriaItem::whereIn('id', $categoriaIds)->pluck('nome', 'id');

        $itensRecebidos = collect($estoque)->map(fn ($qty, $catId) => [
            'categoria_id' => (int) $catId,
            'categoria' => $categorias[$catId] ?? '',
            'quantidade' => $qty,
        ])->values();

        $horarios = HorarioDisponivel::where('instituicao_id', $instituicaoId)
            ->where('ativo', true)
            ->orderBy('dia_semana')
            ->orderBy('hora_inicio')
            ->get()
            ->map(fn (HorarioDisponivel $h) => [
                'id' => $h->id,
                'dia_semana' => $h->dia_semana,
                'hora_inicio' => $h->hora_inicio,
                'hora_fim' => $h->hora_fim,
                'tipo' => $h->tipo,
            ]);

        return Inertia::render('instituicao/doacoes', [
            'doacoes' => $doacoes,
            'itens_recebidos' => $itensRecebidos,
            'horarios' => $horarios,
        ]);
    }

    public function confirm(Doacao $doacao): RedirectResponse
    {
        $this->doacoes->confirm($doacao, auth()->user());

        return back();
    }

    public function reject(Doacao $doacao): RedirectResponse
    {
        $this->doacoes->reject($doacao, auth()->user());

        return back();
    }

    public function deliver(Doacao $doacao): RedirectResponse
    {
        $this->doacoes->deliver($doacao, auth()->user());

        return back();
    }

    public function notDelivered(Doacao $doacao): RedirectResponse
    {
        $this->doacoes->notDelivered($doacao, auth()->user());

        return back();
    }
}
