<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CategoriaItem extends Model
{
    protected $table = 'categorias_itens';

    protected $fillable = ['nome'];
}
