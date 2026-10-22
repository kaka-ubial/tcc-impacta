<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Doador;
use App\Models\Instituicao;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class FotoPerfilController extends Controller
{
    public function update(Request $request): RedirectResponse
    {
        $perfil = $this->perfilDe($request);

        $validated = $request->validate([
            'foto' => [
                'required',
                'file',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:2048',
            ],
        ]);

        if ($perfil->foto_perfil) {
            Storage::disk('public')->delete($perfil->foto_perfil);
        }

        $path = $validated['foto']->store('avatars', 'public');

        $perfil->update(['foto_perfil' => $path]);

        return back();
    }

    public function destroy(Request $request): RedirectResponse
    {
        $perfil = $this->perfilDe($request);

        if ($perfil->foto_perfil) {
            Storage::disk('public')->delete($perfil->foto_perfil);
            $perfil->update(['foto_perfil' => null]);
        }

        return back();
    }

    private function perfilDe(Request $request): Doador|Instituicao
    {
        $user = $request->user();
        $perfil = $user->doador ?? $user->instituicao;

        abort_unless($perfil, 403);

        return $perfil;
    }
}
