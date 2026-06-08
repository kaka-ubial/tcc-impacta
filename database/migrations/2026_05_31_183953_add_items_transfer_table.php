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
        Schema::create('itens_transferencia', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transferencia_id')->constrained('transferencias')->cascadeOnDelete();
            $table->foreignId('categoria_id')->constrained('categorias_itens');
            $table->foreignId('necessidade_id')->nullable()->constrained('necessidades')->nullOnDelete();
            $table->integer('quantidade');
            $table->string('descricao')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('itens_transferencia');
    }
};
