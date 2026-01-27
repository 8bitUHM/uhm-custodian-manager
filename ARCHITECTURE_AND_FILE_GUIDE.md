## Custodian Manager — Architecture + File-by-File Guide (Deep Dive)

This document explains **why every file in this repo exists**, whether it’s **required by a framework/tool** (Next.js / FastAPI / Alembic / Docker) or is a **project choice**, and **how each piece integrates** with everything else.

It’s written for someone new to the stack.

---

## 1) What this repo is (one sentence)

This repo is a **3-service web app**:

- **Frontend**: Next.js 14 (React + TypeScript + Tailwind)
- **Backend**: FastAPI (Python) + SQLAlchemy ORM
- **Database**: PostgreSQL 15

All three run together via **Docker Compose**.

---

## 2) Mental model: what happens when you open the app?

### Runtime request flow (end-to-end)

When you open `http://localhost:3000`:

1. **Browser → Next.js frontend container**
   - Next.js serves the dashboard page.
2. **Next.js page code → FastAPI backend**
   - Example: the dashboard page calls:
     - `GET {NEXT_PUBLIC_API_URL}/api/dashboard/stats`
3. **FastAPI route handler → SQLAlchemy session**
   - The route handler in `backend/main.py` uses `Depends(get_db)` to get a DB session.
4. **SQLAlchemy session → PostgreSQL**
   - Queries run against the Postgres container (`db` service in Docker Compose).
5. **Backend → Frontend → Browser**
   - Backend returns JSON; frontend renders UI.

### Key integration points

- **Frontend → Backend URL**
  - The frontend reads `process.env.NEXT_PUBLIC_API_URL` (set in `docker-compose.yml` and `frontend/next.config.js`).
- **Backend → Database URL**
  - The backend reads `DATABASE_URL` (set in `docker-compose.yml` and also documented in `env.example`).

---

## 3) How this repo runs in development (Docker Compose)

### The source of truth: `docker-compose.yml`

The app is built as three containers on a shared bridge network:

- `db` (Postgres)
- `backend` (FastAPI)
- `frontend` (Next.js)

Compose ensures:

- The **backend waits** until the database passes a healthcheck.
- The **frontend waits** until the backend container starts.

### Live code editing (volumes)

`docker-compose.yml` mounts local folders into containers:

- `./backend:/app` means your local backend code is visible inside the backend container at `/app`
- `./frontend:/app` means your local frontend code is visible inside the frontend container at `/app`

So code changes can reflect quickly without rebuilding everything (depending on how each container is started).

---

## 4) How database schema changes are intended to work (Alembic)

This repo includes **Alembic**, which is the standard migration tool for SQLAlchemy.

### Important nuance in this repo

The backend currently runs:

- **`Base.metadata.create_all(bind=engine)` on startup** (in `backend/main.py`)

This auto-creates tables based on models if they don’t exist.

At the same time, the repo also has **Alembic migrations** (in `backend/alembic/versions/`).

That means there are *two* ways schema can be created/changed:

- **Create-all on boot**: quick convenience, but can drift and is not great for production migrations.
- **Alembic migrations**: explicit, versioned schema changes (recommended for real deployments).

You’ll see both referenced in this guide so you can understand why both exist.

---

## 5) Repo layout (top level)

```
uhm-custodian-manager/
  backend/
  frontend/
  docker-compose.yml
  env.example
  init.sql
  README.md
  ARCHITECTURE_AND_FILE_GUIDE.md
```

Note: there may also be dotfiles (like `.gitignore`, `.env`, etc.) that aren’t shown in the initial snapshot; this guide covers what we can see in the workspace structure.

---

## 6) File-by-file breakdown — Root

### `README.md`
- **Required?** No (project documentation), but effectively required for humans.
- **Why it exists**: Explains what the project is, how to run it, and lists API routes.
- **How it integrates**: It describes the same entrypoints defined in `docker-compose.yml` and the backend routes defined in `backend/main.py`.

### `docker-compose.yml`
- **Required?** Not required by Docker, but this repo is designed around it.
- **Why it exists**: One command (`docker-compose up --build`) starts the full stack.
- **How it integrates**:
  - Defines the Postgres container and persistent volume.
  - Builds and runs the backend and frontend from their Dockerfiles.
  - Supplies environment variables:
    - `DATABASE_URL` for the backend
    - `NEXT_PUBLIC_API_URL` for the frontend
  - Connects everything on a shared network so containers can reach each other by service name (e.g. `db`).

### `env.example`
- **Required?** No. It’s a template.
- **Why it exists**: Documents the expected environment variables and provides defaults for local dev.
- **How it integrates**:
  - The backend reads `DATABASE_URL` via `os.getenv()` (see `backend/database.py`).
  - Alembic migration environment loads `.env` (see `backend/alembic/env.py`) to find `DATABASE_URL`.
  - The frontend uses `NEXT_PUBLIC_API_URL` to call the backend.

### `init.sql`
- **Required?** Not required, but used by the Postgres Docker image convention: any SQL file mounted into `/docker-entrypoint-initdb.d/` runs on first initialization.
- **Why it exists**: Initializes database/user/privileges the first time the database volume is created.
- **How it integrates**:
  - Mounted by `docker-compose.yml` into the Postgres init directory.
  - Runs only when the Postgres data directory is empty (first startup).
- **Note (practical detail)**: `docker-compose.yml` already sets `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, so `init.sql` overlaps with what the official Postgres image does automatically. That’s not “wrong,” but it can be redundant and (depending on the exact init sequence) can sometimes cause “already exists” errors if it tries to create something that the entrypoint already created.

---

## 7) File-by-file breakdown — Backend (`backend/`)

Backend stack:

- **FastAPI**: HTTP API + request/response validation
- **SQLAlchemy**: DB ORM (models + sessions)
- **Alembic**: migration versioning

### `backend/main.py`
- **Required?** Not by FastAPI itself (you can name it anything), but required by *this repo’s* startup commands:
  - Docker runs `uvicorn main:app ...` (see `backend/Dockerfile`)
  - That syntax means “import `app` from `main.py`”
- **What it does**:
  - Defines the FastAPI app object.
  - Adds CORS middleware so the browser frontend can call the API.
  - Defines REST endpoints directly (no router modules yet).
  - Creates DB tables on startup via `Base.metadata.create_all(...)`.
- **How it integrates**:
  - Imports `engine` and `get_db` from `backend/database.py`.
  - Imports SQLAlchemy `Base` and models from `backend/models.py`.
  - Imports Pydantic schemas from `backend/schemas.py`.
  - Calls CRUD functions from `backend/crud.py`.

### `backend/database.py`
- **Required?** Not by SQLAlchemy, but it’s a standard project module.
- **What it does**:
  - Reads `DATABASE_URL` from environment variables.
  - Creates:
    - `engine` (connection pool factory)
    - `SessionLocal` (session factory)
    - `Base` (declarative base class for ORM models)
  - Exposes `get_db()` dependency generator for FastAPI to inject sessions per request.
- **How it integrates**:
  - `main.py` calls `Depends(get_db)` so each request has a DB session.
  - `models.py` imports `Base` from here to register ORM tables.

### `backend/models.py`
- **Required?** Not by SQLAlchemy, but it’s the conventional place for ORM models.
- **What it does**:
  - Defines database tables as Python classes (ORM):
    - `Custodian`, `Building`, `Task`, `Supervisor`, `J3`
  - Defines `TaskStatus` enum used by the `Task` table.
  - Defines relationships (`relationship(...)`) so joined objects can be loaded.
- **How it integrates**:
  - These classes are the “single source of truth” for table structure used by:
    - `crud.py` queries
    - Alembic autogenerate (via `Base.metadata` in `alembic/env.py`)
    - The `create_all(...)` call in `main.py`

### `backend/schemas.py`
- **Required?** Not by FastAPI, but FastAPI works best with Pydantic schemas.
- **What it does**:
  - Defines Pydantic models for:
    - Request bodies (e.g. `CustodianCreate`)
    - Response bodies (e.g. `CustodianResponse`)
  - Uses `Config.from_attributes = True` so FastAPI can serialize SQLAlchemy ORM objects into these schemas.
- **How it integrates**:
  - `main.py` declares `response_model=...` on routes to shape returned JSON.
  - `crud.py` receives these schemas (create models) and converts them into ORM instances.

### `backend/crud.py`
- **Required?** No (project choice).
- **What it does**:
  - Implements “CRUD” functions: create/read/update/delete for each resource.
  - Keeps DB logic separate from HTTP route definitions.
- **How it integrates**:
  - `main.py` calls these functions inside route handlers.
  - These functions use:
    - SQLAlchemy `Session` injected by `get_db()`
    - ORM models from `models.py`
    - Input schemas from `schemas.py`

### `backend/seed.py`
- **Required?** No.
- **What it does**: A script to insert sample “Supervisor” and “J3” records (and wipe existing ones).
- **How it integrates**:
  - Uses `SessionLocal` from `database.py` directly (not FastAPI injection).
  - Uses ORM models `Supervisor` and `J3`.
  - Intended to be run manually (e.g., inside the backend container) to populate test data.

### `backend/requirements.txt`
- **Required?** Not strictly, but it’s the standard for pip-based Python projects.
- **What it does**: Pins Python dependencies used by the backend.
- **How it integrates**:
  - The backend Dockerfile installs these exact versions.
  - Key packages:
    - `fastapi`, `uvicorn`: HTTP server + app framework
    - `sqlalchemy`, `psycopg2-binary`: ORM + Postgres driver
    - `alembic`: migrations
    - `python-dotenv`: read `.env` files for migrations/local dev

### `backend/Dockerfile`
- **Required?** Not by Docker Compose, but Compose uses it because `docker-compose.yml` says `build: ./backend`.
- **What it does**:
  - Builds a Python 3.11 image with system libs needed for Postgres drivers.
  - Installs requirements.
  - Runs `uvicorn main:app`.
- **How it integrates**:
  - Compose passes `DATABASE_URL` so the backend connects to the `db` service.
  - Exposes port 8000 so host machine can hit `http://localhost:8000`.

---

## 8) File-by-file breakdown — Backend migrations (Alembic)

Alembic is a tool that tracks your schema changes as versioned Python scripts.

### `backend/alembic.ini`
- **Required?** Yes, by Alembic CLI.
- **What it does**:
  - Defines where migration scripts live (`script_location = alembic`).
  - Contains a placeholder `sqlalchemy.url`, but in this repo it’s overridden at runtime by `alembic/env.py` using `DATABASE_URL`.
- **How it integrates**:
  - When you run `alembic revision ...` or `alembic upgrade ...`, Alembic reads this file first.

### `backend/alembic/env.py`
- **Required?** Yes, by Alembic (this is the “migration runner” environment).
- **What it does**:
  - Tells Alembic what metadata to compare for `--autogenerate`:
    - `target_metadata = Base.metadata`
  - Loads environment variables from a `.env` file and injects `DATABASE_URL` into Alembic config.
  - Sets up offline vs online migrations (standard Alembic pattern).
- **How it integrates**:
  - Imports `Base` from `models.py` so Alembic can “see” your SQLAlchemy models.
  - Reads `DATABASE_URL` so migrations run against the correct database.

### `backend/alembic/script.py.mako`
- **Required?** No, but Alembic uses it as the default template when creating new migration files.
- **What it does**: Controls the boilerplate of generated revision files.
- **How it integrates**: When you run `alembic revision --autogenerate`, Alembic renders this template into a new file in `alembic/versions/`.

### `backend/alembic/versions/7b6c3da95734_.py`
- **Required?** It’s required if you want to reproduce the schema via migrations; it’s one migration revision.
- **What it does**:
  - Defines `upgrade()` steps that create the initial tables.
  - Defines `downgrade()` steps that drop them.
- **How it integrates**:
  - Alembic applies these in order when you run `alembic upgrade head`.
  - This migration matches the ORM model definitions at the time it was generated.

### `backend/alembic/README`
- **Required?** No.
- **What it does**: Placeholder file generated by Alembic (“Generic single-database configuration.”).

---

## 9) File-by-file breakdown — Frontend (`frontend/`)

Frontend stack:

- **Next.js 14 (App Router)** for routing + build + runtime
- **React 18** for UI
- **TypeScript** for types
- **Tailwind CSS** for styling

### `frontend/package.json`
- **Required?** Yes for Node/Next projects.
- **What it does**:
  - Declares dependencies (Next, React, Tailwind, axios, etc.).
  - Defines scripts:
    - `dev` (local dev server)
    - `build` (production build)
    - `start` (run production server)
- **How it integrates**:p
  - Dockerfile uses these scripts to install/build/start.

### `frontend/package-lock.json`
- **Required?** Not required by npm, but strongly recommended.
- **What it does**: Pins the full dependency tree so installs are reproducible.
- **How it integrates**:
  - `npm ci` uses this file to install exactly what’s pinned.

### `frontend/Dockerfile`
- **Required?** Not by Docker Compose, but Compose uses it because `docker-compose.yml` says `build: ./frontend`.
- **What it does**:
  - Installs dependencies (`npm ci`)
  - Builds the Next.js app (`npm run build`)
  - Runs it (`npm start`)
- **How it integrates**:
  - Compose sets `NEXT_PUBLIC_API_URL` so the app knows where the backend is.

### `frontend/next.config.js`
- **Required?** No, but used here to provide a default API URL.
- **What it does**:
  - Sets `env.NEXT_PUBLIC_API_URL` so Next.js replaces `process.env.NEXT_PUBLIC_API_URL` during build/runtime.
- **How it integrates**:
  - The dashboard page uses this env var to call the backend stats endpoint.

### `frontend/next-env.d.ts`
- **Required?** Yes for TypeScript + Next (generated by Next).
- **What it does**:
  - Adds Next.js type definitions to the TS compiler.
- **How it integrates**:
  - Included by `tsconfig.json`.
  - Should not be edited manually.

### `frontend/tsconfig.json`
- **Required?** For TypeScript usage, yes.
- **What it does**:
  - Configures the TypeScript compiler and Next.js TS integration.
  - Defines a path alias:
    - `@/*` → `./src/*`
- **How it integrates**:
  - Enables imports like `import type { Supervisor } from "@/lib/types"`.

### `frontend/tailwind.config.js`
- **Required?** Not strictly, but needed for Tailwind customization and scanning.
- **What it does**:
  - Tells Tailwind where to scan for classnames (`./src/app/**/*...` etc.).
  - Defines custom theme colors.
- **How it integrates**:
  - Tailwind uses it during build to generate only the CSS classes you use.

### `frontend/postcss.config.js`
- **Required?** For Tailwind in Next, yes (Tailwind is a PostCSS plugin).
- **What it does**:
  - Registers `tailwindcss` and `autoprefixer`.
- **How it integrates**:
  - Next’s build pipeline runs PostCSS and produces final CSS.

---

## 10) File-by-file breakdown — Frontend app code (`frontend/src/`)

### Next.js App Router: how routing works

In Next.js App Router:

- A folder under `src/app/` defines a route segment.
- A `page.tsx` file is the actual page for that route.

Examples from this repo:

- `src/app/page.tsx` → `/`
- `src/app/custodian/page.tsx` → `/custodian`
- `src/app/custodian/add/page.tsx` → `/custodian/add`

### `frontend/src/app/layout.tsx`
- **Required?** Yes in App Router (root layout is required).
- **What it does**:
  - Defines the “shell” HTML for all pages.
  - Imports global CSS.
  - Wraps the app in `ToastProvider`, making toast notifications available across pages.
- **How it integrates**:
  - `ToastProvider` comes from `src/app/components/Toast.tsx`.
  - Any page can call `useToast()` as long as it’s under this provider.

### `frontend/src/app/globals.css`
- **Required?** Not required by Next, but required if you want Tailwind and global styles.
- **What it does**:
  - Loads Tailwind layers (`@tailwind base/components/utilities`).
  - Adds a global background gradient and some CSS variables.
- **How it integrates**:
  - Imported by `layout.tsx`, so it applies to the whole app.

### `frontend/src/app/page.tsx` (Dashboard page: `/`)
- **Required?** This file is required *to have a `/` route*.
- **What it does**:
  - Client component (has `'use client'`), uses React hooks.
  - Fetches dashboard statistics from the backend:
    - `GET ${NEXT_PUBLIC_API_URL}/api/dashboard/stats`
  - Renders stat cards and some placeholder “recent activity”.
  - Links to other routes (some are placeholders like `/CHANGEME`).
- **How it integrates**:
  - Calls the backend endpoint defined in `backend/main.py`.
  - Uses `NavBar` component from `src/app/components/Navbar.tsx`.

### `frontend/src/app/custodian/page.tsx` (Custodian overview: `/custodian`)
- **Required?** Required if you want the `/custodian` route.
- **What it does**:
  - Currently a placeholder page.
- **How it integrates**:
  - Linked from the navbar.

### `frontend/src/app/custodian/add/page.tsx` (Add custodian: `/custodian/add`)
- **Required?** Required if you want the `/custodian/add` route.
- **What it does**:
  - Client component with a form.
  - Uses `useToast()` to show success/failure messages.
  - Currently collects data into a `Supervisor` type (from `src/lib/types.ts`).
  - Contains commented-out examples of posting to the backend via `axios` or `fetch`.
- **How it integrates**:
  - Toast system: `useToast()` from `components/Toast.tsx` + provider from `layout.tsx`.
  - Types: `Supervisor` from `src/lib/types.ts`.
  - Intended backend integration: `POST /api/supervisors/` (exists in `backend/main.py`).

### `frontend/src/app/components/Navbar.tsx`
- **Required?** No.
- **What it does**:
  - Displays a header with links and a mobile drawer.
- **How it integrates**:
  - Used by `src/app/page.tsx` as the dashboard header.
  - Links to `/custodian` and placeholder `#` links for future pages.

### `frontend/src/app/components/Toast.tsx`
- **Required?** No.
- **What it does**:
  - Implements a React Context provider with:
    - `ToastProvider` (wraps the app)
    - `useToast()` hook to trigger toasts
- **How it integrates**:
  - `layout.tsx` wraps all pages in `ToastProvider`.
  - Any client component can call `useToast()` to display notifications.

### `frontend/src/lib/types.ts`
- **Required?** No.
- **What it does**:
  - Central place for shared TypeScript types.
  - Currently only defines `Supervisor`.
- **How it integrates**:
  - Imported by the add-custodian page using the `@/` path alias.

---

## 11) “Required by framework?” quick reference

This is a practical guide to which filenames/locations are conventions vs hard requirements.

### Next.js (frontend)
- **Hard requirements for App Router**
  - `src/app/layout.tsx`: root layout required
  - `src/app/**/page.tsx`: route pages
  - `next-env.d.ts` + `tsconfig.json` (for TS support)
- **Strong conventions**
  - `globals.css` imported by layout (your choice, but typical)
  - `tailwind.config.js` and `postcss.config.js` for Tailwind
  - `next.config.js` for custom config/env

### FastAPI (backend)
- **No hard filename requirements**
  - FastAPI doesn’t care if the entry file is `main.py`—that’s a project convention.
- **But Docker/uvicorn command does**
  - This repo’s Dockerfile runs `uvicorn main:app`, so `backend/main.py` must exist with a top-level `app` object.

### Alembic (backend migrations)
- **Hard requirements**
  - `alembic.ini`
  - `alembic/env.py`
  - `alembic/versions/*.py` revision scripts (if you want migration history)

### Docker Compose
- **Hard requirements**
  - `docker-compose.yml` if you want the “one command starts everything” workflow.
  - Each service with `build: ...` expects a `Dockerfile` in that directory.

---

## 12) Where to look for specific “how does X work?” questions

- **“What endpoints exist?”**
  - `backend/main.py`
- **“What tables exist and what columns do they have?”**
  - `backend/models.py`
  - (and the migration file in `backend/alembic/versions/`)
- **“Where does the DB connection come from?”**
  - `backend/database.py` (reads `DATABASE_URL`)
- **“Where does the frontend call the backend?”**
  - `frontend/src/app/page.tsx` (fetch stats)
  - `frontend/src/app/custodian/add/page.tsx` (intended POST)
- **“Where is the API base URL configured?”**
  - `docker-compose.yml` (env)
  - `frontend/next.config.js` (default)
- **“How do toasts work?”**
  - `frontend/src/app/components/Toast.tsx`
  - `frontend/src/app/layout.tsx` (provider)

---

## 13) Suggested next reading order (if you’re learning the stack)

If you want the smoothest “learn by reading” path:

1. `docker-compose.yml` (how everything starts)
2. `backend/main.py` (API routes)
3. `backend/database.py` + `backend/models.py` (DB plumbing + schema)
4. `frontend/src/app/layout.tsx` + `frontend/src/app/page.tsx` (UI shell + first API call)
5. `backend/alembic/env.py` + `backend/alembic/versions/...` (migrations)








Schemas folder handles data validation before saving. This is beause sometimes we want to save soemthing different than raw data.
For example: we may want to save a hash of a password.


ensure you 