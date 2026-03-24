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
        Schema::create('necessidades', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('instituicao_id');
            $table->unsignedBigInteger('categoria_id');
            $table->string('descricao')->nullable();
            $table->integer('quantidade_objetivo')->default(0);
            $table->integer('quantidade_atual')->default(0);
            $table->enum('prioridade', ['alta', 'media', 'baixa'])->default('media');
            $table->timestamps();

            $table->foreign('instituicao_id')->references('usuario_id')->on('instituicao')->onDelete('cascade');
            $table->foreign('categoria_id')->references('id')->on('categorias_itens')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('necessidades');
    }
};
