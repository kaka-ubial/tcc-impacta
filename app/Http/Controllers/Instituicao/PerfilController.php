<?php

namespace App\Http\Controllers\Instituicao;

use App\Enums\DoacaoStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Instituicao\UpdatePerfilRequest;
use App\Http\Resources\HorarioResource;
use App\Http\Resources\InstituicaoShowResource;
use App\Models\Causa;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PerfilController extends Controller
{
    /**
     * Mesma página que o doador vê (instituicoes/show), com os blocos de
     * edição liberados por `isOwnProfile`.
     */
    public function show(Request $request): Response
    {
        $instituicao = $request->user()->instituicao->loadPerfilPublico();

        $horarios = $instituicao->horarios()
            ->where('ativo', true)
            ->withExists(['agendamentos as tem_doacoes_ativas' => fn ($q) => $q
                ->whereHas('doacao', fn ($q) => $q->whereIn('status', [DoacaoStatus::Pendente, DoacaoStatus::Confirmada]))])
            ->orderBy('dia_semana')
            ->orderBy('hora_inicio')
            ->get();

        return Inertia::render('instituicoes/show', [
            'instituicao' => (new InstituicaoShowResource($instituicao))->resolve($request),
            'categorias' => [],
            'canTransfer' => false,
            'estoque' => [],
            'isOwnProfile' => true,
            'horariosEditaveis' => HorarioResource::collection($horarios)->resolve($request),
            'todasCausas' => Causa::orderBy('nome')->get(['id', 'nome', 'icone']),
        ]);
    }

    public function update(UpdatePerfilRequest $request): RedirectResponse
    {
        $user = $request->user();
        $data = $request->validated();

        if (array_key_exists('descricao', $data)) {
            $user->instituicao->update(['descricao' => $data['descricao']]);
        }

        if (array_key_exists('causas', $data)) {
            $user->causas()->sync($data['causas']);
        }

        return back();
    }
}
