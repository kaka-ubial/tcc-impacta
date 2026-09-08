<?php

namespace App\Actions\Auth;

use App\Enums\InstituicaoStatus;
use App\Models\Analise;
use App\Models\Instituicao;
use Illuminate\Support\Facades\DB;

class EvaluateInstitutionAction
{
    public function execute(Instituicao $instituicao, InstituicaoStatus $status, ?string $motivo, int $adminId): void
    {
        DB::transaction(function () use ($instituicao, $status, $motivo, $adminId) {
            Analise::create([
                'instituicao_id' => $instituicao->usuario_id,
                'admin_id' => $adminId,
                // AnaliseStatus é um enum PHP separado (mesmos valores) — passa o
                // ->value para deixar o cast do model converter, já que um enum de
                // outra classe não é aceito diretamente por um atributo castado.
                'status' => $status->value,
                'observacoes' => $motivo,
            ]);
            $instituicao->update(['status' => $status]);
        });
    }
}
