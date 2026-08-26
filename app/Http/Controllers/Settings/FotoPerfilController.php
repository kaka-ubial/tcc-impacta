<?php

namespace App\Http\Controllers\Settings;

use App\Enums\UserType;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class FotoPerfilController extends Controller
{
    public function update(Request $request): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user->tipo_usuario === UserType::Doador && $user->doador, 403);

        $validated = $request->validate([
            'foto' => [
                'required',
                'file',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:2048',
            ],
        ]);

        $doador = $user->doador;

        if ($doador->foto_perfil) {
            Storage::disk('public')->delete($doador->foto_perfil);
        }

        $path = $validated['foto']->store('avatars', 'public');

        $doador->update(['foto_perfil' => $path]);

        return back();
    }

    public function destroy(Request $request): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user->tipo_usuario === UserType::Doador && $user->doador, 403);

        $doador = $user->doador;

        if ($doador->foto_perfil) {
            Storage::disk('public')->delete($doador->foto_perfil);
            $doador->update(['foto_perfil' => null]);
        }

        return back();
    }
}
