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
- **Documentação da API:** spec OpenAPI gerada pelo [Scramble](https://scramble.dedoc.co/) e
  publicada num site [Docusaurus](https://docusaurus.io/) (ver [`docs/`](docs/))

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

A especificação OpenAPI é gerada a partir das rotas pelo Scramble e renderizada num site Docusaurus.

```bash
# Regenerar a spec OpenAPI a partir das rotas do Laravel
cd docs
npm install
npm run gen:api        # exporta docs/openapi/api.json via php artisan scramble:export

# Rodar o site de documentação localmente
npm run start          # http://localhost:3000  (referência de serviços em /api)
```

O site documenta todos os serviços do backend (sumário, descrição e exemplos de payload),
além de páginas sobre arquitetura, modelo de domínio, autenticação e os fluxos de doação e transferência.

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
routes/web.php        rotas da aplicação
database/seeders/      dados de exemplo
docs/                 site de documentação (Docusaurus + OpenAPI)
```

## Licença

MIT.
