# UniConnect

Public, text-first community platform for university students, alumni, faculty, and the wider university community.

Visitors can browse public profiles, posts, discussions, opportunities, and events without an account. Authentication is required to post, comment, like, save, connect, message, or create opportunities and events.

This repository is a monorepo:

```text
.
├── frontend/    Next.js + TypeScript + Tailwind CSS
├── backend/     FastAPI + SQLAlchemy + PostgreSQL
├── README.md
└── .gitignore
```

## Current status

Local V1 is running:

- Public browse for posts, people, opportunities, and events
- Email/password registration, verification, login, and password reset
- Profiles, community posts, discover, admin stats

SMTP is not configured yet. Verification and reset links are printed in the backend terminal.

## Local database

The host PostgreSQL instance on port 5432 cannot create a role without your sudo password. UniConnect uses Docker Postgres on **port 5434** instead:

```bash
docker compose up -d
```

`DATABASE_URL` in `backend/.env` is:

```text
postgresql+psycopg://uniconnect:uniconnect@127.0.0.1:5434/uniconnect
```

Apply migrations:

```bash
cd backend
source .venv/bin/activate
alembic upgrade head
```

## Prerequisites (Ubuntu)

Install these if they are not already present:

```bash
sudo apt update
sudo apt install -y git python3 python3-venv python3-pip postgresql postgresql-contrib
```

Node.js LTS is also required. If `node -v` is missing, install Node 22 from NodeSource or nvm, then confirm:

```bash
node -v
npm -v
python3 --version
psql --version
```

Start PostgreSQL:

```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## Create the local database

```bash
sudo -u postgres psql <<'SQL'
CREATE USER uniconnect WITH PASSWORD 'uniconnect';
CREATE DATABASE uniconnect OWNER uniconnect;
GRANT ALL PRIVILEGES ON DATABASE uniconnect TO uniconnect;
SQL
```

If the user or database already exists, PostgreSQL will say so. That is fine.

## Environment configuration

Secrets stay in `.env` files. Those files are gitignored.

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Then set a long random `SECRET_KEY` in `backend/.env`. The default local Docker URL is:

```text
postgresql+psycopg://uniconnect:uniconnect@127.0.0.1:5434/uniconnect
```

## Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Check:

* http://localhost:8000
* http://localhost:8000/health
* http://localhost:8000/docs

`/health` should return `"status": "ok"`. If PostgreSQL is reachable, `"database"` will be `"connected"`. If the database is not ready yet, the API still starts and reports `"disconnected"`.

## Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

The home page shows frontend, backend, and database status.

## How to verify Phase 1

1. Backend responds at `/health`.
2. Swagger UI loads at `/docs`.
3. Frontend loads at http://localhost:3000
4. The home page status card shows the backend as connected.
5. After the database is created, the same card shows PostgreSQL as connected.

## Common errors

**`connection refused` on port 8000**  
The backend is not running. Start uvicorn from the `backend/` folder with the virtualenv activated.

**`database: disconnected`**  
Run `docker compose up -d` from the repo root, then `alembic upgrade head` inside `backend/`.

**`ModuleNotFoundError: No module named 'app'`**  
Run uvicorn from `backend/`, not from the repository root.

**Frontend says backend is offline**  
Confirm `frontend/.env.local` contains `NEXT_PUBLIC_API_URL=http://localhost:8000` and that the API is running.

**Port 3000 already in use**  
Stop the other process, or run `npm run dev -- --port 3001` and update CORS later if needed.

## Tests

```bash
cd backend
source .venv/bin/activate
pytest
```
