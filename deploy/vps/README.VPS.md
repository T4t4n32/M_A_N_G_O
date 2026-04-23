# M.A.N.G.O — VPS Deployment Guide (Debian 12)

**Stack**: Docker Compose (Postgres + Redis + Backend) + Host Nginx + Certbot HTTPS

```
Internet
   │
   ▼ :443 (HTTPS)
 Nginx (host)
   ├── /          → /var/www/mango-ui/  (Lovable static build)
   └── /api/      → proxy http://127.0.0.1:8000  (backend Docker)
                            │
                     ┌──────┴──────────────────────┐
                     │  mango_backend (Gunicorn)    │
                     │  Flask + SQLAlchemy          │
                     │  port 5000 (internal)        │
                     └──────┬──────────────┬────────┘
                            │              │
                     mango_db         mango_redis
                  (Postgres 16)     (Redis 7)
```

---

## 1. First-time prerequisites

```bash
# VPS packages
sudo apt-get update && sudo apt-get install -y docker.io docker-compose-plugin nginx certbot python3-certbot-nginx

# Add your user to docker group (log out and back in after)
sudo usermod -aG docker $USER
```

---

## 2. Configure environment

```bash
cd deploy/vps
cp .env.vps.example .env.vps
nano .env.vps   # fill in all CHANGE_ME values
```

Generate required secrets:
```bash
# SECRET_KEY
python3 -c "import secrets; print(secrets.token_hex(32))"

# INGEST_API_KEY
python3 -c "import secrets; print(secrets.token_hex(16))"

# ADMIN_PASSWORD_HASH
python3 -c "from werkzeug.security import generate_password_hash; print(generate_password_hash('YOUR_PASSWORD'))"
```

---

## 3. Deploy with Makefile

All commands run from `deploy/vps/`:

| Command              | Description |
|----------------------|-------------|
| `make up`            | Build and start the full stack (safe re-deploy) |
| `make down`          | Stop containers, preserve volumes |
| `make restart`       | down + up |
| `make status`        | Show container status and health |
| `make health`        | Hit `/api/v1/health` and print result |
| `make logs`          | Follow all service logs |
| `make logs-backend`  | Backend logs only |
| `make logs-db`       | Database logs only |
| `make routes`        | List all registered Flask API routes |
| `make db-tables`     | List all tables in Postgres |
| `make users-list`    | List all users with their active tier |
| `make subs-list`     | List all subscriptions |
| `make admin-cli`     | Open the admin CLI |
| `make backup`        | Dump Postgres to `backups/mango_YYYYMMDD.sql` |
| `make shell-backend` | Shell inside the backend container |
| `make shell-db`      | psql inside the database container |
| `make nuke`          | **DESTRUCTIVE** — wipe all data and images |

`make up` always runs `down --remove-orphans` first to prevent container name conflicts.

---

## 4. Nginx (host, not Docker)

```bash
sudo cp nginx/default.conf /etc/nginx/sites-available/integramosoe
sudo ln -sf /etc/nginx/sites-available/integramosoe /etc/nginx/sites-enabled/integramosoe
sudo nginx -t && sudo systemctl reload nginx
```

---

## 5. HTTPS with Certbot

```bash
sudo certbot --nginx -d integramosoe.com -d www.integramosoe.com
```

---

## 6. Deploy Lovable UI

Build on your PC then copy to VPS:
```bash
# Local
cd lovable_ui/MANGO_PAGE_LOVABLE_V2.0
npm install && npm run build

# Copy dist/ to VPS
rsync -avz dist/ user@integramosoe.com:/var/www/mango-ui/
```

---

## 7. Create first admin user

After `make up`, register the first admin user via the admin CLI:

```bash
make admin-cli ARGS="users create --email admin@integramosoe.com --password YOUR_SECURE_PASSWORD --name Admin --role admin"
```

Or via the API (first registered user is automatically promoted to admin):
```bash
curl -X POST https://integramosoe.com/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@integramosoe.com","password":"YOUR_SECURE_PASSWORD","name":"Admin"}'
```

---

## 8. Subscription / Tier Management

### Tiers (rangos de acceso)

| Tier | Level | Duration | Description |
|------|-------|----------|-------------|
| `none` | 0 | — | No active subscription |
| `dataline_low` | 1 | 90 days | Basic reports, sensor summaries |
| `dataline_high` | 2 | 90 days | Extended reports, datasets, AI assistant |
| `institutional` | 3 | Indefinite | Full institutional access |
| `admin` | 4 | — | System admin (derived from role, not subscription) |

### Grant a subscription via admin CLI

```bash
# Grant DataLine High (90 days)
make admin-cli ARGS="subs grant --user-id 5 --tier dataline_high"

# Grant Institutional (no expiry)
make admin-cli ARGS="subs grant --user-id 5 --tier institutional"

# Grant with custom expiry date
make admin-cli ARGS="subs grant --user-id 5 --tier dataline_low --expires 2026-09-30 --notes 'Q3 2026'"

# List user's subscription history
make admin-cli ARGS="subs show --user-id 5"

# Revoke a subscription
make admin-cli ARGS="subs revoke --id 12"

# List all active subscriptions
make subs-list ARGS="--active"
```

### Grant a subscription via API (requires admin session)

```bash
# Login first
curl -c cookies.txt -X POST https://integramosoe.com/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@integramosoe.com","password":"YOUR_PASSWORD"}'

# Grant subscription
curl -b cookies.txt -X POST https://integramosoe.com/api/v1/subscriptions \
  -H "Content-Type: application/json" \
  -d '{"user_id":5,"tier":"institutional","notes":"Research team access"}'

# List subscriptions
curl -b cookies.txt https://integramosoe.com/api/v1/subscriptions

# Revoke
curl -b cookies.txt -X DELETE https://integramosoe.com/api/v1/subscriptions/12
```

---

## 9. Full API Reference

### Health
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/health` | — | DB health check |

### Auth / Session
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/auth/status` | — | Session status |
| POST | `/api/v1/auth/login` | — | Login (env-based admin) |
| POST | `/api/v1/auth/logout` | — | Logout |

### Users
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/users/status` | — | Session + tier info |
| POST | `/api/v1/users/register` | open/admin | Register user |
| POST | `/api/v1/users/login` | — | Login (DB users) |
| POST | `/api/v1/users/logout` | — | Logout |
| GET | `/api/v1/users/me` | session | Own profile + tier |
| GET | `/api/v1/users/me/subscription` | session | Own active subscription |
| GET | `/api/v1/users/me/history` | session | Own login history |
| GET | `/api/v1/users/` | admin | List all users |
| GET | `/api/v1/users/<id>/subscription` | admin | User's active subscription |
| GET | `/api/v1/users/<id>/subscriptions/history` | admin | User's full subscription history |
| GET | `/api/v1/users/<id>/history` | admin | User's login history |
| PATCH | `/api/v1/users/<id>/role` | admin | Change role |
| PATCH | `/api/v1/users/<id>/active` | admin | Activate/deactivate |
| DELETE | `/api/v1/users/<id>` | admin | Delete user |

### Subscriptions
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/subscriptions` | admin | List all subscriptions |
| POST | `/api/v1/subscriptions` | admin | Grant subscription |
| GET | `/api/v1/subscriptions/<id>` | admin | Subscription detail |
| DELETE | `/api/v1/subscriptions/<id>` | admin | Revoke subscription |

### Dashboard Data
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/metrics` | — | Available sensor types |
| GET | `/api/v1/stations` | — | List stations (compat layer) |
| GET | `/api/v1/latest/by_type` | — | Latest reading per sensor type |
| GET | `/api/v1/range?type=&minutes=` | — | Time series data |

### Station / Sensor Mapping (Admin)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/stations` | admin | Register station with lat/lon |
| GET | `/api/v1/stations/<id>` | — | Station detail + sensors |
| PATCH | `/api/v1/stations/<id>` | admin | Update station metadata |
| POST | `/api/v1/stations/<id>/sensors` | admin | Register sensor at station |
| DELETE | `/api/v1/stations/<id>/sensors/<sid>` | admin | Remove sensor |

### Sensor Data Ingest
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/ingest` | `X-Api-Key` | Receive gateway readings |
| GET | `/api/v1/latest` | — | Latest N raw readings |

### Contact
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/contact` | — | Send contact form email |

---

## 10. Database tables

Tables created automatically by `db_init` on `make up`:

| Table | Purpose |
|-------|---------|
| `mango_users` | User accounts and credentials |
| `mango_login_events` | Full login history with IP and user-agent |
| `mango_user_subscriptions` | Tier/subscription assignments with expiry |
| `mango_compat_stations` | Stations auto-created by gateway ingest |
| `mango_compat_readings` | Sensor readings from gateway (dashboard source) |
| `sensor_stations` | Station registry with lat/lon (admin-managed) |
| `sensors` | Sensor definitions per station |
| `sensor_data` | Readings from the rich sensor model |
| `access_requests` | Institutional access request queue |
| `api_keys` | API key management |
| `audit_logs` | Admin action audit trail |

---

## 11. Gateway setup (laptop)

The gateway reads LoRa packets from the ESP32 and POSTs to the VPS backend.

```bash
# Install service
sudo cp ../../deploy/gateway-laptop/systemd/mango-rx-gateway.service \
       /etc/systemd/system/

# Create config directory
sudo mkdir -p /opt/mango_gateway
sudo cp ../../gateway/rx_gateway.py /opt/mango_gateway/

# Copy env template and fill in values
sudo cp ../../deploy/gateway-laptop/.env.gateway.example /opt/mango_gateway/.env
sudo nano /opt/mango_gateway/.env
# Set: API_URL=https://integramosoe.com/api/v1/ingest
# Set: INGEST_API_KEY=<same as VPS .env.vps INGEST_API_KEY>

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable mango-rx-gateway
sudo systemctl start mango-rx-gateway
sudo systemctl status mango-rx-gateway
```

---

## 12. Troubleshooting

**Container name already in use:**
```bash
make up   # handles it automatically with --remove-orphans
```

**Backend not reachable:**
```bash
make health
make logs-backend
```

**DB tables missing:**
```bash
make db-tables   # check which tables exist
make logs        # look for db_init errors
```

**Check active subscriptions:**
```bash
make subs-list ARGS="--active"
```
