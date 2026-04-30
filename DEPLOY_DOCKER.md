# Docker Deploy

## Что создано

- `docker-compose.yml` — поднимает `postgres`, `server`, `client`, `caddy`
- `client/Dockerfile` — production-сборка Next.js
- `server/Dockerfile` — production-сборка NestJS
- `Caddyfile` — reverse proxy под домен и поддомен
- `.env.docker.example` — пример переменных окружения

## Схема доменов

- фронтенд: `example.ru`
- backend API: `api.example.ru`

## Что нужно на сервере

- Docker
- Docker Compose
- открытые порты `80` и `443`

## Подготовка

1. Скопировать пример env:

```bash
cp .env.docker.example .env
```

2. Отредактировать `.env`:

```env
APP_DOMAIN=example.ru
API_DOMAIN=api.example.ru
POSTGRES_DB=internetShop
POSTGRES_USER=postgres
POSTGRES_PASSWORD=strong-password
JWT_SECRET=very-strong-secret
API_PREFIX=api
RUN_SEED=true
NEXT_PUBLIC_API_URL=https://api.example.ru/api
ADMIN_EMAIL=admin@admin.ru
ADMIN_PASSWORD=admin123!
```

## Первый запуск

```bash
docker compose up -d --build
```

При первом запуске можно оставить:

```env
RUN_SEED=true
```

После успешного наполнения базы лучше вернуть:

```env
RUN_SEED=false
```

И перезапустить сервисы:

```bash
docker compose up -d
```

## DNS

У регистратора домена нужно создать записи:

- `A` для `example.ru` → IP вашего сервера
- `A` для `api.example.ru` → тот же IP сервера

После этого `Caddy` сам выпустит HTTPS-сертификаты.

## Полезные команды

Логи:

```bash
docker compose logs -f
```

Остановить:

```bash
docker compose down
```

Остановить без удаления данных:

```bash
docker compose stop
```

Пересобрать после изменений:

```bash
docker compose up -d --build
```

## Важно

- картинки товаров хранятся в volume `uploads_data`
- база хранится в volume `postgres_data`
- если удалить volumes, удалятся и данные
