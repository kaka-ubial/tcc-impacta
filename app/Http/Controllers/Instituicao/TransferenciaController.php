<?php

namespace App\Http\Controllers\Instituicao;

use App\Exceptions\TransferenciaException;
use App\Http\Controllers\Controller;
use App\Models\HorarioDisponivel;
use App\Models\ItemTransferencia;
use App\Models\Transferencia;
use App\Services\TransferenciaService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TransferenciaController extends Controller
{
    public function __construct(private readonly TransferenciaService $transferencias) {}

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
                'id' => $h->id,
                'dia_semana' => $h->dia_semana,
                'hora_inicio' => $h->hora_inicio,
                'hora_fim' => $h->hora_fim,
                'tipo' => $h->tipo,
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
            'instituicao_destino_id' => ['required', 'integer', 'exists:instituicao,usuario_id'],
            'itens' => ['required', 'array', 'min:1'],
            'itens.*.categoria_id' => ['required', 'integer', 'exists:categorias_itens,id'],
            'itens.*.necessidade_id' => ['nullable', 'integer', 'exists:necessidades,id'],
            'itens.*.quantidade' => ['required', 'integer', 'min:1'],
            'itens.*.descricao' => ['nullable', 'string', 'max:255'],
            'agendamento.tipo' => ['required', 'in:coleta,entrega'],
            'agendamento.data_hora' => ['required', 'date', 'after:now'],
            'agendamento.horario_disponivel_id' => ['nullable', 'integer', 'exists:horarios_disponiveis,id'],
            'agendamento.endereco_referencia' => ['nullable', 'string', 'max:500'],
        ]);

        try {
            $this->transferencias->store($v, auth()->user());
        } catch (TransferenciaException $e) {
            abort(422, $e->getMessage());
        }

        return redirect()->route('instituicao.transferencias.index');
    }

    public function confirmar(Transferencia $transferencia): RedirectResponse
    {
        $this->transferencias->confirmar($transferencia, auth()->user());

        return back();
    }

    public function recusar(Transferencia $transferencia): RedirectResponse
    {
        $this->transferencias->recusar($transferencia, auth()->user());

        return back();
    }

    public function entregar(Transferencia $transferencia): RedirectResponse
    {
        $this->transferencias->entregar($transferencia, auth()->user());

        return back();
    }

    public function naoEntregue(Transferencia $transferencia): RedirectResponse
    {
        $this->transferencias->naoEntregue($transferencia, auth()->user());

        return back();
    }

    public function sugerirAlteracao(Request $request, Transferencia $transferencia): RedirectResponse
    {
        $validated = $request->validate([
            'data_hora_sugerida' => ['required', 'date', 'after:now'],
        ]);

        $this->transferencias->sugerirAlteracao($validated, $transferencia, auth()->user());

        return back();
    }

    public function aceitarSugestao(Transferencia $transferencia): RedirectResponse
    {
        $this->transferencias->aceitarSugestao($transferencia, auth()->user());

        return back();
    }

    public function recusarSugestao(Transferencia $transferencia): RedirectResponse
    {
        $this->transferencias->recusarSugestao($transferencia, auth()->user());

        return back();
    }

    public function cancelar(Transferencia $transferencia): RedirectResponse
    {
        $this->transferencias->cancelar($transferencia, auth()->user());

        return back();
    }

    private function serialize(Transferencia $t, string $direcao): array
    {
        $parceiro = $direcao === 'enviada' ? $t->destino : $t->origem;

        return [
            'id' => $t->id,
            'status' => $t->status,
            'direcao' => $direcao,
            'criado_em' => $t->created_at->toIso8601String(),
            'data_hora' => $t->data_hora?->toIso8601String(),
            'data_hora_sugerida' => $t->data_hora_sugerida?->toIso8601String(),
            'tipo' => $t->tipo,
            'endereco_referencia' => $t->endereco_referencia,
            'parceiro' => [
                'usuario_id' => $parceiro->usuario_id,
                'nome_fantasia' => $parceiro->nome_fantasia,
            ],
            'itens' => $t->itens->map(fn ($i) => [
                'id' => $i->id,
                'categoria' => $i->categoria->nome,
                'quantidade' => $i->quantidade,
                'descricao' => $i->descricao,
            ]),
        ];
    }
}
