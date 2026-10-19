<?php

namespace App\Http\Middleware;

use App\Models\Notificacao;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $user = $request->user();

        if ($user) {
            $user->loadMissing(['doador', 'instituicao']);
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user,
            ],
            'notificacoes_nao_lidas' => $request->user()
                ? Notificacao::where('usuario_id', $request->user()->id)->where('lida', false)->count()
                : 0,
            'notificacoes_recentes' => fn () => $request->user()
                ? Notificacao::where('usuario_id', $request->user()->id)
                    ->where('lida', false)
                    ->latest()
                    ->limit(8)
                    ->get()
                    ->map(fn (Notificacao $n) => [
                        'id' => $n->id,
                        'titulo' => $n->titulo,
                        'mensagem' => $n->mensagem,
                        'url' => $n->url,
                        'criado_em' => $n->created_at->toIso8601String(),
                    ])
                    ->all()
                : [],
            'sidebarOpen' => $request->cookie('sidebar_state') === 'true',
        ];
    }
}
