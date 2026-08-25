<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\UpdateUserStatusAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateDoadorRequest;
use App\Http\Requests\Admin\UpdateInstituicaoRequest;
use App\Http\Requests\Admin\UpdateUserStatusRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class UserController extends Controller
{
    /**
     * Listagem unificada de usuários (doadores, instituições e admins),
     * com filtro opcional por tipo_usuario e status.
     */
    public function index(Request $request)
    {
        $usuarios = User::with(['doador', 'instituicao'])
            ->when($request->filled('tipo_usuario'), fn ($q) => $q->where('tipo_usuario', $request->input('tipo_usuario')))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->input('status')))
            ->orderByDesc('created_at')
            ->simplePaginate(15)
            ->withQueryString()
            ->through(fn ($user) => (new UserResource($user))->resolve($request));

        $stats = User::select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();

        return Inertia::render('admin/users-list', [
            'usuarios' => $usuarios,
            'filtros' => $request->only(['tipo_usuario', 'status']),
            'tipo_options' => ['doador', 'instituicao', 'admin'],
            'status_options' => ['ativo', 'suspenso', 'aguardando_validacao'],
            'stats' => [
                'ativo' => $stats['ativo'] ?? 0,
                'suspenso' => $stats['suspenso'] ?? 0,
                'aguardando_validacao' => $stats['aguardando_validacao'] ?? 0,
            ],
        ]);
    }

    /**
     * Detalhe e formulário de edição de um usuário (doador ou instituição).
     */
    public function show(Request $request, User $user)
    {
        $user->load(['doador', 'instituicao']);

        return Inertia::render('admin/user-edit', [
            'usuario' => (new UserResource($user))->resolve($request),
            'perfil' => $user->tipo_usuario === 'doador' ? $user->doador : $user->instituicao,
        ]);
    }

    public function updateDoador(UpdateDoadorRequest $request, User $user)
    {
        abort_unless($user->doador, 404);

        $user->doador->update($request->validated());

        return back()->with('message', 'Doador atualizado com sucesso.');
    }

    public function updateInstituicao(UpdateInstituicaoRequest $request, User $user)
    {
        abort_unless($user->instituicao, 404);

        $user->instituicao->update($request->validated());

        return back()->with('message', 'Instituição atualizada com sucesso.');
    }

    public function updateStatus(UpdateUserStatusRequest $request, User $user, UpdateUserStatusAction $action)
    {
        if ($user->id === auth()->id()) {
            abort(403, 'Você não pode suspender a própria conta.');
        }

        $status = $request->string('status')->toString();
        $action->execute($user, $status, $request->input('motivo'));

        return back()->with('message', $status === 'suspenso'
            ? 'Usuário suspenso com sucesso.'
            : 'Usuário reativado com sucesso.');
    }
}
