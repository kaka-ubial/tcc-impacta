<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('horarios_disponiveis', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('instituicao_id');
            $table->tinyInteger('dia_semana'); // 0=domingo … 6=sábado
            $table->time('hora_inicio');
            $table->time('hora_fim');
            $table->enum('tipo', ['coleta', 'entrega']);
            $table->boolean('ativo')->default(true);
            $table->timestamps();

            $table->foreign('instituicao_id')
                ->references('usuario_id')
                ->on('instituicao')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('horarios_disponiveis');
    }
};
