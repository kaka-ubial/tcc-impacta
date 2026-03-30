<?php

use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;
use App\Actions\Auth\ValidateRegisterStepOne;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::post('/validate/register-step-one', ValidateRegisterStepOne::class);

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});

require __DIR__.'/settings.php';
