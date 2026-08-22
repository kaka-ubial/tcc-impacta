<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Instituicao;
use App\Models\CategoriaItem;
use App\Models\Necessidade;

class NecessidadeSeeder extends Seeder
{
    public function run(): void
    {
        $categorias = CategoriaItem::pluck('id', 'nome')->toArray();
        $instituicoes = Instituicao::where('status', 'approved')->pluck('usuario_id')->toArray();

        if (empty($instituicoes) || empty($categorias)) {
            $this->command->warn('Sem instituições aprovadas ou categorias. Rode InstituicaoSeeder e CategoriaItemSeeder primeiro.');
            return;
        }

        $necessidades = [
            // Alimentos
            ['categoria' => 'Alimentos', 'descricao' => 'Cestas básicas para famílias em situação de vulnerabilidade', 'qty' => 200, 'atual' => 45, 'prioridade' => 'alta'],
            ['categoria' => 'Alimentos', 'descricao' => 'Leite em pó para crianças de 0 a 3 anos', 'qty' => 100, 'atual' => 12, 'prioridade' => 'alta'],
            ['categoria' => 'Alimentos', 'descricao' => 'Alimentos não perecíveis para estoque do mês', 'qty' => 150, 'atual' => 80, 'prioridade' => 'media'],

            // Roupas
            ['categoria' => 'Roupas', 'descricao' => 'Agasalhos infantis para campanha do inverno', 'qty' => 300, 'atual' => 50, 'prioridade' => 'alta'],
            ['categoria' => 'Roupas', 'descricao' => 'Roupas masculinas adultas em bom estado', 'qty' => 100, 'atual' => 30, 'prioridade' => 'media'],
            ['categoria' => 'Roupas', 'descricao' => 'Calçados infantis tamanhos 25 a 35', 'qty' => 80, 'atual' => 10, 'prioridade' => 'media'],

            // Cobertores
            ['categoria' => 'Cobertores', 'descricao' => 'Cobertores para moradores em situação de rua', 'qty' => 150, 'atual' => 20, 'prioridade' => 'alta'],
            ['categoria' => 'Cobertores', 'descricao' => 'Mantas e edredons para abrigo noturno', 'qty' => 60, 'atual' => 15, 'prioridade' => 'media'],

            // Higiene
            ['categoria' => 'Higiene pessoal', 'descricao' => 'Kits de higiene (sabonete, shampoo, escova dental)', 'qty' => 200, 'atual' => 60, 'prioridade' => 'media'],
            ['categoria' => 'Higiene pessoal', 'descricao' => 'Absorventes femininos para distribuição mensal', 'qty' => 500, 'atual' => 100, 'prioridade' => 'alta'],

            // Fraldas
            ['categoria' => 'Fraldas', 'descricao' => 'Fraldas descartáveis tamanho G e GG', 'qty' => 300, 'atual' => 40, 'prioridade' => 'alta'],
            ['categoria' => 'Fraldas', 'descricao' => 'Fraldas geriátricas para idosos acamados', 'qty' => 100, 'atual' => 5, 'prioridade' => 'alta'],

            // Material escolar
            ['categoria' => 'Material escolar', 'descricao' => 'Cadernos e lápis para projeto de reforço escolar', 'qty' => 150, 'atual' => 70, 'prioridade' => 'media'],
            ['categoria' => 'Material escolar', 'descricao' => 'Mochilas escolares para crianças carentes', 'qty' => 50, 'atual' => 0, 'prioridade' => 'baixa'],

            // Medicamentos
            ['categoria' => 'Medicamentos', 'descricao' => 'Medicamentos básicos (dipirona, paracetamol, soro)', 'qty' => 100, 'atual' => 25, 'prioridade' => 'alta'],

            // Material de limpeza
            ['categoria' => 'Material de limpeza', 'descricao' => 'Produtos de limpeza para manutenção do abrigo', 'qty' => 50, 'atual' => 10, 'prioridade' => 'media'],
            ['categoria' => 'Material de limpeza', 'descricao' => 'Água sanitária e detergente para cozinha comunitária', 'qty' => 80, 'atual' => 35, 'prioridade' => 'baixa'],

            // Brinquedos
            ['categoria' => 'Brinquedos', 'descricao' => 'Brinquedos educativos para crianças de 3 a 10 anos', 'qty' => 60, 'atual' => 8, 'prioridade' => 'baixa'],
            ['categoria' => 'Brinquedos', 'descricao' => 'Jogos de tabuleiro para atividades em grupo', 'qty' => 20, 'atual' => 5, 'prioridade' => 'baixa'],

            // Móveis
            ['categoria' => 'Móveis', 'descricao' => 'Berços para ala de maternidade', 'qty' => 10, 'atual' => 2, 'prioridade' => 'media'],
            ['categoria' => 'Móveis', 'descricao' => 'Camas e colchões de solteiro para dormitório', 'qty' => 30, 'atual' => 12, 'prioridade' => 'alta'],

            // Acessórios para bebês
            ['categoria' => 'Acessórios para bebês', 'descricao' => 'Mamadeiras e chupetas novas', 'qty' => 40, 'atual' => 10, 'prioridade' => 'media'],
            ['categoria' => 'Acessórios para bebês', 'descricao' => 'Carrinhos de bebê em bom estado', 'qty' => 15, 'atual' => 3, 'prioridade' => 'baixa'],

            // Água potável
            ['categoria' => 'Água potável', 'descricao' => 'Galões de água 20L para comunidade sem abastecimento', 'qty' => 100, 'atual' => 20, 'prioridade' => 'alta'],

            // Equipamentos
            ['categoria' => 'Equipamentos médicos', 'descricao' => 'Cadeiras de rodas para doação a idosos', 'qty' => 5, 'atual' => 1, 'prioridade' => 'media'],
            ['categoria' => 'Equipamentos eletrônicos', 'descricao' => 'Computadores usados para sala de informática', 'qty' => 10, 'atual' => 2, 'prioridade' => 'baixa'],

            // Ferramentas
            ['categoria' => 'Ferramentas', 'descricao' => 'Ferramentas básicas para oficina de capacitação', 'qty' => 20, 'atual' => 5, 'prioridade' => 'baixa'],
        ];

        foreach ($necessidades as $nec) {
            $catId = $categorias[$nec['categoria']] ?? null;
            if (!$catId) continue;

            $instId = $instituicoes[array_rand($instituicoes)];

            Necessidade::firstOrCreate(
                [
                    'categoria_id' => $catId,
                    'descricao' => $nec['descricao'],
                ],
                [
                    'instituicao_id' => $instId,
                    'quantidade_objetivo' => $nec['qty'],
                    'quantidade_atual' => $nec['atual'],
                    'prioridade' => $nec['prioridade'],
                ],
            );
        }
    }
}
