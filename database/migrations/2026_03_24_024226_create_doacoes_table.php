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
        Schema::create('doacoes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('doador_id');
            $table->unsignedBigInteger('instituicao_id');
            $table->enum('status', ['pendente', 'entregue', 'cancelado', 'recusada'])->default('pendente');
            $table->datetime('data_criacao')->useCurrent();
            $table->timestamps();

            $table->foreign('doador_id')->references('usuario_id')->on('doador')->onDelete('cascade');
            $table->foreign('instituicao_id')->references('usuario_id')->on('instituicao')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('doacoes');
    }
};
