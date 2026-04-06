# Repository Guidelines

## Project Structure & Module Organization
This repository is a Laravel 13 application with an Inertia React frontend. Backend code lives in `app/`, HTTP routes in `routes/`, configuration in `config/`, and database migrations, factories, and seeders in `database/`. Frontend pages, layouts, hooks, and shared components live under `resources/js/`; styles start in `resources/css/app.css`. Blade entry views are in `resources/views/`, public assets in `public/`, and automated tests in `tests/Feature` and `tests/Unit`.

## Build, Test, and Development Commands
Use Composer for PHP workflows and npm for frontend workflows.

- `composer setup`: install PHP and JS dependencies, create `.env`, generate the app key, run migrations, and build assets.
- `composer dev`: run the Laravel server, queue listener, and Vite dev server together.
- `npm run dev`: start only the Vite frontend server.
- `npm run build` or `npm run build:ssr`: produce production assets.
- `composer test`: run Pint in check mode and execute the Laravel test suite.
- `composer ci:check`: run ESLint, Prettier, TypeScript checks, and tests.

## Coding Style & Naming Conventions
Follow `.editorconfig`: UTF-8, LF endings, and 4-space indentation. Format PHP with `composer lint` (`pint --parallel`). Format frontend code with `npm run format`; lint with `npm run lint` or validate with `npm run lint:check`.

Use PSR-4 class naming for PHP (`App\Http\Controllers\...`) and PascalCase for React components. Keep page files in `resources/js/pages` lowercase or route-oriented, matching existing entries like `auth/login.tsx` and `instituicao/painel.tsx`. Prefer typed imports in TypeScript and keep import order alphabetized to satisfy ESLint.

## Testing Guidelines
Tests use Pest with Laravel integration. Feature tests automatically refresh the database via `tests/Pest.php`; place request, auth, and UI-flow coverage in `tests/Feature`. Reserve `tests/Unit` for isolated domain logic. Name tests with the `*Test.php` suffix and group scenarios by feature, for example `tests/Feature/Auth/RegistrationTest.php`.

## Commit & Pull Request Guidelines
Recent history mixes short Portuguese summaries with type prefixes such as `FEAT:`. Prefer concise, imperative commit messages, ideally with a scope or type when useful, for example `FEAT: add institution approval filter`. Keep each commit focused.

Pull requests should describe the behavior change, note migrations or seed updates, link the related work item, and include screenshots for UI changes in `resources/js` pages or components. Run `composer ci:check` before opening the PR.

## Configuration Tips
Never commit real secrets from `.env`. Use `.env.example` as the template for new variables and document any required queue, mail, or database settings when they change.
