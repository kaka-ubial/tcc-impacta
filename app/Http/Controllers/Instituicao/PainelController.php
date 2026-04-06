<?php

namespace App\Http\Controllers\Instituicao;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class PainelController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('instituicao/painel');
    }
}
