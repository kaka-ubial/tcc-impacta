<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('avaliacoes', function (Blueprint $table) {
            $table->foreignId('usuario_id')->constrained('usuarios')->cascadeOnDelete();
            $table->foreignId('doacao_id')->unique()->constrained('doacoes')->cascadeOnDelete();
            $table->tinyInteger('nota');
            $table->text('descricao')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('avaliacoes', function (Blueprint $table) {
            $table->dropForeign(['usuario_id']);
            $table->dropForeign(['doacao_id']);
            $table->dropColumn(['usuario_id', 'doacao_id', 'nota', 'descricao']);
        });
    }
};
