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
        Schema::create('agendamentos', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('doacao_id');
            $table->datetime('data_hora');
            $table->enum('tipo', ['coleta', 'entrega']);
            $table->string('endereco_referencia')->nullable();
            $table->boolean('notificado_whatsapp')->default(false);
            $table->timestamps();

            $table->foreign('doacao_id')->references('id')->on('doacoes')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('agendamentos');
    }
};
