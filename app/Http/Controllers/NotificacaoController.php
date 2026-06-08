<?php

namespace App\Http\Controllers;

use App\Models\Notificacao;
use Inertia\Inertia;
use Inertia\Response;

class NotificacaoController extends Controller
{
    public function index(): Response
    {
        $usuarioId = auth()->id();

        $notificacoes = Notificacao::where('usuario_id', $usuarioId)
            ->orderBy('created_at', 'desc')
            ->limit(100)
            ->get()
            ->map(fn (Notificacao $n) => [
                'id'        => $n->id,
                'titulo'    => $n->titulo,
                'mensagem'  => $n->mensagem,
                'lida'      => $n->lida,
                'criado_em' => $n->created_at->toIso8601String(),
            ]);

        // marca como lidas ao abrir a aba (zera o contador do menu)
        Notificacao::where('usuario_id', $usuarioId)
            ->where('lida', false)
            ->update(['lida' => true]);

        return Inertia::render('notificacoes', [
            'notificacoes' => $notificacoes,
        ]);
    }
}
