<?php

use App\Models\CategoriaItem;
use App\Models\Doacao;
use App\Models\Doador;
use App\Models\HorarioDisponivel;
use App\Models\Instituicao;
use App\Models\ItemDoacao;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| The closure you provide to your test functions is always bound to a specific PHPUnit test
| case class. By default, that class is "PHPUnit\Framework\TestCase". Of course, you may
| need to change it using the "pest()" function to bind a different classes or traits.
|
*/

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature');

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
|
| When you're writing tests, you often need to check that values meet certain conditions. The
| "expect()" function gives you access to a set of "expectations" methods that you can use
| to assert different things. Of course, you may extend the Expectation API at any time.
|
*/

expect()->extend('toBeOne', function () {
    return $this->toBe(1);
});

/*
|--------------------------------------------------------------------------
| Functions
|--------------------------------------------------------------------------
|
| While Pest is very powerful out-of-the-box, you may have some testing code specific to your
| project that you don't want to repeat in every file. Here you can also expose helpers as
| global functions to help you to reduce the number of lines of code in your test files.
|
*/

/*
|--------------------------------------------------------------------------
| API test helpers
|--------------------------------------------------------------------------
|
| Compartilhados por tests/Feature/Api/**. Ficam aqui (não em cada arquivo
| de teste) porque tests/Pest.php é sempre carregado, mesmo ao rodar um
| único arquivo isoladamente — funções definidas dentro de um arquivo de
| teste só existem quando esse arquivo é incluído na execução.
|
*/

function criarDoadorUser(string $password = 'password'): User
{
    $user = User::factory()->create([
        'tipo_usuario' => 'doador',
        'status' => 'ativo',
        'password' => Hash::make($password),
    ]);

    Doador::create([
        'usuario_id' => $user->id,
        'nome_completo' => 'Maria Doadora',
        'cpf' => fake()->unique()->numerify('###########'),
        'telefone' => '11999999999',
    ]);

    return $user->fresh();
}

function criarInstituicaoComHorario(): Instituicao
{
    $user = User::factory()->create([
        'tipo_usuario' => 'instituicao',
        'status' => 'ativo',
    ]);

    $instituicao = Instituicao::factory()->create([
        'usuario_id' => $user->id,
        'status' => 'approved',
    ]);

    HorarioDisponivel::create([
        'instituicao_id' => $instituicao->usuario_id,
        'dia_semana' => 1,
        'hora_inicio' => '08:00',
        'hora_fim' => '12:00',
        'tipo' => 'coleta',
        'ativo' => true,
    ]);

    return $instituicao;
}

function criarAdminUser(string $password = 'admin-password'): User
{
    return User::factory()->create([
        'tipo_usuario' => 'admin',
        'status' => 'ativo',
        'password' => Hash::make($password),
    ]);
}

function cnpjValido(): string
{
    $calc = function (array $nums, array $pesos) {
        $soma = 0;
        foreach ($nums as $i => $n) {
            $soma += $n * $pesos[$i];
        }
        $resto = $soma % 11;

        return $resto < 2 ? 0 : 11 - $resto;
    };

    $base = [];
    for ($i = 0; $i < 12; $i++) {
        $base[] = random_int(0, 9);
    }

    $d1 = $calc($base, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
    $d2 = $calc([...$base, $d1], [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);

    return implode('', [...$base, $d1, $d2]);
}

function cpfValido(): string
{
    $calc = function (array $nums, array $pesos) {
        $soma = 0;
        foreach ($nums as $i => $n) {
            $soma += $n * $pesos[$i];
        }
        $resto = ($soma * 10) % 11;

        return $resto === 10 ? 0 : $resto;
    };

    $base = [];
    for ($i = 0; $i < 9; $i++) {
        $base[] = random_int(0, 9);
    }

    $d1 = $calc($base, [10, 9, 8, 7, 6, 5, 4, 3, 2]);
    $d2 = $calc([...$base, $d1], [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);

    return implode('', [...$base, $d1, $d2]);
}

function registrarInstituicao(string $password = 'senha-teste-123'): array
{
    $email = 'inst.'.uniqid().'@exemplo.com';

    $response = test()->postJson('/api/register', [
        'email' => $email,
        'password' => $password,
        'password_confirmation' => $password,
        'tipo_usuario' => 'instituicao',
        'nome_fantasia' => 'Instituição de Teste',
        'razao_social' => 'Instituição de Teste LTDA',
        'cnpj' => cnpjValido(),
        'telefone_inst' => '(41) 3333-4444',
        'endereco_completo' => 'Rua de Teste, 123 - Curitiba/PR',
    ]);

    $response->assertCreated();

    return [
        'token' => $response->json('token'),
        'usuario_id' => $response->json('user.id'),
    ];
}

function criarDoacaoPendente(Instituicao $instituicao, string $status = 'pendente'): Doacao
{
    $doadorUser = criarDoadorUser();

    return Doacao::create([
        'doador_id' => $doadorUser->doador->usuario_id,
        'instituicao_id' => $instituicao->usuario_id,
        'status' => $status,
    ]);
}

/**
 * Cria estoque para a instituição: uma doação já entregue com um item na
 * categoria informada, exatamente como TransferenciaService::calcularEstoque
 * espera (soma de itens de doações entregues).
 */
function darEstoque(Instituicao $instituicao, CategoriaItem $categoria, int $quantidade): void
{
    $doadorUser = criarDoadorUser();

    $doacao = Doacao::create([
        'doador_id' => $doadorUser->doador->usuario_id,
        'instituicao_id' => $instituicao->usuario_id,
        'status' => 'entregue',
    ]);

    ItemDoacao::create([
        'doacao_id' => $doacao->id,
        'categoria_id' => $categoria->id,
        'quantidade' => $quantidade,
    ]);
}

/**
 * Cabeçalho Bearer para a próxima requisição. O guard do Sanctum cacheia o
 * usuário resolvido pela primeira vez dentro de um mesmo teste (o cliente
 * HTTP de teste reaproveita o container entre chamadas); ao alternar entre
 * tokens de contas diferentes num mesmo teste, é preciso "esquecer" o guard
 * para forçar a resolução a partir do novo header.
 */
function bearer(string $token): array
{
    app('auth')->forgetGuards();

    return ['Authorization' => "Bearer $token"];
}
