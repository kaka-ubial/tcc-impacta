# Atalhos para o ambiente local com Laravel Sail (compose.yaml).
# `make` sem argumento lista os comandos.

SAIL := ./vendor/bin/sail

.DEFAULT_GOAL := help
.PHONY: help p up down restart build ps logs shell dev assets install migrate seed fresh test lint tinker

help: ## Lista os comandos
	@grep -E '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | awk -F ':.*## ' '{printf "  make %-10s %s\n", $$1, $$2}'

p: up shell ## Sobe os containers e abre um terminal dentro do app

up: ## Sobe os containers em segundo plano
	$(SAIL) up -d

# O Vite morre com o container sem apagar o hot file, e o Laravel
# continuaria apontando os assets para um dev server que não existe.
down: ## Para os containers (mantém o banco)
	$(SAIL) down
	@rm -f public/hot

restart: down up ## Reinicia os containers

build: ## Rebuilda a imagem do app (após mudar compose/runtime)
	$(SAIL) build --no-cache

ps: ## Status dos containers
	$(SAIL) ps

logs: ## Acompanha os logs dos containers
	$(SAIL) logs -f

shell: ## Abre um terminal dentro do container do app
	$(SAIL) shell

dev: ## Vite com HMR dentro do container
	$(SAIL) npm run dev

assets: ## Builda os assets do front (public/build)
	$(SAIL) npm run build

install: ## Instala dependências PHP e JS dentro do container
	$(SAIL) composer install
	$(SAIL) npm install

migrate: ## Roda as migrations
	$(SAIL) artisan migrate

seed: ## Roda os seeders
	$(SAIL) artisan db:seed

fresh: ## APAGA o banco, recria as tabelas e roda os seeders
	$(SAIL) artisan migrate:fresh --seed

test: ## Roda os testes
	$(SAIL) artisan test

lint: ## Lint e formatação (PHP e front)
	$(SAIL) php vendor/bin/pint
	$(SAIL) npm run lint

tinker: ## Abre o tinker
	$(SAIL) artisan tinker
