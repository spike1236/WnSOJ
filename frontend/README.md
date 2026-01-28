# WnSOJ Next.js Frontend

## Dev

1. Start Django backend (default: `http://localhost:8000`)
2. In `frontend/`, install deps and run:

```bash
npm install
BACKEND_ORIGIN=http://localhost:8000 INTERNAL_API_KEY=dev-secret npm run dev
```

Open `http://localhost:3000`.

## Production (Nginx)

- Serve Next.js on `/` and proxy Django on `/admin/`, `/static/`, `/media/`.
- Set `BACKEND_ORIGIN` for the Next.js server process to the internal Django origin (example: `http://127.0.0.1:8000`).
- Set `INTERNAL_API_KEY` for both Next.js and Django to the same value to restrict Django `/api/*` to internal callers.

## Auth

- Browser auth uses Django sessions (`sessionid`) and CSRF (`csrftoken`).
- Client-side mutations call Next.js `/backend/*` route handlers which proxy to Django with the internal API key.
