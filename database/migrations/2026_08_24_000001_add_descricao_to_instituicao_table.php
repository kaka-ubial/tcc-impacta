<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * O campo `descricao` já é fillable no model Instituicao e já é lido por
 * InstituicaoShowResource e pela página pública de detalhe da instituição
 * (resources/js/pages/instituicoes/show.tsx), mas a coluna nunca existiu na
 * tabela — qualquer tentativa de gravá-lo falhava silenciosamente (o campo
 * sempre resolvia para null na leitura). RF17 (edição de instituição pelo
 * admin) é o primeiro fluxo a de fato tentar persistir esse valor.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('instituicao', function (Blueprint $table) {
            $table->text('descricao')->nullable()->after('endereco_completo');
        });
    }

    public function down(): void
    {
        Schema::table('instituicao', function (Blueprint $table) {
            $table->dropColumn('descricao');
        });
    }
};
