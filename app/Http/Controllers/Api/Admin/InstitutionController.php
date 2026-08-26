<?php

namespace App\Http\Controllers\Api\Admin;

use App\Actions\Auth\EvaluateInstitutionAction;
use App\Enums\InstituicaoStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\RejectInstitutionRequest;
use App\Http\Resources\InstituicaoResource;
use App\Models\Instituicao;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Contraparte REST/JSON de Admin\InstitutionCheckController. Reaproveita a
 * mesma EvaluateInstitutionAction usada pela UI Inertia.
 */
#[Group('Admin')]
class InstitutionController extends Controller
{
    /**
     * Listar instituições pendentes
     *
     * Lista instituições aguardando validação de cadastro.
     */
    public function index(): AnonymousResourceCollection
    {
        return InstituicaoResource::collection(
            Instituicao::where('status', InstituicaoStatus::Pending)->with('usuario')->get()
        );
    }

    /**
     * Aprovar instituição
     *
     * Aprova o cadastro de uma instituição pendente.
     */
    public function approve(Request $request, Instituicao $instituicao, EvaluateInstitutionAction $action)
    {
        $action->execute($instituicao, InstituicaoStatus::Approved, 'Instituição Aprovada', $request->user()->id);

        return new InstituicaoResource($instituicao->fresh());
    }

    /**
     * Rejeitar instituição
     *
     * Rejeita o cadastro de uma instituição pendente, com motivo.
     */
    public function reject(RejectInstitutionRequest $request, Instituicao $instituicao, EvaluateInstitutionAction $action)
    {
        $action->execute($instituicao, InstituicaoStatus::Rejected, $request->motivo, $request->user()->id);

        return new InstituicaoResource($instituicao->fresh());
    }
}
