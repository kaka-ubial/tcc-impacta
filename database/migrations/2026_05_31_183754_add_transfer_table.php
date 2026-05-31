<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('transferencias', function (Blueprint $table) {
            $table->id();
            $table->foreignId('instituicao_origem_id')->constrained('usuarios')->cascadeOnDelete();
            $table->foreignId('instituicao_destino_id')->constrained('usuarios')->cascadeOnDelete();
            $table->enum('status', ['pendente', 'confirmada', 'entregue', 'recusada', 'cancelada', 'alteracao_sugerida', 'nao_entregue'])->default('pendente');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transferencias');
    }
};
