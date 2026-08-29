<?php

namespace App\Http\Controllers\Instituicao;

use App\Enums\TransferenciaStatus;
use App\Exceptions\TransferenciaException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Instituicao\StoreTransferenciaRequest;
use App\Http\Requests\Instituicao\SugerirDataRequest;
use App\Http\Resources\HorarioResource;
use App\Http\Resources\TransferenciaResource;
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

    public function index(Request $request): Response
    {
        $id = auth()->user()->instituicaoId();

        $enviadas = TransferenciaResource::collection(
            Transferencia::with(['destino', 'itens.categoria'])
                ->where('instituicao_origem_id', $id)
                ->orderBy('created_at', 'desc')
                ->get()
        )->resolve($request);

        $recebidas = TransferenciaResource::collection(
            Transferencia::with(['origem', 'itens.categoria'])
                ->where('instituicao_destino_id', $id)
                ->orderBy('created_at', 'desc')
                ->get()
        )->resolve($request);

        $horarios = HorarioResource::collection(
            HorarioDisponivel::where('instituicao_id', $id)
                ->where('ativo', true)
                ->orderBy('dia_semana')
                ->orderBy('hora_inicio')
                ->get()
        )->resolve($request);

        $itensEnviados = ItemTransferencia::whereHas('transferencia', fn ($q) => $q
            ->where('instituicao_origem_id', $id)
            ->where('status', TransferenciaStatus::Entregue))
            ->join('categorias_itens', 'itens_transferencia.categoria_id', '=', 'categorias_itens.id')
            ->selectRaw('categorias_itens.nome as categoria, SUM(itens_transferencia.quantidade) as total')
            ->groupBy('categorias_itens.nome')
            ->get()
            ->map(fn ($r) => ['categoria' => $r->categoria, 'quantidade' => (int) $r->total]);

        $itensRecebidos = ItemTransferencia::whereHas('transferencia', fn ($q) => $q
            ->where('instituicao_destino_id', $id)
            ->where('status', TransferenciaStatus::Entregue))
            ->join('categorias_itens', 'itens_transferencia.categoria_id', '=', 'categorias_itens.id')
            ->selectRaw('categorias_itens.nome as categoria, SUM(itens_transferencia.quantidade) as total')
            ->groupBy('categorias_itens.nome')
            ->get()
            ->map(fn ($r) => ['categoria' => $r->categoria, 'quantidade' => (int) $r->total]);

        return Inertia::render('instituicao/transferencias', compact(
            'enviadas', 'recebidas', 'horarios', 'itensEnviados', 'itensRecebidos'
        ));
    }

    public function store(StoreTransferenciaRequest $request): RedirectResponse
    {
        try {
            $this->transferencias->store($request->validated(), auth()->user());
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

    public function sugerirAlteracao(SugerirDataRequest $request, Transferencia $transferencia): RedirectResponse
    {
        $this->transferencias->sugerirAlteracao($request->validated(), $transferencia, auth()->user());

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
}
