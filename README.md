# M.A.N.G.O — Autonomous Monitoring of Oceanic Management Levels

<p align="center">
  <img src=".assets/logo.png" width="340" alt="M.A.N.G.O Logo" style="max-width: 100%;">
</p>

<h3 align="center">
  Real-time environmental data collection to support the protection and management of mangrove ecosystems in Colombia.
</h3>

<div align="center">

[![Release](https://img.shields.io/github/v/release/T4t4n32/M.A.N.G.O?include_prereleases=true&style=for-the-badge&label=Release)](https://github.com/T4t4n32/M.A.N.G.O/releases/latest)
[![Version](https://img.shields.io/github/v/tag/T4t4n32/M.A.N.G.O?sort=semver&style=for-the-badge&label=Version)](https://github.com/T4t4n32/M.A.N.G.O/tags)
[![License](https://img.shields.io/github/license/T4t4n32/M.A.N.G.O?style=for-the-badge&label=License)](LICENSE.md)
[![Issues](https://img.shields.io/github/issues/T4t4n32/M.A.N.G.O?style=for-the-badge&label=Issues)](https://github.com/T4t4n32/M.A.N.G.O/issues)
[![Stars](https://img.shields.io/github/stars/T4t4n32/M.A.N.G.O?style=for-the-badge&label=Stars)](https://github.com/T4t4n32/M.A.N.G.O/stargazers)

</div>

---

## Table of Contents

- [What is M.A.N.G.O?](#what-is-mango)
- [Live Deployment](#live-deployment)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Key Features](#key-features)
- [Repository Structure](#repository-structure)
- [Deployment Guide](#deployment-guide)
- [Hardware Overview](#hardware-overview)
- [Changelog and Releases](#changelog-and-releases)
- [Contributing](#contributing)
- [License](#license)
- [Author](#author)

---

## What is M.A.N.G.O?

**M.A.N.G.O** is a low-cost, field-deployable water monitoring system built for mangrove ecosystems in Colombia. It collects real sensor measurements (pH, turbidity, temperature), transmits them over LoRa, ingests them into a cloud backend, and exposes them through a web platform.

The project originated as a high-school degree research initiative and has evolved into a fully operational system with a live production deployment, an admin panel, a mission management layer, and hardware-in-the-loop integration with a Jetson TK1 edge computer.

Mangroves are critical ecosystems: they filter water, protect coasts from storm surge, sequester carbon, and support biodiversity. Reliable environmental monitoring in these areas is rare — M.A.N.G.O addresses that gap with affordable, portable hardware and a robust software stack.

---

## Live Deployment

The platform is publicly accessible at **https://integramosoe.com**.

| Component       | Status       | Notes                                          |
|-----------------|--------------|------------------------------------------------|
| Website         | Live         | React SPA served via nginx                     |
| REST API        | Live         | Flask + Gunicorn, proxied at `/api/`           |
| Database        | Live         | PostgreSQL 16, persistent Docker volume        |
| Grafana         | Live         | Embedded dashboards at `/grafana/`             |
| Admin panel     | Live         | Panel Emma at `/panel-emma`                    |
| Jetson edge     | Field device | NVIDIA Jetson TK1 with LTE modem uplink        |

The backend health endpoint is publicly reachable: `GET https://integramosoe.com/api/v1/health`

---

## System Architecture

The system is composed of three layers: field hardware, edge compute, and cloud infrastructure.

```
Field Layer (TX node)
  ESP32
    ├── Reads pH, turbidity, temperature sensors
    ├── Sends LoRa packet (433 MHz) to gateway
    └── Mirrors serial frame to Jetson TK1 (USB)

  Jetson TK1 (edge compute, inside enclosure)
    ├── mango-node: serial ingest → local SQLite + REST API on :9100
    ├── mango-sync: batch uplink to VPS /api/v1/ingest/batch
    ├── mango-mission: mission state machine (run_mission.py)
    └── Huawei E3372H-153 LTE modem (HiLink mode, 192.168.8.1)

  ESP32 (RX / Gateway)
    └── Receives LoRa packet → forwards to VPS via bridge service

Cloud Layer (VPS — integramosoe.com)
  nginx (host)
    ├── /               → /var/www/mango-ui (React SPA)
    ├── /api/           → 127.0.0.1:8000 (Docker backend)
    ├── /grafana/       → 127.0.0.1:3000 (Grafana)
    └── /api/v1/uploads/ → backend (proxied, no static 404)

  Docker stack (deploy/vps/ — managed with make up)
    ├── mango_backend  Flask + Gunicorn — API server
    ├── mango_db       PostgreSQL 16    — persistent storage
    ├── mango_redis    Redis 7          — session cache
    └── mango_grafana  Grafana OSS      — data visualization
```

### Data Flow

1. ESP32 samples sensors and transmits a LoRa packet + serial frame.
2. Jetson receives the serial frame, validates, and stores locally.
3. Sync worker batches readings and POSTs to `/api/v1/ingest/batch` with an API key.
4. Flask deduplicates by `packet_id` and stores in PostgreSQL.
5. Dashboard and Grafana panels query the API for visualization.

---

## Technology Stack

| Layer           | Technology                                  | Notes                                      |
|-----------------|---------------------------------------------|--------------------------------------------|
| Firmware        | ESP32 (Arduino/C++)                         | Sensor reading + LoRa TX/RX                |
| Edge compute    | NVIDIA Jetson TK1, Python 3.4               | Serial ingest, sync, mission logic         |
| Edge transport  | LoRa RA-02, 433 MHz                         | Long-range, low-power field comms          |
| Edge uplink     | Huawei E3372H-153 LTE modem (HiLink)        | Internet via mobile network                |
| Backend         | Flask, Gunicorn, SQLAlchemy                 | REST API, session auth, file handling      |
| Database        | PostgreSQL 16                               | Primary data store                         |
| Cache / session | Redis 7                                     | Server-side session store                  |
| Containerization| Docker, Docker Compose                      | Backend stack managed via `make up`        |
| Reverse proxy   | nginx (host)                                | TLS termination, routing, upload limits    |
| Frontend        | React 18, Vite, TypeScript, Tailwind        | SPA compiled to `/var/www/mango-ui`        |
| Visualization   | Grafana OSS                                 | Embedded sensor dashboards                 |
| TLS             | Let's Encrypt (Certbot)                     | Auto-renewed certificates                  |

---

## Key Features

### Web Platform
- Secure login with session-based auth (HttpOnly + SameSite cookies, bcrypt hashing)
- Role-based access: viewer, researcher, admin, super-admin
- Real-time sensor stream via SSE (`/api/v1/stream`)
- Grafana dashboards embedded at `/grafana/`
- Subscription and access-request management
- Contact form with SMTP email delivery

### Panel Emma (Admin)
- Live content editing for all editable site sections
- Media library: image and video upload, preview, and delete (up to 200 MB images, 2 GB videos)
- Document library: categorized PDFs with signed temporary download links
- User management: inline role editing, super-admin lock
- Device monitoring: real-time Jetson status probe
- WebSocket PTY terminals for VPS and Jetson (browser-based SSH)
- Mission management: create, start, cancel field missions from the panel

### Edge / Jetson
- Serial ingest from ESP32 with Sensors_V2.0.0 protocol (seq + device_id fields)
- Local REST API on port 9100 for field diagnostics
- Sync worker: batch uplink with `packet_id` deduplication
- Mission state machine: coordinate measurement sessions from the cloud
- LTE modem monitoring via Huawei HiLink API
- Reverse SSH tunnel to VPS for remote terminal access
- Fully compatible with Ubuntu 14.04 and Python 3.4

### Backend API
- `/api/v1/ingest/batch` — batch sensor ingestion with deduplication
- `/api/v1/readings/*` — sensor data query endpoints
- `/api/v1/devices` — device registry
- `/api/v1/missions/*` — mission lifecycle management
- `/api/v1/admin/upload` — file upload (2 GB max, streaming, no buffering)
- `/api/v1/uploads/*` — file serving (proxied through nginx)
- `/api/v1/admin/terminal/*` — WebSocket PTY sessions
- `/api/v1/stream` — SSE real-time feed
- `/api/v1/health` — health check with DB status

---

## Repository Structure

```
M_A_N_G_O/
├── backend/                  Flask API — routes, models, config, Dockerfile
│   ├── app/
│   │   ├── models/           SQLAlchemy models
│   │   ├── routes/           API route blueprints
│   │   └── config.py         Environment-driven configuration
│   ├── db_init.py            Idempotent table creation (run once on deploy)
│   ├── entrypoint.sh         Container startup (Gunicorn)
│   └── requirements.txt
│
├── frontend/                 React + Vite + TypeScript SPA
│   └── src/
│       ├── pages/            Index, Dashboard, Login, Admin, PanelEmma, Archivos
│       └── components/       Shared UI components
│
├── edge/                     NVIDIA Jetson TK1 edge application
│   └── app/
│       ├── serial_acquire.py Serial reader from ESP32
│       ├── modem_monitor.py  Huawei E3372H-153 status via HiLink API
│       ├── local_api.py      REST API on :9100
│       └── sync/             Batch uplink to VPS
│
├── firmware/                 ESP32 Arduino sketches
│   ├── LoRa/                 LoRa TX / RX sketches
│   └── sensors/              pH, turbidity, temperature sensor code
│
├── opt/mango_node/           mango-node: edge ingest service (Upstart)
│
├── gateway/                  LoRa RX gateway bridge (serial → HTTP)
│
├── deploy/
│   └── vps/                  Production deployment
│       ├── compose.vps.yml   Docker Compose — production stack
│       ├── .env.vps          Environment variables (not committed)
│       ├── Makefile          Stack management (make up / down / logs)
│       └── nginx/            nginx host configuration
│           ├── integramosoe.conf   Production site config
│           └── default.conf
│
├── grafana/                  Grafana provisioning (datasources + dashboards)
├── nginx/                    Local development nginx config
├── hardware/                 Component references and wiring notes
├── scripts/                  Setup and maintenance scripts
├── tests/                    Backend test suite
│
├── compose.yaml              Development Docker Compose (local)
├── ARCHITECTURE.md           System architecture detail
├── CHANGELOG.md              Version history
├── STATUS.md                 Current project status
└── ROADMAP.md                Planned work
```

---

## Deployment Guide

### Prerequisites

- VPS with Docker, Docker Compose v2, nginx, Certbot
- Domain pointing to the VPS
- SSH access

### 1. Clone and configure

```bash
git clone https://github.com/T4t4n32/M_A_N_G_O.git
cd M_A_N_G_O/deploy/vps
cp .env.vps.example .env.vps
# Edit .env.vps: set DB_PASSWORD, SECRET_KEY, INGEST_API_KEY, SMTP_*, GRAFANA_*
```

### 2. Create the Docker network

```bash
docker network create mango_net
```

### 3. Start the stack

```bash
make up
```

This runs `docker compose -f compose.vps.yml --env-file .env.vps down --remove-orphans` followed by `up -d --build`. The `db_init` service creates all tables idempotently before the backend starts.

### 4. Configure nginx and TLS

```bash
sudo cp deploy/vps/nginx/integramosoe.conf /etc/nginx/sites-available/integramosoe
sudo ln -sf /etc/nginx/sites-available/integramosoe /etc/nginx/sites-enabled/integramosoe
sudo nginx -t && sudo systemctl reload nginx
# Issue certificate:
sudo certbot --nginx -d integramosoe.com -d www.integramosoe.com
```

### 5. Deploy frontend

```bash
cd frontend && npm install && npm run build
sudo rsync -a --delete dist/ /var/www/mango-ui/
```

Or from `deploy/vps/`:

```bash
make deploy-ui
```

### Stack management

```bash
make up           # Build and start all services
make down         # Stop and remove containers (volumes preserved)
make restart      # down + up
make logs         # Follow all service logs
make logs-backend # Follow backend logs
make status       # Container health summary
make health       # Hit /api/v1/health
make backup       # Dump Postgres to backups/
make shell-db     # Open psql inside mango_db
```

### Environment variables reference

| Variable              | Description                                    |
|-----------------------|------------------------------------------------|
| `DB_USER`             | Postgres username                              |
| `DB_PASSWORD`         | Postgres password                              |
| `DB_NAME`             | Postgres database name                         |
| `SECRET_KEY`          | Flask session signing key                      |
| `INGEST_API_KEY`      | Bearer token for edge ingest endpoints         |
| `API_HOST_PORT`       | Host port for backend (default: 8000)          |
| `MAX_UPLOAD_VIDEO_MB` | Max video upload size in MB (default: 2000)    |
| `MAX_UPLOAD_IMAGE_MB` | Max image upload size in MB (default: 200)     |
| `MAX_UPLOAD_DOC_MB`   | Max document upload size in MB (default: 500)  |
| `SMTP_HOST`           | SMTP server for contact form emails            |
| `SMTP_USER`           | SMTP username                                  |
| `SMTP_PASSWORD`       | SMTP password                                  |
| `GRAFANA_ADMIN_PASSWORD` | Grafana admin password                      |

---

## Hardware Overview

### Field node (TX)

| Component             | Role                                          |
|-----------------------|-----------------------------------------------|
| NVIDIA Jetson TK1     | Edge compute, serial ingest, sync, missions   |
| ESP32 + RA-02         | Sensor reading, LoRa TX, serial to Jetson     |
| PT100 + MAX31865      | Temperature (SPI)                             |
| pH sensor module      | pH (analog output)                            |
| Turbidity sensor      | Turbidity / NTU (analog output)               |
| Huawei E3372H-153     | LTE uplink via USB HiLink mode                |
| Water-resistant enclosure | Field deployment protection              |

### Gateway (RX)

| Component             | Role                                          |
|-----------------------|-----------------------------------------------|
| ESP32 + RA-02         | LoRa RX at 433 MHz                            |
| Python bridge service | Serial → HTTP POST to VPS ingest endpoint     |

### Protocol

- LoRa: 433 MHz, RA-02 modules
- Payload: compact text frame — `TEMP=24.36;PH=7.12;TURB=183.4;SEQ=001;DEV=node01`
- Edge API key required on all ingest requests

---

## Changelog and Releases

- [CHANGELOG.md](CHANGELOG.md) — curated version history
- [GitHub Releases](https://github.com/T4t4n32/M.A.N.G.O/releases/latest)

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

MIT — see [LICENSE.md](LICENSE.md).

---

## Author

Sebastián Sánchez — [github.com/T4t4n32](https://github.com/T4t4n32)

This project began as a high-school degree research initiative in Colombia and is developed independently. The goal is to provide a replicable, low-cost monitoring model for mangrove conservation efforts.
