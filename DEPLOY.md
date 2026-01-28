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

### Django env: `/etc/wnsoj/wnsoj.env`

Create one shared secret and use it in both Django and Next.js.

```bash
sudo tee /etc/wnsoj/wnsoj.env >/dev/null <<'EOF'
DEBUG=False
SECRET_KEY=replace_me_with_a_long_random_string
ALLOWED_HOSTS=wnsoj.example.com
CSRF_TRUSTED_ORIGINS=https://wnsoj.example.com
INTERNAL_API_KEY=replace_me_with_a_long_random_string

DB_NAME=wnsoj
DB_USER=wnsoj
DB_PASSWORD=replace_me
DB_HOST=127.0.0.1
DB_PORT=5432

CELERY_BROKER_URL=redis://127.0.0.1:6379/0
CELERY_RESULT_BACKEND=redis://127.0.0.1:6379/0

NO_ISOLATE=False
ISOLATE_PATH=/var/lib/isolate
EOF
sudo chmod 640 /etc/wnsoj/wnsoj.env
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

## 4) Celery workers (judge + background tasks)

In production, it's usually nicer to run worker and beat separately.

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
ExecStart=/srv/wnsoj/.venv/bin/celery -A app worker -l info
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

### `wnsoj-celery-beat.service`

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
sudo systemctl enable --now wnsoj-celery-beat
```

## 5) Next.js (systemd)

Build the frontend once (as user `wnsoj`):

```bash
sudo -u wnsoj -H bash -lc '
cd /srv/wnsoj/frontend
npm ci
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

## 6) Nginx config (single domain)

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

    client_max_body_size 50m;

    location /static/ {
        alias /srv/wnsoj/staticfiles/;
    }

    location /media/ {
        alias /srv/wnsoj/media/;
    }

    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location ^~ /api/ {
        return 404;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/wnsoj /etc/nginx/sites-enabled/wnsoj
sudo nginx -t
sudo systemctl reload nginx
```

## 7) How the "internal-only API" behaves

If someone tries to call Django `/api/*` directly without the internal key, they'll get `404`.

This is normal and expected.

If the web app suddenly looks like it "can't load data" after you deploy, the first thing to check is:

- Did you set `INTERNAL_API_KEY` on **both** services?
- Do they match exactly?
- Did you restart `wnsoj-gunicorn` and `wnsoj-next` after changing env files?

## 8) Day-2 operations (what you'll actually do in real life)

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

```bash
sudo journalctl -u wnsoj-gunicorn -f
sudo journalctl -u wnsoj-next -f
sudo journalctl -u wnsoj-celery-worker -f
sudo journalctl -u wnsoj-celery-beat -f
```

