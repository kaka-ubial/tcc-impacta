<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pontuacao_eventos', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('doador_id');
            $table->unsignedBigInteger('doacao_id');
            $table->string('tipo');
            $table->unsignedBigInteger('referencia_id')->nullable();
            $table->integer('pontos');
            $table->timestamps();

            $table->unique(['doacao_id', 'tipo', 'referencia_id']);
            $table->index(['doador_id', 'tipo']);
            $table->foreign('doador_id')->references('usuario_id')->on('doador')->onDelete('cascade');
            $table->foreign('doacao_id')->references('id')->on('doacoes')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pontuacao_eventos');
    }
};
