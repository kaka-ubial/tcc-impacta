<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Remove o valor `aguardando_validacao` de usuarios.status. Esse estado era
 * gravado no cadastro de instituição, mas nunca era verificado (o gate de
 * login só barra 'suspenso') nem atualizado após a aprovação — virava dado
 * morto e inconsistente. A validação de cadastro de instituição é tratada
 * inteiramente por instituicao.status (pending/approved/rejected) e pela
 * tela "Instituições Pendentes". Aqui a conta passa a ter apenas dois
 * estados reais: ativo e suspenso.
 *
 * No Postgres o enum do Laravel é um varchar + CHECK constraint nomeada
 * (usuarios_status_check); alterá-la exige SQL explícito, pois o helper
 * ->change() do schema builder gera SQL inválido para esse caso.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('usuarios')
            ->where('status', 'aguardando_validacao')
            ->update(['status' => 'ativo']);

        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement("ALTER TABLE usuarios ALTER COLUMN status SET DEFAULT 'ativo'");
        DB::statement('ALTER TABLE usuarios DROP CONSTRAINT usuarios_status_check');
        DB::statement("ALTER TABLE usuarios ADD CONSTRAINT usuarios_status_check CHECK (status IN ('ativo', 'suspenso'))");
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('ALTER TABLE usuarios DROP CONSTRAINT usuarios_status_check');
        DB::statement("ALTER TABLE usuarios ADD CONSTRAINT usuarios_status_check CHECK (status IN ('ativo', 'suspenso', 'aguardando_validacao'))");
        DB::statement("ALTER TABLE usuarios ALTER COLUMN status SET DEFAULT 'aguardando_validacao'");
    }
};
