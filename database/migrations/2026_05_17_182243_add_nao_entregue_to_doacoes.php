<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

  return new class extends Migration
  {
      public function up(): void
      {
          match (DB::getDriverName()) {
              'pgsql' => DB::statement("
                  ALTER TABLE doacoes
                      DROP CONSTRAINT IF EXISTS doacoes_status_check,
                      ADD CONSTRAINT doacoes_status_check
                          CHECK (status IN ('pendente','confirmada','entregue','cancelado','recusada','nao_entregue'))
              "),
              'mysql' => DB::statement("
                  ALTER TABLE doacoes
                      MODIFY COLUMN status ENUM('pendente','confirmada','entregue','cancelado','recusada','nao_entregue')
                      DEFAULT 'pendente'
              "),
              default => null, 
          };
      }

      public function down(): void
      {
          match (DB::getDriverName()) {
              'pgsql' => DB::statement("
                  ALTER TABLE doacoes
                      DROP CONSTRAINT IF EXISTS doacoes_status_check,
                      ADD CONSTRAINT doacoes_status_check
                          CHECK (status IN ('pendente','confirmada','entregue','cancelado','recusada'))
              "),
              'mysql' => DB::statement("
                  ALTER TABLE doacoes
                      MODIFY COLUMN status ENUM('pendente','confirmada','entregue','cancelado','recusada')
                      DEFAULT 'pendente'
              "),
              default => null,
          };
      }
  };
