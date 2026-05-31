<?php

namespace App\Http\Controllers\Instituicao;

use App\Http\Controllers\Controller;
use App\Models\HorarioDisponivel;
use App\Models\ItemDoacao;
use App\Models\ItemTransferencia;
use App\Models\Notificacao;
use App\Models\Transferencia;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class TransferenciaController extends Controller
{
    public function index(): Response
    {
        $id = auth()->user()->instituicao->usuario_id;

        $enviadas = Transferencia::with(['destino', 'itens.categoria'])
            ->where('instituicao_origem_id', $id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn (Transferencia $t) => $this->serialize($t, 'enviada'));

        $recebidas = Transferencia::with(['origem', 'itens.categoria'])
            ->where('instituicao_destino_id', $id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn (Transferencia $t) => $this->serialize($t, 'recebida'));

        $horarios = HorarioDisponivel::where('instituicao_id', $id)
            ->where('ativo', true)
            ->orderBy('dia_semana')
            ->orderBy('hora_inicio')
            ->get()
            ->map(fn (HorarioDisponivel $h) => [
                'id'          => $h->id,
                'dia_semana'  => $h->dia_semana,
                'hora_inicio' => $h->hora_inicio,
                'hora_fim'    => $h->hora_fim,
                'tipo'        => $h->tipo,
            ]);

        $itensEnviados = ItemTransferencia::whereHas('transferencia', fn ($q) => $q
            ->where('instituicao_origem_id', $id)
            ->where('status', 'entregue'))
            ->join('categorias_itens', 'itens_transferencia.categoria_id', '=', 'categorias_itens.id')
            ->selectRaw('categorias_itens.nome as categoria, SUM(itens_transferencia.quantidade) as total')
            ->groupBy('categorias_itens.nome')
            ->get()
            ->map(fn ($r) => ['categoria' => $r->categoria, 'quantidade' => (int) $r->total]);

        $itensRecebidos = ItemTransferencia::whereHas('transferencia', fn ($q) => $q
            ->where('instituicao_destino_id', $id)
            ->where('status', 'entregue'))
            ->join('categorias_itens', 'itens_transferencia.categoria_id', '=', 'categorias_itens.id')
            ->selectRaw('categorias_itens.nome as categoria, SUM(itens_transferencia.quantidade) as total')
            ->groupBy('categorias_itens.nome')
            ->get()
            ->map(fn ($r) => ['categoria' => $r->categoria, 'quantidade' => (int) $r->total]);

        return Inertia::render('instituicao/transferencias', compact(
            'enviadas', 'recebidas', 'horarios', 'itensEnviados', 'itensRecebidos'
        ));
    }

    public function store(Request $request): RedirectResponse
    {
        $v = $request->validate([
            'instituicao_destino_id'       => ['required', 'integer', 'exists:instituicao,usuario_id'],
            'itens'                        => ['required', 'array', 'min:1'],
            'itens.*.categoria_id'         => ['required', 'integer', 'exists:categorias_itens,id'],
            'itens.*.necessidade_id'       => ['nullable', 'integer', 'exists:necessidades,id'],
            'itens.*.quantidade'           => ['required', 'integer', 'min:1'],
            'itens.*.descricao'            => ['nullable', 'string', 'max:255'],
            'agendamento.tipo'             => ['required', 'in:coleta,entrega'],
            'agendamento.data_hora'        => ['required', 'date', 'after:now'],
            'agendamento.horario_disponivel_id' => ['nullable', 'integer', 'exists:horarios_disponiveis,id'],
            'agendamento.endereco_referencia'   => ['nullable', 'string', 'max:500'],
        ]);

        $origemId = auth()->user()->instituicao->usuario_id;
        abort_if($origemId === $v['instituicao_destino_id'], 422, 'Não é possível transferir para si mesmo.');

        $estoque = self::calcularEstoque($origemId);

        foreach ($v['itens'] as $item) {
            $disponivel = $estoque[$item['categoria_id']] ?? 0;
            abort_if(
                $item['quantidade'] > $disponivel,
                422,
                'Quantidade indisponível para transferência.'
            );
        }

        $ag = $v['agendamento'];

        DB::transaction(function () use ($v, $origemId, $ag) {
            $t = Transferencia::create([
                'instituicao_origem_id'  => $origemId,
                'instituicao_destino_id' => $v['instituicao_destino_id'],
                'status'                 => 'pendente',
                'data_hora'              => $ag['data_hora'],
                'tipo'                   => $ag['tipo'],
                'endereco_referencia'    => $ag['endereco_referencia'] ?? null,
                'horario_disponivel_id'  => $ag['horario_disponivel_id'] ?? null,
            ]);

            foreach ($v['itens'] as $item) {
                $t->itens()->create($item);
            }

            Notificacao::enviar(
                $v['instituicao_destino_id'],
                'Nova solicitação de transferência',
                auth()->user()->instituicao->nome_fantasia.' enviou uma solicitação de transferência de itens.'
            );
        });

        return redirect()->route('instituicao.transferencias.index');
    }

    public function confirmar(Transferencia $transferencia): RedirectResponse
    {
        abort_if($transferencia->instituicao_destino_id !== auth()->user()->instituicao->usuario_id, 403);
        abort_if($transferencia->status !== 'pendente', 422);

        DB::transaction(function () use ($transferencia) {
            $transferencia->update(['status' => 'confirmada']);

            foreach ($transferencia->itens()->whereNotNull('necessidade_id')->with('necessidade')->get() as $item) {
                $item->necessidade->increment('quantidade_atual', $item->quantidade);
            }
        });

        Notificacao::enviar(
            $transferencia->instituicao_origem_id,
            'Transferência confirmada',
            auth()->user()->instituicao->nome_fantasia.' confirmou a sua solicitação de transferência.'
        );

        return back();
    }

    public function recusar(Transferencia $transferencia): RedirectResponse
    {
        abort_if($transferencia->instituicao_destino_id !== auth()->user()->instituicao->usuario_id, 403);
        abort_if($transferencia->status !== 'pendente', 422);

        $transferencia->update(['status' => 'recusada']);

        Notificacao::enviar(
            $transferencia->instituicao_origem_id,
            'Transferência recusada',
            auth()->user()->instituicao->nome_fantasia.' recusou a sua solicitação de transferência.'
        );

        return back();
    }

    public function entregar(Transferencia $transferencia): RedirectResponse
    {
        abort_if($transferencia->instituicao_destino_id !== auth()->user()->instituicao->usuario_id, 403);
        abort_if($transferencia->status !== 'confirmada', 422);

        $transferencia->update(['status' => 'entregue']);

        Notificacao::enviar(
            $transferencia->instituicao_origem_id,
            'Transferência concluída',
            auth()->user()->instituicao->nome_fantasia.' marcou a transferência como entregue.'
        );

        return back();
    }

    public function naoEntregue(Transferencia $transferencia): RedirectResponse
    {
        abort_if($transferencia->instituicao_destino_id !== auth()->user()->instituicao->usuario_id, 403);
        abort_if($transferencia->status !== 'confirmada', 422);

        DB::transaction(function () use ($transferencia) {
            foreach ($transferencia->itens()->whereNotNull('necessidade_id')->with('necessidade')->get() as $item) {
                $item->necessidade->decrement('quantidade_atual', $item->quantidade);
            }
            $transferencia->update(['status' => 'nao_entregue']);
        });

        Notificacao::enviar(
            $transferencia->instituicao_origem_id,
            'Transferência não entregue',
            auth()->user()->instituicao->nome_fantasia.' marcou a transferência como não entregue.'
        );

        return back();
    }

    public function sugerirAlteracao(Request $request, Transferencia $transferencia): RedirectResponse
    {
        abort_if($transferencia->instituicao_destino_id !== auth()->user()->instituicao->usuario_id, 403);

        $validated = $request->validate([
            'data_hora_sugerida' => ['required', 'date', 'after:now'],
        ]);

        $transferencia->update([
            'data_hora_sugerida' => $validated['data_hora_sugerida'],
            'status'             => 'alteracao_sugerida',
        ]);

        Notificacao::enviar(
            $transferencia->instituicao_origem_id,
            'Nova data sugerida',
            auth()->user()->instituicao->nome_fantasia.' sugeriu uma nova data para a transferência.'
        );

        return back();
    }

    public function aceitarSugestao(Transferencia $transferencia): RedirectResponse
    {
        abort_if($transferencia->instituicao_origem_id !== auth()->user()->instituicao->usuario_id, 403);
        abort_if($transferencia->status !== 'alteracao_sugerida', 422);

        $transferencia->update([
            'data_hora'          => $transferencia->data_hora_sugerida,
            'data_hora_sugerida' => null,
            'status'             => 'pendente',
        ]);

        Notificacao::enviar(
            $transferencia->instituicao_destino_id,
            'Sugestão aceita',
            auth()->user()->instituicao->nome_fantasia.' aceitou a nova data sugerida.'
        );

        return back();
    }

    public function recusarSugestao(Transferencia $transferencia): RedirectResponse
    {
        abort_if($transferencia->instituicao_origem_id !== auth()->user()->instituicao->usuario_id, 403);
        abort_if($transferencia->status !== 'alteracao_sugerida', 422);

        $transferencia->update([
            'data_hora_sugerida' => null,
            'status'             => 'pendente',
        ]);

        Notificacao::enviar(
            $transferencia->instituicao_destino_id,
            'Sugestão recusada',
            auth()->user()->instituicao->nome_fantasia.' recusou a nova data sugerida.'
        );

        return back();
    }

    public function cancelar(Transferencia $transferencia): RedirectResponse
    {
        abort_if($transferencia->instituicao_origem_id !== auth()->user()->instituicao->usuario_id, 403);
        abort_if($transferencia->status !== 'pendente', 422);

        $transferencia->update(['status' => 'cancelada']);

        Notificacao::enviar(
            $transferencia->instituicao_destino_id,
            'Transferência cancelada',
            auth()->user()->instituicao->nome_fantasia.' cancelou a solicitação de transferência.'
        );

        return back();
    }

    public static function calcularEstoque(int $instituicaoId): array
    {
        $recebido = ItemDoacao::whereHas('doacao', fn ($q) => $q
            ->where('instituicao_id', $instituicaoId)
            ->where('status', 'entregue'))
            ->selectRaw('categoria_id, SUM(quantidade) as total')
            ->groupBy('categoria_id')
            ->pluck('total', 'categoria_id')
            ->toArray();

        $transferido = ItemTransferencia::whereHas('transferencia', fn ($q) => $q
            ->where('instituicao_origem_id', $instituicaoId)
            ->whereNotIn('status', ['cancelada', 'recusada']))
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

    private function serialize(Transferencia $t, string $direcao): array
    {
        $parceiro = $direcao === 'enviada' ? $t->destino : $t->origem;

        return [
            'id'                 => $t->id,
            'status'             => $t->status,
            'direcao'            => $direcao,
            'criado_em'          => $t->created_at->toIso8601String(),
            'data_hora'          => $t->data_hora?->toIso8601String(),
            'data_hora_sugerida' => $t->data_hora_sugerida?->toIso8601String(),
            'tipo'               => $t->tipo,
            'endereco_referencia' => $t->endereco_referencia,
            'parceiro'  => [
                'usuario_id'    => $parceiro->usuario_id,
                'nome_fantasia' => $parceiro->nome_fantasia,
            ],
            'itens' => $t->itens->map(fn ($i) => [
                'id'         => $i->id,
                'categoria'  => $i->categoria->nome,
                'quantidade' => $i->quantidade,
                'descricao'  => $i->descricao,
            ]),
        ];
    }
}
