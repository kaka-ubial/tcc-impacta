<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Causa extends Model
{
    use HasFactory;

    protected $table = 'causas';
    protected $primaryKey = 'id';
    protected $fillable = ['nome', 'icone'];
}
