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
        Schema::create('analises', function (Blueprint $table) {
            $table->id();
            $table->foreignId('instituicao_id')->references('usuario_id') ->on('instituicao')->onDelete('cascade');            
            $table->foreignId('admin_id')->references('id') ->on('usuarios')->onDelete('cascade');            
            $table->enum('status', ['approved', 'pending', 'rejected']);
            $table->text('observacoes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('analises');
    }
};
