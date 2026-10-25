<!DOCTYPE html>
<html lang="pt-BR">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        @php
            $titulo = $quem.' conquistou o badge "'.$badge->nome.'"';
            $descricao = $badge->descricao.' Faça parte e doe também.';
        @endphp

        <title>{{ $titulo }} · {{ config('app.name') }}</title>
        <meta name="description" content="{{ $descricao }}">
        <link rel="canonical" href="{{ $url }}">
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">

        <meta property="og:type" content="website">
        <meta property="og:site_name" content="{{ config('app.name') }}">
        <meta property="og:title" content="{{ $titulo }}">
        <meta property="og:description" content="{{ $descricao }}">
        <meta property="og:url" content="{{ $url }}">
        <meta property="og:image" content="{{ $imagem }}">
        <meta property="og:image:width" content="600">
        <meta property="og:image:height" content="600">
        <meta property="og:image:alt" content="Badge {{ $badge->nome }}">
        <meta property="og:locale" content="pt_BR">

        <meta name="twitter:card" content="summary">
        <meta name="twitter:title" content="{{ $titulo }}">
        <meta name="twitter:description" content="{{ $descricao }}">
        <meta name="twitter:image" content="{{ $imagem }}">

        <style>
            :root { --brand: oklch(0.511 0.086 186); --brand-strong: oklch(0.437 0.071 188); --brand-soft: oklch(0.955 0.035 183); }
            * { box-sizing: border-box; }
            body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px; background: var(--brand-soft); color: #1f2937; font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif; }
            main { width: 100%; max-width: 420px; padding: 32px 24px; border-radius: 24px; background: #fff; text-align: center; box-shadow: 0 10px 30px rgb(0 0 0 / 0.08); }
            img { width: 180px; height: 180px; }
            h1 { margin: 16px 0 4px; font-size: 1.5rem; }
            .quem { margin: 0; color: #6b7280; font-size: 0.9rem; }
            .desc { margin: 16px 0 24px; line-height: 1.5; }
            a.cta { display: inline-block; padding: 12px 24px; border-radius: 999px; background: var(--brand); color: #fff; font-weight: 600; text-decoration: none; }
            a.cta:hover { background: var(--brand-strong); }
            .data { margin-top: 20px; font-size: 0.75rem; color: #9ca3af; }
        </style>
    </head>
    <body>
        <main>
            <img src="{{ $imagem }}" alt="Badge {{ $badge->nome }}">
            <h1>{{ $badge->nome }}</h1>
            <p class="quem">Conquistado por {{ $quem }}</p>
            <p class="desc">{{ $badge->descricao }}</p>
            <a class="cta" href="{{ url('/') }}">Quero doar também</a>
            <p class="data">Conquistado em {{ $conquistadoEm->translatedFormat('d \d\e F \d\e Y') }}</p>
        </main>
    </body>
</html>
