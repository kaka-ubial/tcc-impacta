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
        Schema::create('itens_doacao', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('doacao_id');
            $table->unsignedBigInteger('categoria_id');
            $table->string('descricao')->nullable();
            $table->integer('quantidade');
            $table->timestamps();

            $table->foreign('doacao_id')->references('id')->on('doacoes')->onDelete('cascade');
            $table->foreign('categoria_id')->references('id')->on('categorias_itens')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('itens_doacao');
    }
};
