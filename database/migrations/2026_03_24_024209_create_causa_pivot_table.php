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
        Schema::create('doador_causa', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('doador_id');
            $table->unsignedBigInteger('causa_id');
            $table->timestamps();

            $table->foreign('doador_id')->references('usuario_id')->on('doador')->onDelete('cascade');
            $table->foreign('causa_id')->references('id')->on('causas')->onDelete('cascade');

            $table->unique(['doador_id', 'causa_id']);
        });

        Schema::create('instituicao_causa', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('instituicao_id');
            $table->unsignedBigInteger('causa_id');
            $table->timestamps();

            $table->foreign('instituicao_id')->references('usuario_id')->on('instituicao')->onDelete('cascade');
            $table->foreign('causa_id')->references('id')->on('causas')->onDelete('cascade');

            $table->unique(['instituicao_id', 'causa_id']);
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('instituicao_causa');
        Schema::dropIfExists('doador_causa');
    }
};
