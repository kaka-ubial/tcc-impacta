<?php

namespace App\Http\Controllers\Api;

use App\Actions\Auth\ResolveAuthenticatedUser;
use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use Dedoc\Scramble\Attributes\BodyParameter;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Contracts\CreatesNewUsers;
use Laravel\Fortify\Fortify;

/**
 * Autenticação stateless (token) para a API. Complementa o login por sessão
 * do Fortify (usado pela UI Inertia) sem substituí-lo — ambos reaproveitam
 * a mesma lógica de resolução de credenciais e de criação de usuário.
 */
#[Group('Autenticação')]
class AuthController extends Controller
{
    /**
     * Login
     *
     * Autentica um usuário por e-mail/senha e emite um token de acesso (Sanctum).
     */
    public function login(Request $request, ResolveAuthenticatedUser $resolver)
    {
        $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'device_name' => ['sometimes', 'string', 'max:255'],
        ]);

        $throttleKey = Str::transliterate(Str::lower($request->email).'|'.$request->ip());

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            throw ValidationException::withMessages([
                'email' => ['Muitas tentativas. Tente novamente em breve.'],
            ]);
        }

        $user = $resolver->resolve($request->email, $request->password);

        if (! $user) {
            RateLimiter::hit($throttleKey, 60);

            throw ValidationException::withMessages([
                Fortify::username() => ['As credenciais informadas não conferem.'],
            ]);
        }

        RateLimiter::clear($throttleKey);

        $token = $user->createToken($request->input('device_name', 'api'));

        return response()->json([
            'token' => $token->plainTextToken,
            'user' => new UserResource($user),
        ], 201);
    }

    /**
     * Registro
     *
     * Cria uma conta de doador ou instituição e emite um token de acesso (Sanctum).
     * O conjunto de campos obrigatórios depende de `tipo_usuario` — ver
     * App\Concerns\ProfileValidationRules.
     */
    #[BodyParameter('email', description: 'E-mail único do usuário.', required: true, type: 'string')]
    #[BodyParameter('password', description: 'Senha (regras via Password::defaults()).', required: true, type: 'string')]
    #[BodyParameter('tipo_usuario', description: 'Tipo de conta.', required: true, type: 'string', example: 'doador')]
    #[BodyParameter('nome_completo', description: 'Obrigatório quando tipo_usuario=doador.', required: false, type: 'string')]
    #[BodyParameter('cpf', description: 'Obrigatório quando tipo_usuario=doador.', required: false, type: 'string')]
    #[BodyParameter('telefone', description: 'Obrigatório quando tipo_usuario=doador. Formato (99) 99999-9999.', required: false, type: 'string')]
    #[BodyParameter('exibir_em_transparencia', description: 'Opcional, apenas doador.', required: false, type: 'boolean')]
    #[BodyParameter('nome_fantasia', description: 'Obrigatório quando tipo_usuario=instituicao.', required: false, type: 'string')]
    #[BodyParameter('razao_social', description: 'Obrigatório quando tipo_usuario=instituicao.', required: false, type: 'string')]
    #[BodyParameter('cnpj', description: 'Obrigatório quando tipo_usuario=instituicao.', required: false, type: 'string')]
    #[BodyParameter('telefone_inst', description: 'Obrigatório quando tipo_usuario=instituicao. Formato (99) 99999-9999.', required: false, type: 'string')]
    #[BodyParameter('endereco_completo', description: 'Obrigatório quando tipo_usuario=instituicao; opcional para doador.', required: false, type: 'string')]
    #[BodyParameter('latitude', description: 'Opcional, entre -90 e 90.', required: false, type: 'float')]
    #[BodyParameter('longitude', description: 'Opcional, entre -180 e 180.', required: false, type: 'float')]
    #[BodyParameter('geocoding_query', description: 'Opcional, endereço usado para geocodificação.', required: false, type: 'string')]
    #[BodyParameter('causas_apoiadas', description: 'Opcional, IDs de causas apoiadas.', required: false, type: 'int[]')]
    #[BodyParameter('device_name', description: 'Opcional, nome do dispositivo/token Sanctum gerado.', required: false, type: 'string')]
    public function register(Request $request, CreatesNewUsers $creator)
    {
        $user = $creator->create($request->all());

        $token = $user->createToken($request->input('device_name', 'api'));

        return response()->json([
            'token' => $token->plainTextToken,
            'user' => new UserResource($user),
        ], 201);
    }

    /**
     * Logout
     *
     * Revoga o token de acesso atual.
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(null, 204);
    }

    /**
     * Usuário autenticado
     *
     * Retorna os dados do usuário dono do token informado.
     */
    public function me(Request $request)
    {
        return new UserResource($request->user());
    }
}
