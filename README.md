# Impacta

Plataforma que conecta **doadores** a **instituições** para doação e transferência de itens,
com agendamento de entregas, recomendação de instituições por afinidade de causa e proximidade,
e um fluxo de aprovação de instituições por administradores. 

O sistema atende três perfis de usuário (`doador`, `instituicao`, `admin`), cada um com sua área
própria após o login. Instituições passam por um fluxo de aprovação (`pending` → `approved`/`rejected`)
antes de acessar o painel.

## Stack

- **Backend:** Laravel 13 (PHP 8.3), autenticação via Laravel Fortify
- **Frontend:** Inertia.js + React 19 (TypeScript), Tailwind CSS v4, componentes Radix UI (padrão shadcn)
- **Banco de dados:** PostgreSQL
- **Documentação da API:** spec OpenAPI gerada pelo [Scramble](https://scramble.dedoc.co/) a
  partir das rotas, com UI interativa em `/docs/api` (ver seção
  [Documentação da API](#documentação-da-api))

> **Nota de arquitetura:** o backend comunica-se com o frontend por **mensagens JSON** através do
> protocolo Inertia — cada rota entrega a uma página React as `props` de que ela precisa. As rotas
> seguem semântica REST (verbos HTTP + recursos) para as operações CRUD; as transições de estado
> (confirmar, entregar, recusar etc.) são endpoints de ação dedicados.

## Pré-requisitos

Instalação **local** (sem Docker). Você precisa ter instalado:

- **PHP 8.3+** com as extensões usuais do Laravel (`pdo_pgsql`, `mbstring`, `openssl`, `bcmath`, `ctype`, `fileinfo`, `tokenizer`, `xml`)
- **Composer 2**
- **Node.js 20+** e **npm**
- **PostgreSQL 14+** rodando localmente

## Rodando com Docker (Laravel Sail)

Alternativa à instalação local: app (PHP 8.4) e PostgreSQL sobem em containers via
[Laravel Sail](https://laravel.com/docs/sail). Só é preciso ter o Docker (e as dependências PHP
em `vendor/`, instaladas com `composer install`).

No `.env`, use o host de rede do Docker e uma porta livre:

```dotenv
APP_URL=http://localhost:8000
APP_PORT=8000
DB_HOST=pgsql
MAIL_MAILER=log
```

```bash
./vendor/bin/sail up -d              # 1ª vez builda a imagem (alguns minutos)
./vendor/bin/sail artisan key:generate   # só se APP_KEY estiver vazio
./vendor/bin/sail artisan migrate --seed
./vendor/bin/sail npm install        # binários Linux dentro do container
./vendor/bin/sail npm run dev        # Vite (HMR) na porta 5173
```

App em `http://localhost:8000`. O Postgres fica exposto em `localhost:5432` para clientes
externos. Testes: `./vendor/bin/sail artisan test`.

- `sail down` desliga os containers e mantém os dados (volume `sail-pgsql`).
  **`sail down -v` apaga o banco.**
- O `Dockerfile` da raiz é a imagem de **produção** (Render); não é usado no dev local.
- Com `DB_HOST=pgsql`, `php artisan` direto no host não alcança o banco: use `sail artisan`.

## Configuração do ambiente

```bash
# 1. Clonar e entrar no projeto
git clone <url-do-repositorio>
cd BSI_2026_1SEM_7U_EQ05

# 2. Dependências PHP e JS
composer install
npm install

# 3. Arquivo de ambiente e chave da aplicação
cp .env.example .env
php artisan key:generate
```

### Banco de dados

Crie um banco PostgreSQL local (padrão do projeto: `impacta`) e ajuste o `.env`.
O `.env.example` vem configurado para o host de rede do Docker (`pgsql`); em instalação **local**,
troque o host para `127.0.0.1`:

```dotenv
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=impacta
DB_USERNAME=<seu_usuario_postgres>
DB_PASSWORD=<sua_senha_postgres>
```

Rode as migrations e popule com dados de exemplo (seeders):

```bash
php artisan migrate --seed
```

Os seeders criam categorias de item, causas, horários, instituições, necessidades e um usuário
administrador padrão:

| Perfil | E-mail | Senha |
| --- | --- | --- |
| Admin | `admin@impacta.com` | `senha_segura` |

## Executando o projeto

```bash
# Sobe tudo junto: servidor Laravel + fila (queue) + Vite
composer dev
```

Isso inicia, concorrentemente:

- `php artisan serve` — aplicação em `http://localhost:8000`
- `php artisan queue:listen` — worker de fila (notificações etc.)
- `npm run dev` — Vite (assets do frontend + geração dos helpers de rota Wayfinder)

Acesse `http://localhost:8000`.

## Testes e qualidade

```bash
composer test          # roda o lint check e depois os testes (PHPUnit)
composer ci:check      # verificação completa de CI: lint + format + types + testes

composer lint          # corrige estilo PHP (Pint)
composer lint:check    # apenas verifica o estilo PHP

npm run lint           # ESLint (fix)
npm run format         # Prettier (fix)
npm run types:check    # checagem de tipos TypeScript
```

O ambiente de testes usa um banco `testing` separado, configurado automaticamente via `phpunit.xml`.

## Documentação da API

A especificação OpenAPI dos endpoints REST (`routes/api.php`) é gerada automaticamente pelo
[Scramble](https://scramble.dedoc.co/), a partir dos Form Requests (validação) e API Resources
(resposta) já usados pelos controllers — sem duplicar documentação manualmente.

```bash
# Servir a UI interativa (Stoplight Elements) em ambiente local
php artisan serve
# abrir http://localhost:8000/docs/api

# Exportar a spec OpenAPI para um arquivo JSON
php artisan scramble:export        # gera api.json na raiz do projeto
```

A UI em `/docs/api` só fica acessível em `APP_ENV=local` por padrão (middleware
`RestrictedDocsAccess` do próprio Scramble). Os endpoints são agrupados por perfil
(Autenticação, Doações, Instituições, Horários, Necessidades, Transferências, Agenda, Admin
etc.) e as rotas autenticadas (`auth:sanctum`) aparecem com o esquema de segurança Bearer.

> Um site de documentação mais completo (Docusaurus, com páginas de arquitetura, modelo de
> domínio e fluxos de doação/transferência) é um passo futuro — ainda não implementado.

## Estrutura do projeto

```
app/
  Http/Controllers/   controllers por perfil (Admin, Doador, Instituicao, ...)
  Models/             User, Doador, Instituicao, Doacao, Transferencia, ...
  Services/           RecommendationService, UserRedirectService, ...
resources/js/
  pages/              páginas React (renderizadas por Inertia), organizadas por perfil
  components/ui/       primitivos de UI (Radix/shadcn)
  routes/ actions/     helpers de rota gerados pelo Wayfinder
routes/web.php        rotas da aplicação (Inertia)
routes/api.php         rotas da API REST/JSON (Sanctum, documentadas via Scramble)
database/seeders/      dados de exemplo
```

## Licença

MIT.
