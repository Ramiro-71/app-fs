# Manga Translator AI

Template inicial fullstack para procesar CBZ/CBR, extraer paginas y traducirlas con Gemini.

## Requisitos

- Node.js 22+
- Docker (PostgreSQL + Redis)

## Primeros pasos

1. Copiar variables de entorno:

```bash
cp .env.example .env
```

En Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

2. Levantar infraestructura local:

```bash
docker compose up -d
```

3. Instalar dependencias:

```bash
npm install
```

4. Generar cliente Prisma:

```bash
npm run db:generate
```

5. Ejecutar en desarrollo:

```bash
npm run dev
```

## Variables para limitar Gemini

- `TRANSLATION_WORKER_CONCURRENCY`: cantidad de traducciones en paralelo (recomendado `1` en plan gratuito).
- `GEMINI_RATE_LIMIT_MAX`: maximo de requests permitidos en la ventana.
- `GEMINI_RATE_LIMIT_WINDOW_MS`: ventana en milisegundos para el limite (ej: `60000` = 1 minuto).

## Scripts

- `npm run dev`: inicia Next.js + worker de traduccion en paralelo
- `npm run dev:web`: inicia solo Next.js
- `npm run dev:worker`: inicia solo worker de traduccion
- `npm run worker:translation`: alias de `npm run dev:worker`
- `npm run lint`: linter
- `npm run typecheck`: chequeo TypeScript
- `npm run test`: pruebas unitarias
- `npm run test:e2e`: pruebas Playwright
- `npm run db:migrate`: migraciones Prisma
