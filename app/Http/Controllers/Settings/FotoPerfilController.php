<?php

namespace App\Http\Controllers\Settings;

use App\Enums\UserType;
use App\Http\Controllers\Controller;
use App\Models\Doador;
use App\Models\Instituicao;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * Foto de perfil do doador ou logo da instituição — mesma coluna
 * (`foto_perfil`) e mesmas regras nos dois perfis.
 */
class FotoPerfilController extends Controller
{
    public function update(Request $request): RedirectResponse
    {
        $perfil = $this->perfil($request);

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

        $path = $validated['foto']->store($perfil instanceof Instituicao ? 'logos' : 'avatars', 'public');

        $perfil->update(['foto_perfil' => $path]);

        return back();
    }

    public function destroy(Request $request): RedirectResponse
    {
        $perfil = $this->perfil($request);

        if ($perfil->foto_perfil) {
            Storage::disk('public')->delete($perfil->foto_perfil);
            $perfil->update(['foto_perfil' => null]);
        }

        return back();
    }

    private function perfil(Request $request): Doador|Instituicao
    {
        $user = $request->user();

        $perfil = match ($user->tipo_usuario) {
            UserType::Doador => $user->doador,
            UserType::Instituicao => $user->instituicao,
            default => null,
        };

        abort_unless($perfil, 403);

        return $perfil;
    }
}
