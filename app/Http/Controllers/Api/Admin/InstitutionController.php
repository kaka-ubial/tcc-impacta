<?php

namespace App\Http\Controllers\Api\Admin;

use App\Actions\Auth\EvaluateInstitutionAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\RejectInstitutionRequest;
use App\Http\Resources\InstituicaoResource;
use App\Models\Instituicao;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Contraparte REST/JSON de Admin\InstitutionCheckController. Reaproveita a
 * mesma EvaluateInstitutionAction usada pela UI Inertia.
 */
class InstitutionController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return InstituicaoResource::collection(
            Instituicao::where('status', 'pending')->with('usuario')->get()
        );
    }

    public function approve(Request $request, Instituicao $instituicao, EvaluateInstitutionAction $action)
    {
        $action->execute($instituicao, 'approved', 'Instituição Aprovada', $request->user()->id);

        return new InstituicaoResource($instituicao->fresh());
    }

    public function reject(RejectInstitutionRequest $request, Instituicao $instituicao, EvaluateInstitutionAction $action)
    {
        $action->execute($instituicao, 'rejected', $request->motivo, $request->user()->id);

        return new InstituicaoResource($instituicao->fresh());
    }
}
