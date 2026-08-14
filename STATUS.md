# Project Status — M.A.N.G.O

**Project:** M.A.N.G.O — Autonomous Monitoring of Oceanic Management Levels
**Version:** v2.1.0
**Last updated:** 2026-08-14
**Deployment:** https://integramosoe.com — Live

---

## Production Stack

| Service        | Status  | Notes                                              |
|----------------|---------|-----------------------------------------------------|
| nginx (host)   | Running | TLS via Let's Encrypt, routes API + SPA + Grafana  |
| mango_backend  | Healthy | Flask + Gunicorn, port 8000 (internal)             |
| mango_db       | Healthy | PostgreSQL 16, volume `mango_pg`                   |
| mango_redis    | Healthy | Redis 7, session store                             |
| mango_grafana  | Healthy | Embedded at /grafana/                              |
| Frontend (SPA) | Live    | React build at /var/www/mango-ui                   |

Stack managed from `deploy/vps/` with `make up`.

---

## Backend API

| Endpoint group                 | Status   | Notes                                            |
|-------------------------------|----------|--------------------------------------------------|
| `/api/v1/health`              | Working  | DB status + timestamp                            |
| `/api/v1/users/*`             | Working  | Login, logout, session status, user management  |
| `/api/v1/ingest/batch`        | Working  | Edge ingestion with packet_id dedup              |
| `/api/v1/readings/*`          | Working  | Sensor data queries                              |
| `/api/v1/devices`             | Working  | Device registry                                  |
| `/api/v1/missions/*`          | Working  | Mission lifecycle: create, start, cancel         |
| `/api/v1/admin/upload`        | Working  | File upload up to 2 GB (streaming)               |
| `/api/v1/uploads/*`           | Working  | File serving (proxied through nginx)             |
| `/api/v1/admin/terminal/*`    | Working  | WebSocket PTY for VPS and Jetson                 |
| `/api/v1/stream`              | Working  | SSE real-time feed                               |
| `/api/v1/admin/content`       | Working  | Editable site content                            |
| `/api/v1/admin/docs`          | Working  | Document management                              |
| `/api/v1/admin/media`         | Working  | Media gallery (images and videos)                |
| `/api/v1/public/media`        | Working  | Public listing, filterable by `kind` and `category` |
| `/api/v1/alerts/*`            | Working  | Alert rules and events                           |
| `/api/v1/subscriptions`       | Working  | User subscription management                     |
| `/api/v1/contact`             | Working  | Contact form with SMTP delivery                  |
| `/api/v1/grafana/*`           | Working  | Grafana proxy health                             |

---

## Frontend

| Page / Feature              | Status   | Notes                                            |
|-----------------------------|----------|--------------------------------------------------|
| Homepage (`/`)              | Working  | Editable content hydrated from backend           |
| Dashboard (`/dashboard`)    | Working  | Core sensor panels, SSE stream, Grafana embed    |
| Login (`/login`)            | Working  | Session-based auth, bcrypt                       |
| Archivos (`/archivos`)      | Working  | Public document library, category filter         |
| Admin (`/admin`)            | Working  | User management, subscription controls           |
| Panel Emma (`/panel-emma`)  | Working  | Full super-admin panel (see below)               |

### Panel Emma

| Feature                    | Status   | Notes                                             |
|----------------------------|----------|---------------------------------------------------|
| Live content editing       | Working  | All editable sections saved to backend            |
| Media library ("Secciones")| Working  | Browse/upload/edit/delete grouped by real site section — Galería, FLL — Temporadas, Hitos. Every public photo/video is a real DB row; edits and deletes take effect on the live site immediately, no code change needed. |
| Document library           | Working  | Upload, categorize, signed download links         |
| User management            | Working  | Inline role editing, super-admin lock             |
| Device cards               | Working  | Real Jetson probe, modem signal, LTE status       |
| VPS terminal               | Working  | WebSocket PTY in-browser                          |
| Jetson terminal            | Working  | Via reverse SSH tunnel through VPS                |
| Mission management         | Working  | Create, start, cancel field missions              |

---

## Edge (Jetson TK1)

| Component                  | Status      | Notes                                           |
|----------------------------|-------------|------------------------------------------------|
| mango-node (serial ingest) | Operational | Reads ESP32 serial, stores locally             |
| mango-sync (uplink)        | Operational | Batch POST to /api/v1/ingest/batch             |
| mango-mission              | Operational | Mission state machine                          |
| LTE modem (E3372H-153)     | Operational | HiLink API polling, dashboard integration      |
| Reverse SSH tunnel         | Operational | Jetson reachable from VPS sshd via ProxyJump   |
| Local API (:9100)          | Operational | Diagnostics and health during field sessions   |
| Python 3.4 compatibility   | Confirmed   | Full stack runs on Ubuntu 14.04 Jetson         |

---

## Hardware / Firmware

| Component                  | Status      | Notes                                           |
|----------------------------|-------------|------------------------------------------------|
| LoRa TX (ESP32 + RA-02)    | Validated   | 433 MHz packet transmission confirmed          |
| LoRa RX (ESP32 + RA-02)    | Validated   | Packet reception and serial forwarding         |
| Temperature (PT100/MAX31865)| Validated  | Stable SPI readings, repeatable               |
| pH sensor                  | In progress | Analog output, calibration pending             |
| Turbidity sensor           | In progress | Analog output, calibration pending             |
| Physical button (ESP32 RX) | Operational | button_press / button_hold events to Jetson    |

---

## Known Gaps

| Area                          | Notes                                                    |
|-------------------------------|----------------------------------------------------------|
| pH and turbidity calibration  | Sensors functional; quantitative calibration not finalized |
| Rate limiting                 | No per-IP or per-user rate limiting on API endpoints     |
| CI/CD pipeline                | No automated build or deployment pipeline                |
| End-to-end sensor tests       | Field data integration test pending full sensor calibration |
| "Representación Internacional" photos | Only 1 of 6 referenced Houston photos exists on disk (`houston_1.png`); the other 5 were dropped from the v2.1.0 migration rather than left broken — upload the real photos via Panel Emma → Secciones → Representación Internacional |
| `main` ahead of `origin/main` | Local history includes a rewrite that strips old unoptimized gallery images from every commit (v2.1.0 gallery work) — not yet pushed; requires a force-push and a resync on any other clone |

---

## Architecture Decisions

- Backend serves API only — never renders HTML.
- Frontend is a compiled static SPA deployed to `/var/www/mango-ui`.
- Docker stack always managed from `deploy/vps/` via `make up`, not from the repository root.
- File uploads use streaming (`proxy_request_buffering off`) to handle large videos without memory pressure.
- Jetson runs Python 3.4 (Ubuntu 14.04 constraint) — no f-strings, no union types, no `asyncio`.
- Packet deduplication by `packet_id` prevents duplicate readings from retry storms.
