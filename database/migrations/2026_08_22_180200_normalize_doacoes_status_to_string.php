<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        match (DB::getDriverName()) {
            'pgsql' => DB::statement('ALTER TABLE doacoes DROP CONSTRAINT IF EXISTS doacoes_status_check'),
            'mysql' => DB::statement("ALTER TABLE doacoes MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'pendente'"),
            'sqlite' => Schema::table('doacoes', function (Blueprint $table) {
                $table->string('status', 20)->default('pendente')->change();
            }),
            default => null,
        };
    }

    public function down(): void
    {
        match (DB::getDriverName()) {
            'pgsql' => DB::statement("
                ALTER TABLE doacoes
                    ADD CONSTRAINT doacoes_status_check
                        CHECK (status IN ('pendente','confirmada','entregue','cancelado','recusada','nao_entregue'))
            "),
            'mysql' => DB::statement("
                ALTER TABLE doacoes
                    MODIFY COLUMN status ENUM('pendente','confirmada','entregue','cancelado','recusada','nao_entregue')
                    DEFAULT 'pendente'
            "),
            default => null,
        };
    }
};
