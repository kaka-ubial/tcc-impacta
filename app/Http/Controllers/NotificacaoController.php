<?php

namespace App\Http\Controllers;

use App\Models\Notificacao;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class NotificacaoController extends Controller
{
    public function index(): Response
    {
        $notificacoes = Notificacao::where('usuario_id', auth()->id())
            ->orderBy('created_at', 'desc')
            ->limit(100)
            ->get()
            ->map(fn (Notificacao $n) => [
                'id' => $n->id,
                'titulo' => $n->titulo,
                'mensagem' => $n->mensagem,
                'url' => $n->url,
                'lida' => $n->lida,
                'criado_em' => $n->created_at->toIso8601String(),
            ]);

        return Inertia::render('notificacoes', [
            'notificacoes' => $notificacoes,
        ]);
    }

    public function abrir(Notificacao $notificacao): RedirectResponse
    {
        $this->autorizar($notificacao);

        $notificacao->update(['lida' => true]);

        return redirect($notificacao->url ?: route('notificacoes.index'));
    }

    public function marcarLida(Notificacao $notificacao): RedirectResponse
    {
        $this->autorizar($notificacao);

        $notificacao->update(['lida' => true]);

        return back();
    }

    public function marcarTodasLidas(): RedirectResponse
    {
        Notificacao::where('usuario_id', auth()->id())
            ->where('lida', false)
            ->update(['lida' => true]);

        return back();
    }

    private function autorizar(Notificacao $notificacao): void
    {
        abort_unless($notificacao->usuario_id === auth()->id(), 403);
    }
}
