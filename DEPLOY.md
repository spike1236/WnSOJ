# Deployment Guide (Nginx + systemd)

This project is designed to run as a "single-site" web app:

- Users hit **Nginx** on your domain.
- Nginx forwards web traffic to **Next.js** (the public web app).
- **Django** is still used, but its REST endpoints under `/api/*` are treated as **internal-only** and protected by a shared secret (`INTERNAL_API_KEY` / `X-Internal-API-Key`).
- The browser never calls Django directly for API work. Browser mutations go to **Next.js** `/backend/*` routes, and Next.js proxies to Django from the server side.

The only Django URLs you typically expose publicly are:

- `/admin/`
- `/static/`
- `/media/`

## 1) Server layout (recommended)

Pick a clean location and a dedicated user:

- App directory: `/srv/wnsoj`
- Linux user: `wnsoj`
- Env files: `/etc/wnsoj/wnsoj.env` and `/etc/wnsoj/wnsoj-frontend.env`

Example:

```bash
sudo useradd --system --create-home --home /srv/wnsoj --shell /usr/sbin/nologin wnsoj
sudo mkdir -p /srv/wnsoj /etc/wnsoj
sudo chown -R wnsoj:wnsoj /srv/wnsoj
sudo chmod 750 /etc/wnsoj
```

## 2) Environment variables (the "keys and stuff")

### Backend env: `/etc/wnsoj/wnsoj.env`

Create one shared secret and use it in both Django and Next.js. This file holds
shared backend settings; service identity is set in the small per-service env
files below.

```bash
sudo tee /etc/wnsoj/wnsoj.env >/dev/null <<'EOF'
DEBUG=False
SECRET_KEY=replace_me_with_a_long_random_string
ALLOWED_HOSTS=127.0.0.1,localhost
CSRF_TRUSTED_ORIGINS=https://wnsoj.example.com
INTERNAL_API_KEY=replace_me_with_a_long_random_string

DB_NAME=wnsoj
DB_USER=wnsoj
DB_PASSWORD=replace_me
DB_HOST=127.0.0.1
DB_PORT=5432

CELERY_BROKER_URL=redis://127.0.0.1:6379/0
CELERY_RESULT_BACKEND=redis://127.0.0.1:6379/0

LOG_ENABLED=true
LOG_LEVEL=INFO
LOG_FORMAT=plain

NO_ISOLATE=False
ISOLATE_PATH=/var/lib/isolate
EOF
sudo chmod 640 /etc/wnsoj/wnsoj.env
```

Create per-service backend logging env files:

```bash
sudo tee /etc/wnsoj/wnsoj-django.env >/dev/null <<'EOF'
LOG_SERVICE_NAME=django
EOF

sudo tee /etc/wnsoj/wnsoj-realtime.env >/dev/null <<'EOF'
LOG_SERVICE_NAME=realtime
EOF

sudo tee /etc/wnsoj/wnsoj-celery-worker.env >/dev/null <<'EOF'
LOG_SERVICE_NAME=celery
EOF

sudo tee /etc/wnsoj/wnsoj-celery-beat.env >/dev/null <<'EOF'
LOG_SERVICE_NAME=celery-beat
EOF

sudo chmod 640 /etc/wnsoj/wnsoj-*.env
```

To generate secrets locally:

```bash
python3 -c 'import secrets; print(secrets.token_urlsafe(48))'
```

### Next.js env: `/etc/wnsoj/wnsoj-frontend.env`

This is the critical part: `BACKEND_ORIGIN` should point to your *internal* Django service (not the public domain).

```bash
sudo tee /etc/wnsoj/wnsoj-frontend.env >/dev/null <<'EOF'
NODE_ENV=production
PORT=3000
HOSTNAME=127.0.0.1

BACKEND_ORIGIN=http://127.0.0.1:8000
INTERNAL_API_KEY=replace_me_with_the_same_value_as_django
REALTIME_ORIGIN=http://127.0.0.1:9000

LOG_ENABLED=true
LOG_SERVICE_NAME=next
LOG_LEVEL=INFO
LOG_FORMAT=plain
EOF
sudo chmod 640 /etc/wnsoj/wnsoj-frontend.env
```

## 3) Django (Gunicorn)

### Install + migrate + collectstatic

From `/srv/wnsoj` (as user `wnsoj`), set up the venv and install dependencies:

```bash
sudo -u wnsoj -H bash -lc '
cd /srv/wnsoj
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
'
```

Then:

```bash
sudo -u wnsoj -H bash -lc '
cd /srv/wnsoj
source .venv/bin/activate
export $(cat /etc/wnsoj/wnsoj.env | xargs)
export $(cat /etc/wnsoj/wnsoj-django.env | xargs)
python3 manage.py migrate
python3 manage.py collectstatic --noinput
'
```

### systemd unit: `wnsoj-gunicorn.service`

```ini
[Unit]
Description=WnSOJ Django (gunicorn)
After=network.target

[Service]
Type=simple
User=wnsoj
Group=wnsoj
WorkingDirectory=/srv/wnsoj
EnvironmentFile=/etc/wnsoj/wnsoj.env
EnvironmentFile=/etc/wnsoj/wnsoj-django.env
ExecStart=/srv/wnsoj/.venv/bin/gunicorn app.wsgi:application --bind 127.0.0.1:8000 --workers 3 --timeout 60
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

Enable it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now wnsoj-gunicorn
sudo systemctl status wnsoj-gunicorn
```

## 4) Realtime (FastAPI SSE)

This service streams submission verdict/progress updates over SSE and subscribes to Redis pub/sub.

### systemd unit: `wnsoj-realtime.service`

```ini
[Unit]
Description=WnSOJ Realtime (FastAPI SSE)
After=network.target

[Service]
Type=simple
User=wnsoj
Group=wnsoj
WorkingDirectory=/srv/wnsoj
EnvironmentFile=/etc/wnsoj/wnsoj.env
EnvironmentFile=/etc/wnsoj/wnsoj-realtime.env
ExecStart=/srv/wnsoj/.venv/bin/uvicorn realtime_service.main:app --host 127.0.0.1 --port 9000
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

Enable it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now wnsoj-realtime
sudo systemctl status wnsoj-realtime
```

## 5) Celery workers (judge + background tasks)

Submissions enqueue judge jobs directly on creation, so Celery beat is not required by default. If you add your own periodic tasks later, it's usually nicer to run worker and beat separately.

### `wnsoj-celery-worker.service`

```ini
[Unit]
Description=WnSOJ Celery worker
After=network.target

[Service]
Type=simple
User=wnsoj
Group=wnsoj
WorkingDirectory=/srv/wnsoj
EnvironmentFile=/etc/wnsoj/wnsoj.env
EnvironmentFile=/etc/wnsoj/wnsoj-celery-worker.env
ExecStart=/srv/wnsoj/.venv/bin/celery -A app worker -l info
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

### `wnsoj-celery-beat.service`

Optional (only needed if you add periodic tasks).

```ini
[Unit]
Description=WnSOJ Celery beat
After=network.target

[Service]
Type=simple
User=wnsoj
Group=wnsoj
WorkingDirectory=/srv/wnsoj
EnvironmentFile=/etc/wnsoj/wnsoj.env
EnvironmentFile=/etc/wnsoj/wnsoj-celery-beat.env
ExecStart=/srv/wnsoj/.venv/bin/celery -A app beat -l info
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

Enable:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now wnsoj-celery-worker
sudo systemctl enable --now wnsoj-celery-beat  # optional
```

## 6) Next.js (systemd)

Build the frontend once (as user `wnsoj`):

```bash
sudo -u wnsoj -H bash -lc '
cd /srv/wnsoj/frontend
npm ci
export $(cat /etc/wnsoj/wnsoj-frontend.env | xargs)
npm run build
'
```

### systemd unit: `wnsoj-next.service`

This runs the Next server on localhost only.

```ini
[Unit]
Description=WnSOJ Next.js
After=network.target

[Service]
Type=simple
User=wnsoj
Group=wnsoj
WorkingDirectory=/srv/wnsoj/frontend
EnvironmentFile=/etc/wnsoj/wnsoj-frontend.env
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

Enable:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now wnsoj-next
sudo systemctl status wnsoj-next
```

## 7) Nginx config (single domain)

The idea is straightforward:

- `/` goes to Next.js (`127.0.0.1:3000`)
- `/admin/` goes to Django (`127.0.0.1:8000`)
- `/static/` and `/media/` are served directly from disk
- `/api/` is explicitly blocked at the edge (even though Django also protects it)
- Ensure nginx can read `/srv/wnsoj/staticfiles` and `/srv/wnsoj/media` (dirs 755, files 644).

Create: `/etc/nginx/sites-available/wnsoj`

```nginx
server {
    listen 80;
    server_name wnsoj.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name wnsoj.example.com;

    ssl_certificate /etc/letsencrypt/live/wnsoj.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/wnsoj.example.com/privkey.pem;

    client_max_body_size 250m;

    location /static/ {
        alias /srv/wnsoj/staticfiles/;
    }

    location /media/ {
        alias /srv/wnsoj/media/;
    }

    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Request-ID $request_id;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_hide_header X-Request-ID;
        add_header X-Request-ID $request_id always;
    }

    location ^~ /api/ {
        return 404;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Request-ID $request_id;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_hide_header X-Request-ID;
        add_header X-Request-ID $request_id always;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/wnsoj /etc/nginx/sites-enabled/wnsoj
sudo nginx -t
sudo systemctl reload nginx
```

## 8) How the "internal-only API" behaves

If someone tries to call Django `/api/*` directly without the internal key, they'll get `404`.

This is normal and expected.

If the web app suddenly looks like it "can't load data" after you deploy, the first thing to check is:

- Did you set `INTERNAL_API_KEY` on **both** services?
- Do they match exactly?
- Did you restart `wnsoj-gunicorn` and `wnsoj-next` after changing env files?

## 9) Day-2 operations (what you'll actually do in real life)

### Deploy a new version

```bash
sudo systemctl stop wnsoj-next
sudo systemctl stop wnsoj-gunicorn

sudo -u wnsoj -H bash -lc '
cd /srv/wnsoj
git pull
source .venv/bin/activate
pip install -r requirements.txt
set -a
source /etc/wnsoj/wnsoj.env
set +a
python3 manage.py migrate
python3 manage.py collectstatic --noinput
'

sudo -u wnsoj -H bash -lc '
cd /srv/wnsoj/frontend
npm ci
npm run build
'

sudo systemctl start wnsoj-gunicorn
sudo systemctl start wnsoj-next
sudo systemctl restart wnsoj-celery-worker
sudo systemctl restart wnsoj-celery-beat
```

### Check logs

WnSOJ does not need a separate logging process by default. Gunicorn, realtime,
Celery, and Next.js write logs to stdout/stderr, and systemd captures those logs
in journald. Use `LOG_FORMAT=json` if you plan to ship journald entries into a
central log search system.

Nginx creates the public `X-Request-ID`, forwards it to the app services, and
returns one copy of that ID to the browser. Next.js forwards that same ID to
Django and realtime calls so related logs can be searched together.

```bash
sudo journalctl -u wnsoj-gunicorn -f
sudo journalctl -u wnsoj-realtime -f
sudo journalctl -u wnsoj-next -f
sudo journalctl -u wnsoj-celery-worker -f
sudo journalctl -u wnsoj-celery-beat -f
```
