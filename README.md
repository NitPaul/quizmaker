<div align="center">

# QuizMaker

### Turn study material into quizzes in seconds — CSV upload, AI generation from text, and RAG over your PDFs.

[![CI](https://github.com/NitPaul/quizmaker/actions/workflows/ci.yml/badge.svg)](https://github.com/NitPaul/quizmaker/actions/workflows/ci.yml)
![Python](https://img.shields.io/badge/Python-3.13-3776AB?logo=python&logoColor=white)
![Django](https://img.shields.io/badge/Django-5.1-092E20?logo=django&logoColor=white)
![DRF](https://img.shields.io/badge/DRF-3.15-A30000?logo=django)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss&logoColor=white)
![Postgres](https://img.shields.io/badge/Postgres-pgvector-336791?logo=postgresql&logoColor=white)
![Celery](https://img.shields.io/badge/Celery-5.6-37814A?logo=celery&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue)

</div>

QuizMaker is a full-stack web app that turns notes, pasted text, or PDFs into auto-generated multiple-choice quizzes. It started as a single-file HTML prototype and was rebuilt as a **decoupled SPA + REST API** with JWT auth, async LLM jobs via Celery, and a real **retrieval-augmented-generation pipeline** over `pgvector`.

> Built end-to-end as a portfolio project to demonstrate Python, Django, REST API design, AI integration, and modern frontend skills.

**🌐 Live demo:** _frontend_ → `https://quizmaker.vercel.app` · _API docs_ → `https://quizmaker-api.onrender.com/api/docs/`
*(URLs update after deployment.)*

---

## 📸 Screenshots

> Captured screenshots live in [`docs/screenshots/`](docs/screenshots/). Drop PNGs in that folder to populate the previews below.

| Login + marketing | Home (logged in) |
|---|---|
| ![Login](docs/screenshots/01-login.png) | ![Home](docs/screenshots/02-home.png) |

| Flashcard mode | Exam mode |
|---|---|
| ![Flashcards](docs/screenshots/03-flashcard.png) | ![Exam](docs/screenshots/04-exam.png) |

| Results + PDF export | RAG (PDF → quiz) |
|---|---|
| ![Results](docs/screenshots/05-results.png) | ![RAG](docs/screenshots/06-rag.png) |

| Leaderboard | Dark mode | Swagger UI |
|---|---|---|
| ![Leaderboard](docs/screenshots/07-leaderboard.png) | ![Dark mode](docs/screenshots/08-dark.png) | ![Swagger](docs/screenshots/09-swagger.png) |

---

## ✨ Features

- **CSV / XLSX upload** — drag in a spreadsheet and start a quiz instantly (client-side parsing, no round-trip to the server).
- **AI generation from text** — paste any content; Groq or Gemini writes MCQs for you. Bring your own API key or use the built-in one.
- **RAG over PDFs** — upload a PDF once; questions are grounded in your actual study material via cosine similarity search over 768-dim embeddings.
- **Two quiz modes**
  - **Flashcards** — one card at a time with a 3D flip animation revealing the answer
  - **Exam** — sticky timer, submit-all flow, results page with per-question review
- **History + leaderboard** — every attempt is saved; the best score per quiz feeds a per-quiz leaderboard with your rank highlighted.
- **PDF export** — download your results sheet (questions + correct answers) as a PDF via jsPDF.
- **JWT auth with single-flight refresh** — Axios interceptor refreshes tokens once even when several requests fail with 401 at the same time.
- **Dark mode** — class-strategy Tailwind with system-preference detection and `localStorage` persistence.
- **OpenAPI 3** — Swagger UI at `/api/docs/`, ReDoc at `/api/redoc/`.
- **Async job pipeline** — long-running LLM or RAG jobs return `202 Accepted` + task id; frontend polls until done.

---

## 🏗️ Architecture

```mermaid
flowchart LR
    U[User Browser] -- HTTPS/JSON --> FE[React + Vite SPA<br/>Vercel]
    FE -- Bearer JWT --> API[Django + DRF API<br/>Render web service]
    API -- async jobs --> Q[(Upstash Redis<br/>Celery broker)]
    W[Celery Worker<br/>Render worker service] -- consumes --> Q
    W -- embed + generate --> LLM{LLM Providers}
    LLM --> Groq[Groq llama-3.3-70b]
    LLM --> Gemini[Gemini 2.0-flash<br/>+ embedding-001]
    API -- SQL + vector --> DB[(Supabase Postgres<br/>+ pgvector)]
    W -- SQL + vector --> DB
```

**Why this shape?** The web service stays responsive because anything slow (PDF parsing, embedding, LLM calls) is dispatched to Celery. The frontend polls `/api/v1/tasks/<id>/` until the job finishes. One Postgres instance handles both relational data and 768-dim vector search via `pgvector` + HNSW index — no separate vector DB needed.

### RAG pipeline (per document)

```
PDF upload
   │
   ▼
pdfplumber  →  text by page
   │
   ▼
LangChain RecursiveCharacterTextSplitter
   chunk_size=800, overlap=120
   │
   ▼
Google gemini-embedding-001
   (output_dimensionality=768)
   │
   ▼
DocumentChunk(text, embedding VECTOR(768))
   indexed with HNSW for cosine distance
```

At query time the user's prompt is embedded, the top-`k` chunks are retrieved via cosine similarity, stuffed into a grounded prompt, and an LLM generates strictly-from-context MCQs. Every generated question stores its `source_chunk_ids` so the Review page can show "Why this answer?" with the source text.

---

## 🛠️ Tech stack

| Layer | Tech |
|---|---|
| **Frontend** | React 19 · Vite 8 · TypeScript · Tailwind v4 · Zustand · React Query · Axios · jsPDF + jspdf-autotable · SheetJS (xlsx) |
| **Backend** | Django 5 · Django REST Framework · djangorestframework-simplejwt · drf-spectacular · django-cors-headers · whitenoise |
| **Database** | Supabase Postgres + `pgvector` (768-dim `VectorField`, HNSW index) · `dj-database-url` |
| **Async** | Celery 5.6 + Upstash Redis (TLS broker) |
| **LLM** | Groq (`llama-3.3-70b-versatile`) and Gemini (`gemini-2.0-flash`) via a `Protocol`-based provider abstraction with automatic retry on malformed JSON |
| **Embeddings** | Google `gemini-embedding-001` (768-dim) |
| **PDF parsing** | pdfplumber + LangChain `RecursiveCharacterTextSplitter` |
| **Auth** | JWT access + refresh, rotation with blacklist on use |
| **Hosting** | Vercel (frontend) · Render web + worker (backend) · Supabase (DB) · Upstash (Redis) |
| **Testing** | pytest + pytest-django (37 backend tests) · Vitest (18 frontend tests) |
| **CI** | GitHub Actions — ruff · pytest · Vitest · production build, on every push & PR to `main` |
| **Tooling** | ruff · TypeScript · ESLint · Docker |

---

## 🔌 REST API surface

All endpoints live under `/api/v1/` and are fully documented at `/api/docs/`.

| Method | Path | Purpose |
|---|---|---|
| `GET`  | `/health/` | Liveness probe |
| `POST` | `/auth/register/` | Create user |
| `POST` | `/auth/login/` | Returns JWT access + refresh pair |
| `POST` | `/auth/refresh/` | Refresh access token |
| `GET`  | `/me/` | Profile + aggregate stats |
| `POST` | `/quizzes/from-csv/` | Create quiz from parsed CSV/XLSX rows |
| `POST` | `/ai/generate-from-text/` | **Async** — Groq/Gemini quiz from pasted text |
| `POST` | `/documents/` | Upload PDF → kicks off ingest task |
| `GET`  | `/documents/` | List your documents |
| `POST` | `/rag/generate/` | **Async** — RAG-grounded quiz from a document |
| `GET`  | `/tasks/<id>/` | Poll Celery task status |
| `GET`  | `/quizzes/<id>/` | Fetch quiz with questions |
| `POST` | `/quizzes/<id>/attempts/` | Submit attempt; server-side scoring |
| `GET`  | `/attempts/?quiz=<id>` | Attempt history |
| `GET`  | `/leaderboard/?quiz=<id>` | Top scores; your rank highlighted |

---

## 🚀 Local development

You'll need **Python 3.13**, **Node 20+**, and either a local Postgres (with `pgvector` extension installed) or a free Supabase project.

### 1. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1          # Windows PowerShell
# source .venv/bin/activate          # macOS / Linux
pip install -r requirements-dev.txt
copy .env.example .env               # then fill in keys
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Required `.env` keys:

```
DJANGO_SECRET_KEY=replace-me
DATABASE_URL=postgresql://...?sslmode=require
CELERY_BROKER_URL=rediss://default:PASSWORD@HOST.upstash.io:6379
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AIza...
```

### 2. Celery worker *(separate terminal)*

```bash
cd backend
.venv\Scripts\Activate.ps1
celery -A quizmaker worker -l info --pool=solo   # Windows needs --pool=solo
```

### 3. Frontend *(separate terminal)*

```bash
cd frontend
npm install
copy .env.example .env               # set VITE_API_BASE_URL=http://localhost:8000
npm run dev
```

Open <http://localhost:5173>.

### Tests

```bash
cd backend  && pytest      # 37 backend tests, ~3s
cd frontend && npm test    # 18 frontend tests, ~2s
```

---

## ☁️ Deployment

### Backend → Render
The repo ships with `render.yaml` defining a `web` + `worker` service that both build from `backend/Dockerfile`.

On Render: **New → Blueprint → connect this repo**, then fill in:

- `DATABASE_URL` — Supabase **Session Pooler** URL (Direct connection is IPv6-only) with `?sslmode=require`.
- `CELERY_BROKER_URL` and `CELERY_RESULT_BACKEND` — Upstash Redis TLS URL (`rediss://...`).
- `ALLOWED_HOSTS` — `your-app.onrender.com`.
- `CSRF_TRUSTED_ORIGINS` — `https://your-app.onrender.com`.
- `CORS_ALLOWED_ORIGINS` — your Vercel URL.
- `GROQ_API_KEY`, `GEMINI_API_KEY`.

The Docker `CMD` runs `migrate` then `gunicorn` automatically on each deploy.

### Frontend → Vercel
Point Vercel at the `frontend/` directory. Set `VITE_API_BASE_URL=https://your-app.onrender.com` and deploy. SPA fallback is already wired in `vercel.json`.

### CI
`.github/workflows/ci.yml` runs on every push and PR to `main`:
- **Backend** — ruff lint + pytest
- **Frontend** — Vitest + production build

---

## ⚠️ Gotchas worth knowing

- **Supabase "Direct connection" is IPv6-only.** Use the **Session Pooler** URL for any IPv4-only host (including Render's free tier).
- **Windows + Celery** needs `--pool=solo`; the default `prefork` pool requires `fork()`.
- **Upstash TLS** is enabled via `CELERY_BROKER_USE_SSL = {"ssl_cert_reqs": ssl.CERT_REQUIRED}` in `settings/base.py` (driven off the `rediss://` URL scheme), not via URL params.
- **Embeddings** use `gemini-embedding-001` with `output_dimensionality=768`. The older `text-embedding-004` is no longer on the v1beta endpoint.
- **drf-spectacular Swagger** auto-prepends `Bearer ` to the token — paste just the raw access token in the Authorize dialog.

---

## 🧠 What I learned building this

- **Provider-agnostic LLM layer.** A `Protocol`-based `LLMProvider` lets Groq, Gemini, and BYO-key flow through the same call site with one factory. Malformed JSON triggers a corrective retry — the abstraction stays clean and the failure mode is explicit.
- **Cross-vendor DB queries.** The leaderboard uses Postgres `DISTINCT ON` in prod but falls back to a Python dedup pass in SQLite for the test suite — same view, two paths, branched on `connection.vendor`.
- **Async-first request boundary.** Anything that touches an LLM or PDF returns `202 Accepted` + a task id; the frontend polls. The web service stays under 100 ms even when generation takes 30+ seconds.
- **JWT done right.** A single-flight refresh interceptor prevents the thundering-herd refresh bug when several concurrent requests all see a 401 — only one network request goes out, the rest queue on the same promise.
- **RAG with citations.** Each generated question records the source chunk ids, so the Review page can show "Why this answer?" with the actual source text — turning the AI from black box into something a student can audit.
- **Production hygiene.** Dockerfile + render.yaml + GitHub Actions + structured logging — the boring infrastructure that hiring managers actually check for.

---

## 🗺️ Roadmap

- [ ] Spaced-repetition scheduling for missed questions
- [ ] Multi-user document sharing with permissions
- [ ] Voice-input quiz mode (Web Speech API)
- [ ] Sentry error tracking
- [ ] 90-second Loom demo embedded above

---

## 📄 License

[MIT](LICENSE) — use it, fork it, learn from it.

---

<div align="center">

**Built by [Nit Paul](https://github.com/NitPaul)** — feedback and stars welcome ⭐

</div>
