# M.A.N.G.O — Deployment Notes: Security & Performance Hardening (2026-06-16)

This document captures what was diagnosed, what was changed, why each change was
made, and the exact steps needed on the VPS to bring the stack up to date.

---

## 1. What was wrong (symptoms)

| Symptom | Reported by |
|---------|------------|
| Browsers showed "insecure" / connection blocked on first visit | External users |
| Login silently failed on certain networks or browsers | External users |
| Pages and API responses felt slow on non-local connections | All users |
| HTTP→HTTPS redirect added latency on every first visit | Observed |
| No SSL certificate auto-renewal — cert could expire silently | Audit |

---

## 2. Root causes found

### 2.1 ProxyFix missing (`backend/wsgi.py`)

Flask was running behind nginx but had no knowledge of it.  
`request.is_secure` was **always `False`** because Flask read the raw TCP
connection (HTTP to gunicorn), not the `X-Forwarded-Proto: https` header.  
This caused `SESSION_SECURE` cookies to be set with the `Secure` flag, but
since Flask thought the connection was HTTP, browsers silently rejected them
on login.

**Fix:** Added `ProxyFix(x_for=1, x_proto=1, x_host=1, x_prefix=1)` in
`backend/wsgi.py`. This tells Flask to trust exactly one upstream proxy (nginx).

---

### 2.2 `SESSION_SECURE` default was `1` in `compose.yaml`

The Docker Compose default was `SESSION_SECURE=1`, which is correct for the
VPS (HTTPS) but wrong for local development (HTTP).  
In local dev, session cookies were flagged `Secure` over an HTTP connection,
causing browsers to drop them — login appeared to work but the session was
never stored.

**Fix:** Changed the default to `SESSION_SECURE=0` in `compose.yaml`.  
The VPS `.env.vps` file explicitly sets `SESSION_SECURE=1`, so VPS behavior
is unchanged.

---

### 2.3 No gzip compression in nginx

Every JSON response, JS bundle, and CSS file was sent uncompressed.  
On a slow connection a typical API response (2–5 KB JSON) could be 3–6x
larger than necessary.

**Fix:** Added `gzip on` with `gzip_types` covering JSON, JS, CSS, XML,
SVG, and font formats. Compression level 6 (good ratio, low CPU cost).

---

### 2.4 No upstream keepalive — new TCP connection per request

Every proxied request to gunicorn created and destroyed a TCP connection.  
On a VPS with 4 workers under moderate load this added 1–3 ms of overhead
per request from TCP handshake alone, and exhausted ephemeral ports under
bursts.

**Fix:** Added `upstream mango_backend { server 127.0.0.1:8000; keepalive 32; }`  
All `proxy_pass` directives now target `http://mango_backend` and include
`proxy_http_version 1.1` + `proxy_set_header Connection ""` to enable
connection reuse.

---

### 2.5 No HSTS header

Every user's very first visit (or any visit after cache expiry) hit port 80,
was redirected to 443, and paid the cost of the HTTP→HTTPS round trip.  
More seriously, this left a window open for SSL-stripping attacks.

**Fix:** Added `Strict-Transport-Security: max-age=63072000; includeSubDomains`  
After the first HTTPS visit, browsers enforce HTTPS exclusively for 2 years
without even making the initial HTTP request.

---

### 2.6 Only 2 Gunicorn workers

The default in `.env.vps.example` was `GUNICORN_WORKERS=2`.  
For a 2-core VPS the recommended formula is `(2 × cores) + 1 = 5`.  
With 2 workers, two simultaneous slow requests (e.g. DB queries > 100 ms)
blocked all other traffic.

**Fix:** Raised `GUNICORN_WORKERS` from `2` to `4` in `.env.vps.example`.  
Update your actual `.env.vps` file on the VPS to match (see step 4.2 below).

---

### 2.7 No SQLAlchemy connection pool tuning

Flask-SQLAlchemy defaulted to a pool size of 5 with no overflow, recycle, or
pre-ping. Under load this caused "connection already closed" errors from
stale pool connections and connection timeouts when all 5 were busy.

**Fix:** Added pool settings in `backend/app/config.py`, configurable via env:

| Variable | Default | Purpose |
|----------|---------|---------|
| `DB_POOL_SIZE` | 10 | Connections kept open per worker |
| `DB_MAX_OVERFLOW` | 20 | Extra connections allowed in bursts |
| `DB_POOL_TIMEOUT` | 30 s | Max wait for a connection before error |
| `DB_POOL_RECYCLE` | 1800 s | Force-close connections older than 30 min |
| `SQLALCHEMY_POOL_PRE_PING` | True | Test connection before each use |

---

### 2.8 No SSL session cache / OCSP stapling

Every TLS handshake was full (no session resumption).  
OCSP checks happened client-side on every new connection, adding 50–200 ms.

**Fix:** Added to nginx:
- `ssl_session_cache shared:SSL:10m` — share TLS sessions across workers
- `ssl_session_timeout 10m` — reuse sessions for 10 minutes
- `ssl_stapling on` — server pre-fetches OCSP validity so clients don't have to

---

### 2.9 No certbot auto-renewal check

The SSL certificate could expire silently. No Makefile target, no monitoring.

**Fix:**
- Added `ssl-renew` and `ssl-status` targets to `deploy/vps/Makefile`
- Added section 9 to `deploy/vps/diag.sh` that checks certbot timer status

---

## 3. Files changed (this commit)

| File | What changed |
|------|-------------|
| `backend/wsgi.py` | Added `ProxyFix` middleware |
| `compose.yaml` | `SESSION_SECURE` default `1` → `0` |
| `backend/app/config.py` | SQLAlchemy pool settings via env vars |
| `deploy/vps/nginx/integramosoe.conf` | upstream keepalive, gzip, HSTS, SSL session cache, OCSP stapling, ACME passthrough, deduplicated proxy headers |
| `deploy/vps/.env.vps.example` | `GUNICORN_WORKERS` 2 → 4, pool env vars documented |
| `deploy/vps/Makefile` | `ssl-renew` and `ssl-status` targets |
| `deploy/vps/diag.sh` | Section 9 — certbot auto-renewal status |

---

## 4. Steps to apply on the VPS

SSH into the VPS and run these commands from the repo root.

### 4.1 Pull the latest code

```bash
cd /path/to/M_A_N_G_O
git pull origin main
```

### 4.2 Update your `.env.vps` file

Open `deploy/vps/.env.vps` and set or verify:

```bash
# Session security — must be 1 on the VPS (HTTPS)
SESSION_SECURE=1

# Gunicorn workers — raise from 2 to 4 if not already done
GUNICORN_WORKERS=4

# SQLAlchemy pool (add these if missing)
DB_POOL_SIZE=10
DB_MAX_OVERFLOW=20
DB_POOL_RECYCLE=1800
```

### 4.3 Rebuild and restart the backend

```bash
cd deploy/vps
make restart
```

This rebuilds the Docker image (picks up `wsgi.py` + `config.py` changes) and
restarts gunicorn with the new pool settings and ProxyFix.

### 4.4 Apply the nginx configuration

```bash
sudo cp nginx/integramosoe.conf /etc/nginx/sites-available/integramosoe.com
sudo nginx -t
sudo systemctl reload nginx
```

### 4.5 Enable SSL auto-renewal (if not already done)

```bash
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Verify
make ssl-status
```

### 4.6 Run diagnostics

```bash
bash diag.sh
```

Expect all sections to pass, including section 9 (certbot timer active).

### 4.7 Smoke test

```bash
make health
# Should return: {"status":"ok",...}

curl -I https://integramosoe.com/api/v1/health
# Look for: Strict-Transport-Security header present
#           Content-Encoding: gzip (if curl supports it: curl --compressed)
```

---

## 5. What to verify after applying

| Check | Command / Method |
|-------|-----------------|
| Backend healthy | `make health` |
| Login works from external network | Open browser, log in |
| HSTS header present | `curl -I https://integramosoe.com` |
| Gzip active | `curl --compressed -sI https://integramosoe.com/api/v1/metrics` — look for `Content-Encoding: gzip` |
| SSL session reuse | `openssl s_client -reconnect -connect integramosoe.com:443` — look for `Reused` |
| Certbot timer | `systemctl status certbot.timer` |
| No nginx errors | `sudo nginx -t` |
| Cert expiry | `make ssl-status` |
| Full diag | `bash diag.sh` — all sections green |

---

## 6. Rollback

If anything breaks, the previous nginx config is in git history:

```bash
git show HEAD~1:deploy/vps/nginx/integramosoe.conf | sudo tee /etc/nginx/sites-available/integramosoe.com
sudo nginx -t && sudo systemctl reload nginx
```

For the backend, a `git revert` + `make restart` is sufficient.

---

## 7. Known limitations / not addressed in this patch

- **Rate limiting**: nginx-level rate limiting (`limit_req_zone`) is not yet
  configured. Currently handled at the Flask layer only.
- **Grafana auth**: Grafana is still accessible without a password behind the
  `/grafana/` prefix. Protect it with `auth_basic` or Grafana's own auth.
- **Log rotation**: nginx and gunicorn logs are not rotated. Add logrotate
  config if the VPS has limited disk.
- **Postgres tuning**: `postgresql.conf` uses Postgres defaults. For a VPS with
  2–4 GB RAM, tuning `shared_buffers`, `work_mem`, and `effective_cache_size`
  would improve query performance.
