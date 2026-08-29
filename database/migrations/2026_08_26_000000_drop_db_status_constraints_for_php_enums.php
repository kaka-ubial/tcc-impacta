<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Parte do refactor "adotar PHP backed enums para todos os status"
 * (context/features/rf17-gestao-usuarios.md, seção "Possível trabalho
 * futuro"). Com os enums em app/Enums/ + Rule::enum() cuidando da validação
 * em nível de aplicação, as constraints de banco (CHECK/ENUM) que ainda
 * restavam viram redundantes e caras de alterar (esp. no Postgres). Reduz
 * usuarios/analises/transferencias.status a `string` simples — mesmo padrão
 * que instituicao/doacoes/agendamentos.status já usavam.
 *
 * Segue o padrão de SQL cru por driver já estabelecido em
 * 2026_08_22_180200_normalize_doacoes_status_to_string.php e
 * 2026_08_25_000000_remove_aguardando_validacao_from_usuarios_status.php.
 */
return new class extends Migration
{
    public function up(): void
    {
        match (DB::getDriverName()) {
            'pgsql' => DB::statement('ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_status_check'),
            'mysql' => DB::statement("ALTER TABLE usuarios MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ativo'"),
            'sqlite' => Schema::table('usuarios', function (Blueprint $table) {
                $table->string('status', 20)->default('ativo')->change();
            }),
            default => null,
        };

        match (DB::getDriverName()) {
            'pgsql' => DB::statement('ALTER TABLE analises DROP CONSTRAINT IF EXISTS analises_status_check'),
            'mysql' => DB::statement('ALTER TABLE analises MODIFY COLUMN status VARCHAR(20) NOT NULL'),
            'sqlite' => Schema::table('analises', function (Blueprint $table) {
                $table->string('status', 20)->change();
            }),
            default => null,
        };

        match (DB::getDriverName()) {
            'pgsql' => DB::statement('ALTER TABLE transferencias DROP CONSTRAINT IF EXISTS transferencias_status_check'),
            'mysql' => DB::statement("ALTER TABLE transferencias MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'pendente'"),
            'sqlite' => Schema::table('transferencias', function (Blueprint $table) {
                $table->string('status', 20)->default('pendente')->change();
            }),
            default => null,
        };
    }

    public function down(): void
    {
        match (DB::getDriverName()) {
            'pgsql' => DB::statement("
                ALTER TABLE usuarios
                    ADD CONSTRAINT usuarios_status_check
                        CHECK (status IN ('ativo', 'suspenso'))
            "),
            'mysql' => DB::statement("ALTER TABLE usuarios MODIFY COLUMN status ENUM('ativo', 'suspenso') DEFAULT 'ativo'"),
            default => null,
        };

        match (DB::getDriverName()) {
            'pgsql' => DB::statement("
                ALTER TABLE analises
                    ADD CONSTRAINT analises_status_check
                        CHECK (status IN ('approved', 'pending', 'rejected'))
            "),
            'mysql' => DB::statement("ALTER TABLE analises MODIFY COLUMN status ENUM('approved', 'pending', 'rejected')"),
            default => null,
        };

        match (DB::getDriverName()) {
            'pgsql' => DB::statement("
                ALTER TABLE transferencias
                    ADD CONSTRAINT transferencias_status_check
                        CHECK (status IN ('pendente', 'confirmada', 'entregue', 'recusada', 'cancelada', 'alteracao_sugerida', 'nao_entregue'))
            "),
            'mysql' => DB::statement("
                ALTER TABLE transferencias
                    MODIFY COLUMN status ENUM('pendente', 'confirmada', 'entregue', 'recusada', 'cancelada', 'alteracao_sugerida', 'nao_entregue')
                    DEFAULT 'pendente'
            "),
            default => null,
        };
    }
};
