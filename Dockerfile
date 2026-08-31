# Os assets do front (Vite/React) NAO sao buildados aqui: o Wayfinder exige
# PHP durante o `npm run build`, entao a pipeline builda os assets antes e o
# `COPY . .` abaixo ja traz o public/build pronto. Build once, promote many:
# a mesma imagem sobe em dev, test e prod, so trocando a tag.
FROM php:8.4-cli

RUN apt-get update && apt-get install -y libpq-dev libzip-dev libcurl4-openssl-dev unzip \
    && docker-php-ext-install pdo_pgsql zip curl \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN pecl install apcu \
    && docker-php-ext-enable apcu \
    && echo "apc.enable_cli=1" > /usr/local/etc/php/conf.d/zz-apcu.ini

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY . .

RUN composer install --no-dev --optimize-autoloader --no-interaction

EXPOSE 8080

# `artisan serve` e suficiente para o free tier do Render.
# O migrate --force garante que cada ambiente atualiza o proprio banco (Neon)
# a cada deploy.
CMD php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=8080

