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
        Schema::create('instituicao', function (Blueprint $table) {
            $table->unsignedBigInteger('usuario_id')->primary();
            $table->string('nome_fantasia');
            $table->string('razao_social');
            $table->string('cnpj')->unique();
            $table->string('telefone');
            $table->string('endereco_completo');
            $table->float('latitude')->nullable();
            $table->float('longitude')->nullable();
            $table->string('status')->default('pending');
            $table->timestamps();

            $table->foreign('usuario_id')
                ->references('id')
                ->on('usuarios')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('instituicao');
    }
};
