<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Instituicao;
use App\Models\HorarioDisponivel;

class HorarioDisponivelSeeder extends Seeder
{
    public function run(): void
    {
        $instituicoes = Instituicao::where('status', 'approved')->pluck('usuario_id')->toArray();

        if (empty($instituicoes)) {
            $this->command->warn('Sem instituições aprovadas. Rode InstituicaoSeeder primeiro.');
            return;
        }

        // Horários variados e realistas para cada instituição
        $templates = [
            // Instituição com horários comerciais completos
            [
                ['dia' => 1, 'inicio' => '08:00', 'fim' => '12:00', 'tipo' => 'entrega'],
                ['dia' => 1, 'inicio' => '13:30', 'fim' => '17:00', 'tipo' => 'entrega'],
                ['dia' => 3, 'inicio' => '08:00', 'fim' => '12:00', 'tipo' => 'entrega'],
                ['dia' => 3, 'inicio' => '13:30', 'fim' => '17:00', 'tipo' => 'entrega'],
                ['dia' => 5, 'inicio' => '08:00', 'fim' => '12:00', 'tipo' => 'entrega'],
                ['dia' => 2, 'inicio' => '09:00', 'fim' => '12:00', 'tipo' => 'coleta'],
                ['dia' => 4, 'inicio' => '09:00', 'fim' => '12:00', 'tipo' => 'coleta'],
            ],
            // Instituição que funciona à tarde e sábado de manhã
            [
                ['dia' => 1, 'inicio' => '13:00', 'fim' => '18:00', 'tipo' => 'entrega'],
                ['dia' => 2, 'inicio' => '13:00', 'fim' => '18:00', 'tipo' => 'entrega'],
                ['dia' => 4, 'inicio' => '13:00', 'fim' => '18:00', 'tipo' => 'entrega'],
                ['dia' => 6, 'inicio' => '08:00', 'fim' => '12:00', 'tipo' => 'entrega'],
                ['dia' => 3, 'inicio' => '14:00', 'fim' => '17:00', 'tipo' => 'coleta'],
                ['dia' => 6, 'inicio' => '08:00', 'fim' => '11:00', 'tipo' => 'coleta'],
            ],
            // Instituição com expediente corrido
            [
                ['dia' => 1, 'inicio' => '09:00', 'fim' => '16:00', 'tipo' => 'entrega'],
                ['dia' => 2, 'inicio' => '09:00', 'fim' => '16:00', 'tipo' => 'entrega'],
                ['dia' => 3, 'inicio' => '09:00', 'fim' => '16:00', 'tipo' => 'entrega'],
                ['dia' => 4, 'inicio' => '09:00', 'fim' => '16:00', 'tipo' => 'entrega'],
                ['dia' => 5, 'inicio' => '09:00', 'fim' => '16:00', 'tipo' => 'entrega'],
                ['dia' => 5, 'inicio' => '14:00', 'fim' => '16:00', 'tipo' => 'coleta'],
            ],
            // Instituição que só faz coleta (vai buscar)
            [
                ['dia' => 1, 'inicio' => '08:00', 'fim' => '11:00', 'tipo' => 'coleta'],
                ['dia' => 3, 'inicio' => '08:00', 'fim' => '11:00', 'tipo' => 'coleta'],
                ['dia' => 5, 'inicio' => '08:00', 'fim' => '11:00', 'tipo' => 'coleta'],
                ['dia' => 6, 'inicio' => '09:00', 'fim' => '12:00', 'tipo' => 'coleta'],
                ['dia' => 2, 'inicio' => '14:00', 'fim' => '17:00', 'tipo' => 'entrega'],
            ],
            // Instituição com horário noturno e fim de semana
            [
                ['dia' => 2, 'inicio' => '18:00', 'fim' => '21:00', 'tipo' => 'entrega'],
                ['dia' => 4, 'inicio' => '18:00', 'fim' => '21:00', 'tipo' => 'entrega'],
                ['dia' => 6, 'inicio' => '09:00', 'fim' => '15:00', 'tipo' => 'entrega'],
                ['dia' => 0, 'inicio' => '09:00', 'fim' => '13:00', 'tipo' => 'entrega'],
                ['dia' => 6, 'inicio' => '09:00', 'fim' => '12:00', 'tipo' => 'coleta'],
            ],
        ];

        foreach ($instituicoes as $i => $instId) {
            $template = $templates[$i % count($templates)];

            foreach ($template as $h) {
                HorarioDisponivel::firstOrCreate(
                    [
                        'instituicao_id' => $instId,
                        'dia_semana' => $h['dia'],
                        'hora_inicio' => $h['inicio'],
                        'hora_fim' => $h['fim'],
                        'tipo' => $h['tipo'],
                    ],
                    ['ativo' => true],
                );
            }
        }
    }
}
