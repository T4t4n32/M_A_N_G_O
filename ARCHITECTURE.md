# Architecture — M.A.N.G.O

**Version:** v2.0.0
**Last updated:** 2026-06-03

---

## 1. Purpose

M.A.N.G.O is a full-stack environmental monitoring system for mangrove ecosystems. It collects water quality measurements (pH, turbidity, temperature) in the field, transports them to a cloud backend, and exposes them through a web platform with real-time visualization, mission management, and an admin panel.

This document describes the production architecture as of v2.0.0.

---

## 2. High-Level Diagram

```
 FIELD                              CLOUD (integramosoe.com)
 ─────────────────────────────────  ────────────────────────────────────────
                                   
  ESP32 (TX)                        nginx (host, port 443)
    │ Sensors: pH, temp, turbidity   ├── /              → /var/www/mango-ui
    │ LoRa TX: 433 MHz               ├── /api/          → 127.0.0.1:8000
    └── Serial (USB) → Jetson TK1    ├── /grafana/      → 127.0.0.1:3000
                                     └── /api/v1/uploads/→ 127.0.0.1:8000
  Jetson TK1
    ├── mango-node                   Docker stack (mango_net)
    │   └── serial_acquire.py         ├── mango_backend  :5000
    ├── mango-sync                    ├── mango_db       :5432
    │   └── batch POST → /ingest      ├── mango_redis    :6379
    ├── mango-mission                 └── mango_grafana  :3000
    │   └── mission state machine    
    ├── local_api.py (:9100)         /var/www/mango-ui
    └── modem_monitor.py              └── React SPA (compiled)
         └── Huawei E3372H-153
              └── LTE uplink ──────► internet

  ESP32 (RX / Gateway)
    └── LoRa RX → bridge.py
         └── HTTP POST → /api/v1/ingest/batch

  Reverse SSH tunnel
    Jetson ──► VPS sshd :9200 ──► Panel Emma terminal
```

---

## 3. Component Responsibilities

### 3.1 ESP32 TX (field node)

- Reads pH (analog), turbidity (analog), temperature (PT100 via MAX31865 SPI).
- Constructs a compact payload with sequence number and device ID.
- Transmits LoRa packet at 433 MHz (RA-02 module).
- Mirrors the same payload to the Jetson over USB serial.

Payload format (Sensors_V2.0.0 protocol):
```
TEMP=24.36;PH=7.12;TURB=183.4;SEQ=001;DEV=node01
```

### 3.2 Jetson TK1 (edge compute)

Runs three persistent Upstart services:

| Service           | Entrypoint          | Role                                               |
|-------------------|---------------------|----------------------------------------------------|
| `mango-node`      | `run_serial.py`     | Serial reader, validates frames, stores in SQLite  |
| `mango-sync`      | `run_sync.py`       | Polls local DB, batches, POSTs to VPS ingest API   |
| `mango-mission`   | `run_mission.py`    | Mission state machine, responds to backend commands|

Additional modules:
- `local_api.py`: REST API on port 9100 for field diagnostics.
- `modem_monitor.py`: polls Huawei E3372H-153 via HiLink API (192.168.8.1) for signal, connection type, and uplink state.
- Reverse SSH tunnel: dials out to VPS sshd on port 9200, exposing local port 22 for remote access.

Constraints: Python 3.4, Ubuntu 14.04 (NVIDIA Jetson TK1 official OS).

### 3.3 ESP32 RX / Gateway

Receives LoRa packets and forwards them via the `gateway/bridge.py` service to the VPS ingest endpoint. Provides an alternative path to edge serial ingestion.

### 3.4 nginx (VPS host)

Handles TLS termination (Let's Encrypt), serves the static SPA from disk, and proxies API traffic to the Docker backend. Key routing rules:

| Location                      | Type    | Destination           | Notes                               |
|-------------------------------|---------|-----------------------|-------------------------------------|
| `= /api/v1/stream`            | exact   | Docker :8000          | SSE — no buffering, 3600s timeout   |
| `~ ^/api/v1/admin/terminal/`  | regex   | Docker :8000          | WebSocket Upgrade headers           |
| `^~ /api/v1/uploads/`         | prefix  | Docker :8000          | Proxied to avoid static 404         |
| `= /api/v1/admin/upload`      | exact   | Docker :8000          | 2 GB body, no buffering, 3600s      |
| `~ ^/api/v1/ingest`           | regex   | Docker :8000          | 4 MB limit, 30s timeout             |
| `/api/`                       | prefix  | Docker :8000          | All other API routes                |
| `^~ /grafana/`                | prefix  | Docker :3000          | Grafana embedded viewer             |
| `/`                           | fallback| /var/www/mango-ui     | SPA, index.html fallback            |

### 3.5 Flask Backend

API-only server. Never serves HTML. Modules:

- `routes/health.py` — liveness + DB check
- `routes/users.py` — login, logout, session, user CRUD
- `routes/ingest.py` / `compat_ingest.py` — sensor data ingestion, deduplication by `packet_id`
- `routes/readings.py` — sensor data queries
- `routes/devices.py` — device registry
- `routes/missions.py` — mission lifecycle
- `routes/uploads.py` — file upload + serving (`POST /admin/upload`, `GET /uploads/*`)
- `routes/admin_terminal.py` / `admin_terminal_ws.py` — WebSocket PTY sessions
- `routes/stream.py` — SSE real-time feed
- `routes/admin_cms.py` / `admin_content.py` — editable site content
- `routes/admin_docs.py` — document management
- `routes/admin_media.py` — image/video gallery

Auth: session-based (Flask-Session backed by Redis). Role check via `admin_required` middleware. Passwords hashed with bcrypt.

### 3.6 PostgreSQL

Primary data store. Tables created idempotently by `db_init.py` using a PostgreSQL advisory lock. Persistent across container restarts via Docker volume `mango_pg`.

Key tables: `mango_users`, `mango_devices`, `mango_ingest_packets`, `sensor_data`, `sensor_stations`, `mango_missions`, `mango_alert_rules`, `mango_alert_events`, `mango_user_subscriptions`, `uploaded_file`, `download_logs`.

### 3.7 Grafana

Reads directly from PostgreSQL via a provisioned datasource. Dashboards provisioned from `grafana/provisioning/` and `grafana/dashboards/`. Anonymous viewer access enabled for embedding in the SPA.

### 3.8 React Frontend

Vite + TypeScript SPA. Compiled with `npm run build`, deployed to `/var/www/mango-ui`. Communicates with the backend exclusively via `/api/v1/*` endpoints. Never talks to Postgres directly.

Pages: Index, Dashboard, Login, Archivos, Admin, PanelEmma, PanelEmmaLogin.

---

## 4. Data Flow

### 4.1 Field ingestion

```
ESP32 (field)
  └── serial frame ──► Jetson mango-node
                           └── validate + store (SQLite local)
                                    └── mango-sync
                                          └── POST /api/v1/ingest/batch
                                                    (INGEST_API_KEY header)
                                                        └── Flask dedup by packet_id
                                                                └── INSERT sensor_data
```

### 4.2 Dashboard read

```
Browser
  └── GET /api/v1/readings/*  ──► Flask ──► PostgreSQL ──► JSON response
  └── GET /grafana/           ──► nginx ──► Grafana (reads PG directly)
  └── GET /api/v1/stream      ──► Flask SSE (Server-Sent Events, keep-alive)
```

### 4.3 File upload

```
Panel Emma (browser)
  └── POST /api/v1/admin/upload (multipart, up to 2 GB)
        └── nginx (no buffering, 2 GB limit, 3600s timeout)
              └── Flask: MIME check + size check per kind
                    └── save to /app/uploads/{kind}/
                          └── INSERT uploaded_file (DB record)
                                └── return { url: /api/v1/uploads/{kind}/{file} }
```

### 4.4 Admin terminal (WebSocket PTY)

```
Panel Emma (browser)
  └── WebSocket /api/v1/admin/terminal/{target}
        └── nginx (Upgrade headers, 3600s)
              └── Flask: spawn PTY subprocess (VPS shell or SSH to Jetson)
                    └── bidirectional IO over WebSocket
```

---

## 5. Security Model

- All traffic over HTTPS (TLS 1.2+, Let's Encrypt).
- Session cookies: HttpOnly, SameSite=Lax, Secure.
- Backend port (8000) bound to 127.0.0.1 only — not reachable from internet directly.
- Ingest endpoints require `INGEST_API_KEY` bearer token.
- Admin endpoints require active session with `admin` or `super_admin` role.
- Terminal endpoints limited to authenticated admin sessions.
- File uploads: MIME type validated server-side; per-kind size limits enforced before save.
- Reverse SSH tunnel: Jetson uses a dedicated key; tunnel port not exposed publicly.

---

## 6. Deployment Model

The production stack is managed exclusively from `deploy/vps/` using the Makefile:

```bash
cd deploy/vps
make up      # down --remove-orphans + up -d --build
make down    # stop containers, preserve volumes
make logs    # follow all service logs
make backup  # pg_dump to backups/mango_YYYYMMDD_HHMMSS.sql
```

The root `compose.yaml` is for local development only. Never use it on the VPS.

---

## 7. Maintainer

Sebastián Sánchez — [github.com/T4t4n32](https://github.com/T4t4n32)
