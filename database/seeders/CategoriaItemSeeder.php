<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\CategoriaItem;

class CategoriaItemSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categorias = [
            'Alimentos',
            'Água potável',
            'Roupas',
            'Cobertores',
            'Higiene pessoal',
            'Medicamentos',
            'Material de limpeza',
            'Fraldas',
            'Material escolar',
            'Móveis',
            'Equipamentos médicos',
            'Brinquedos',
            'Acessórios para bebês',
            'Ferramentas',
            'Equipamentos eletrônicos',
            'Outros',
            ];

        foreach ($categorias as $nome) {
            CategoriaItem::firstOrCreate([
                'nome' => $nome,
            ]);
        }
    }
}
