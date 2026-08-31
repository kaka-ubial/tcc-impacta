<?php

namespace App\Http\Controllers\Api\Admin;

use App\Actions\Admin\UpdateUserStatusAction;
use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateDoadorRequest;
use App\Http\Requests\Admin\UpdateInstituicaoRequest;
use App\Http\Requests\Admin\UpdateUserStatusRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Contraparte REST/JSON de Admin\UserController. Reaproveita as mesmas
 * Actions e FormRequests usadas pela UI Inertia.
 */
#[Group('Admin')]
class UserController extends Controller
{
    /**
     * Listar usuários
     *
     * Lista doadores, instituições e admins cadastrados, com filtro
     * opcional por tipo_usuario e status.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $usuarios = User::with(['doador', 'instituicao'])
            ->when($request->filled('tipo_usuario'), fn ($q) => $q->where('tipo_usuario', $request->input('tipo_usuario')))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->input('status')))
            ->orderByDesc('created_at')
            ->paginate(15);

        return UserResource::collection($usuarios);
    }

    /**
     * Detalhar usuário
     *
     * Retorna os dados de conta de um usuário (doador ou instituição).
     */
    public function show(User $user): UserResource
    {
        $user->load(['doador', 'instituicao']);

        return new UserResource($user);
    }

    /**
     * Editar doador
     *
     * Atualiza os dados de perfil de um doador.
     */
    public function updateDoador(UpdateDoadorRequest $request, User $user): UserResource
    {
        abort_unless($user->doador, 404);

        $user->doador->update($request->validated());

        return new UserResource($user->fresh(['doador', 'instituicao']));
    }

    /**
     * Editar instituição
     *
     * Atualiza os dados de perfil de uma instituição.
     */
    public function updateInstituicao(UpdateInstituicaoRequest $request, User $user): UserResource
    {
        abort_unless($user->instituicao, 404);

        $user->instituicao->update($request->validated());

        return new UserResource($user->fresh(['doador', 'instituicao']));
    }

    /**
     * Suspender ou reativar usuário
     *
     * Atualiza o status da conta (ativo/suspenso). Ao suspender, invalida
     * os tokens de acesso ativos do usuário. Um admin não pode suspender
     * a si mesmo.
     */
    public function updateStatus(UpdateUserStatusRequest $request, User $user, UpdateUserStatusAction $action): UserResource
    {
        if ($user->id === $request->user()->id) {
            abort(403, 'Você não pode suspender a própria conta.');
        }

        $action->execute($user, UserStatus::from($request->string('status')->toString()), $request->input('motivo'));

        return new UserResource($user->fresh(['doador', 'instituicao']));
    }
}
