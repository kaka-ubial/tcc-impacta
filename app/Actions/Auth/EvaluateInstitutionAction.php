<?php

namespace App\Actions\Auth;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use Illuminate\Support\Facades\Validator;
use App\Enums\InstituicaoStatus;
use App\Models\Instituicao;
use App\Models\Analise;
use Illuminate\Support\Facades\DB;

class EvaluateInstitutionAction
{
    public function execute(Instituicao $instituicao, InstituicaoStatus $status, ?string $motivo, int $adminId): void
    {
        DB::transaction(function () use ($instituicao, $status, $motivo, $adminId) {
            Analise::create([
                'instituicao_id' => $instituicao->usuario_id,
                'admin_id'    => $adminId,
                // AnaliseStatus é um enum PHP separado (mesmos valores) — passa o
                // ->value para deixar o cast do model converter, já que um enum de
                // outra classe não é aceito diretamente por um atributo castado.
                'status'      => $status->value,
                'observacoes'    => $motivo,
            ]);
            $instituicao->update(['status' => $status]);
        });
    }
}