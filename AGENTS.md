# Agent Guide

Guidance for automated coding agents working in this repository.

Hard rule: do not guess. Agents must handle uncertainty explicitly.

- Low uncertainty: verify with the most relevant source, such as code, tests,
  docs, config, or command output, then proceed.
- High uncertainty: ask the user before changing behavior.
- High-impact areas are always high uncertainty unless the user has given clear
  instructions and the repo/config confirms them. This includes architecture,
  deployment, security, auth, permissions, data loss, migrations, dependency
  upgrades, and production behavior.

## Project Shape

WnSOJ is a monorepo deployed behind nginx, with three runtime services:

- Django backend at repo root: `app/`, `accounts/`, `problemset/`, `jobboard/`.
- Next.js frontend in `frontend/`.
- FastAPI realtime service in `realtime_service/`.

Nginx is the production edge: it terminates public traffic, serves static/media
files, performs public HTTP-to-HTTPS redirects, blocks direct public `/api/`
access, and proxies normal page traffic to Next.js. Django is an internal
backend/API/admin service. Next.js is the public web app. FastAPI handles
realtime/SSE behavior. Redis supports realtime pub/sub, and Postgres is the
Django database and durable judge-job queue.

## Runtime And Env

Each service has its own environment. Do not make one service import another
service's settings.

- Django env: `SECRET_KEY`, `INTERNAL_API_KEY`, `DB_*`, judge settings.
- Next.js env: `BACKEND_ORIGIN`, `REALTIME_ORIGIN`, `INTERNAL_API_KEY`.
- Realtime env: `INTERNAL_API_KEY`, Redis URL.

`INTERNAL_API_KEY` is service-to-service protection. Django `/api/*` and
FastAPI realtime endpoints should require it. Browser/user authentication is
still handled separately through Django sessions and CSRF.

Do not expose internal service keys through `NEXT_PUBLIC_*` variables or
client-side code. Next.js should attach internal headers only from server-side
route handlers, server actions, or server components.

Public HTTPS and edge routing are handled by nginx in production. Django also
receives private HTTP calls from Next.js. Before adding proxy, cookie, HTTPS,
HSTS, or deployment security settings, verify the actual nginx -> Next.js ->
Django/FastAPI request path and explain the runtime effect. Do not apply generic
framework deployment warnings without checking this topology.

## Development Workflow

Keep changes focused and commit-sized. Prefer one coherent purpose per commit:
tests, security hardening, frontend UI, deployment docs, dependency updates, or
repo restructuring should usually be separate changes.

Preserve existing architecture and local patterns unless the user asks for a
larger design change. Do not mix unrelated cleanup into functional work.

When editing backend behavior, update or add tests in the relevant app. When
editing frontend behavior, preserve the Next.js app conventions already in
`frontend/`.

## Testing

Default backend verification:

```bash
python manage.py test
python -m ruff check accounts app jobboard problemset realtime_service
```

Run narrower tests while iterating, then the full suite before reporting done.

API tests should exercise the same internal-key path used in production rather
than disabling middleware. Realtime unit tests may patch environment variables
because the FastAPI service reads config directly from env.

Do not add slow external-service integration tests to unrelated commits. If a
test needs Redis, a live server, Docker, or network access, make that explicit.

## Data, Uploads, And Judge

Use settings-based paths such as `settings.PROBLEMS_DATA_ROOT` and
`settings.MEDIA_ROOT`; do not hardcode project-local data paths in app logic.

Problem test-data ZIP handling must remain defensive: validate paths, size, and
input/output pairing before extraction.

Profile image handling should remain centralized so validation, resizing, and
storage behavior do not diverge across views/serializers.

Judge/isolate changes need concurrency awareness. Multiple workers may run at
the same time, so sandbox resources must not be selected with uncoordinated
random IDs.

## Reporting

Be direct and concrete. When reporting changes, list touched areas, tests run,
and any remaining risk or intentionally deferred work. If a command cannot be
run, say so.
