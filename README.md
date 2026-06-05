# M.A.N.G.O — Autonomous Monitoring of Oceanic Management Levels

<p align="center">
  <img src=".assets/logo.png" width="320" alt="M.A.N.G.O Logo">
</p>

<p align="center">
  Real-time environmental data collection to support the protection and management<br>
  of mangrove ecosystems in Colombia.
</p>

<p align="center">
  <a href="https://github.com/T4t4n32/M_A_N_G_O/actions/workflows/ci.yml">
    <img src="https://img.shields.io/github/actions/workflow/status/T4t4n32/M_A_N_G_O/ci.yml?branch=main&style=for-the-badge&label=CI&logo=github-actions&logoColor=white" alt="CI">
  </a>
  <a href="https://integramosoe.com">
    <img src="https://img.shields.io/website?url=https%3A%2F%2Fintegramosoe.com&style=for-the-badge&label=Website&logo=googlechrome&logoColor=white" alt="Website">
  </a>
  <a href="https://github.com/T4t4n32/M_A_N_G_O/commits/main">
    <img src="https://img.shields.io/github/last-commit/T4t4n32/M_A_N_G_O?style=for-the-badge&label=Last+Commit&logo=git&logoColor=white" alt="Last Commit">
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python 3.12">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 18">
  <img src="https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL 16">
  <a href="LICENSE.md">
    <img src="https://img.shields.io/github/license/T4t4n32/M_A_N_G_O?style=for-the-badge&label=License" alt="License">
  </a>
</p>

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
- [Contributing](#contributing)
- [License](#license)
- [Author](#author)

---

## What is M.A.N.G.O?

**M.A.N.G.O** is a low-cost, field-deployable water monitoring system built for mangrove ecosystems in Colombia. It collects real sensor measurements — pH, turbidity, and temperature — transmits them over LoRa, ingests them into a cloud backend, and exposes them through a web platform.

The project originated as a high-school degree research initiative and has evolved into a fully operational system with a live production deployment, a mission management layer, and hardware-in-the-loop integration with a Jetson TK1 edge computer.

Mangroves are critical ecosystems: they filter water, protect coasts from storm surge, sequester carbon, and support biodiversity. Reliable environmental monitoring in these areas is rare — M.A.N.G.O addresses that gap with affordable, portable hardware and a robust software stack.

---

## Live Deployment

The platform is publicly accessible at **[https://integramosoe.com](https://integramosoe.com)**.

| Component        | Status       | URL / Notes                                          |
|------------------|--------------|------------------------------------------------------|
| Website          | Live         | `https://integramosoe.com`                           |
| REST API         | Live         | `https://integramosoe.com/api/v1/health`             |
| Grafana          | Live         | `https://integramosoe.com/grafana/`                  |
| Admin panel      | Live         | `/panel-emma` (restricted)                           |
| Jetson edge node | Field device | NVIDIA Jetson TK1 with LTE modem uplink              |

---

## System Architecture

The system is composed of three layers: field hardware, edge compute, and cloud infrastructure.

```
Field Layer (TX node)
  ESP32
    ├── Reads pH, turbidity, temperature sensors
    ├── Sends LoRa packet (433 MHz) to RX gateway
    └── Mirrors serial frame to Jetson TK1 over USB

  Jetson TK1  (edge compute, inside waterproof enclosure)
    ├── mango-node:   serial ingest → local SQLite + REST API on :9100
    ├── mango-sync:   batch uplink to VPS /api/v1/ingest/batch
    ├── mango-mission: mission state machine
    └── Huawei E3372H-153 LTE modem (HiLink, 192.168.8.1)

  ESP32 RX (Gateway node)
    └── Receives LoRa packet → HTTP POST to VPS ingest endpoint

Cloud Layer  (VPS — integramosoe.com)
  nginx (host process)
    ├── /           → /var/www/mango-ui   (React SPA)
    ├── /api/       → 127.0.0.1:8000      (Docker backend)
    └── /grafana/   → 127.0.0.1:3000      (Grafana)

  Docker stack  (deploy/vps — managed with make up)
    ├── mango_backend   Flask + Gunicorn  — REST API
    ├── mango_db        PostgreSQL 16     — persistent storage
    ├── mango_redis     Redis 7           — session cache
    └── mango_grafana   Grafana OSS       — sensor dashboards
```

### Data Flow

1. ESP32 samples sensors and transmits a LoRa packet + serial frame.
2. Jetson TK1 receives the serial frame, validates it, and stores it locally.
3. Sync worker batches readings and POSTs to `/api/v1/ingest/batch` with an API key.
4. Flask deduplicates by `packet_id` and persists readings to PostgreSQL.
5. The web dashboard and Grafana panels query the API for visualization.

---

## Technology Stack

| Layer            | Technology                            | Notes                                    |
|------------------|---------------------------------------|------------------------------------------|
| Firmware         | ESP32 (Arduino / C++)                 | Sensor reading + LoRa TX/RX              |
| Edge compute     | NVIDIA Jetson TK1, Python 3.4         | Serial ingest, sync, mission logic       |
| Edge transport   | LoRa RA-02, 433 MHz                   | Long-range, low-power field comms        |
| Edge uplink      | Huawei E3372H-153 LTE (HiLink)        | Internet via mobile network              |
| Backend          | Flask 3, Gunicorn, SQLAlchemy 2       | REST API, session auth, file handling    |
| Database         | PostgreSQL 16                         | Primary data store                       |
| Cache / sessions | Redis 7                               | Server-side session store                |
| Containers       | Docker, Docker Compose v2             | Stack managed via `make up`              |
| Reverse proxy    | nginx (host process)                  | TLS termination, routing, upload limits  |
| Frontend         | React 18, Vite, TypeScript, Tailwind  | SPA compiled to `/var/www/mango-ui`      |
| Visualization    | Grafana OSS                           | Embedded sensor dashboards               |
| TLS              | Let's Encrypt (Certbot)               | Auto-renewed certificates                |

---

## Key Features

### Web Platform

- Secure session-based authentication (HttpOnly + SameSite cookies, PBKDF2 hashing)
- Role-based access: viewer, researcher, admin, super-admin
- Real-time sensor feed via Server-Sent Events (`/api/v1/stream`)
- Grafana dashboards embedded at `/grafana/`
- Subscription tier system and access-request management
- Contact form with SMTP email delivery

### Panel Emma (Admin Console)

- Live content editing for all editable site sections
- Unified media library: image, video, and document upload with preview (up to 2 GB video)
- Document library with categorized PDFs and signed temporary download links
- User management: role assignment, activation, super-admin lock
- Device monitoring: live Jetson status and modem telemetry
- Browser-based SSH terminals for VPS and Jetson (WebSocket PTY)
- Mission management: create, start, and cancel field missions from the browser

### Edge / Jetson

- Serial ingest from ESP32 (Sensors\_V2.0.0 protocol: `seq` + `device_id` fields)
- Local REST API on port 9100 for field diagnostics
- Batch uplink with `packet_id` deduplication — survives connectivity gaps
- Mission state machine: coordinate measurement sessions from the cloud
- LTE modem monitoring via Huawei HiLink API
- Reverse SSH tunnel to VPS for remote terminal access
- Compatible with Ubuntu 14.04 and Python 3.4

### Backend API Highlights

| Endpoint                       | Method      | Description                               |
|--------------------------------|-------------|-------------------------------------------|
| `/api/v1/ingest`               | POST        | Single packet ingestion                   |
| `/api/v1/ingest/batch`         | POST        | Batch ingestion with deduplication        |
| `/api/v1/readings/*`           | GET         | Sensor data query and statistics          |
| `/api/v1/latest/by_type`       | GET         | Latest reading per sensor type            |
| `/api/v1/range`                | GET         | Time-series data for a metric             |
| `/api/v1/devices`              | GET         | Registered edge device list               |
| `/api/v1/missions/*`           | GET / POST  | Field mission lifecycle                   |
| `/api/v1/admin/upload`         | POST        | File upload (streaming, up to 2 GB)       |
| `/api/v1/admin/terminal/*`     | WebSocket   | Browser PTY sessions                      |
| `/api/v1/stream`               | GET (SSE)   | Real-time sensor event stream             |
| `/api/v1/health`               | GET         | Health check with DB and uptime status    |

---

## Repository Structure

```
M_A_N_G_O/
├── backend/                  Flask API — routes, models, config, Dockerfile
│   ├── app/
│   │   ├── models/           SQLAlchemy models (user, sensor, upload, alert…)
│   │   ├── routes/           API blueprints (users, ingest, dashboard, uploads…)
│   │   ├── config.py         Environment-driven configuration
│   │   └── extensions.py     SQLAlchemy + Redis initialization
│   ├── db_init.py            Idempotent table creation (runs once on deploy)
│   ├── entrypoint.sh         Gunicorn startup script
│   └── requirements.txt
│
├── frontend/                 React + Vite + TypeScript SPA
│   └── src/
│       ├── pages/            Index, Dashboard, Login, Admin, PanelEmma
│       └── components/       Shared UI components and charts
│
├── edge/                     NVIDIA Jetson TK1 edge application
│   ├── app/                  Serial reader, local API, modem monitor
│   └── sync/                 Batch uplink worker
│
├── bridge/                   LoRa RX gateway bridge (serial → HTTP)
│
├── opt/mango_node/           Edge ingest service (Upstart-compatible)
│
├── deploy/
│   └── vps/                  Production deployment
│       ├── compose.vps.yml   Docker Compose — production stack
│       ├── .env.vps.example  Environment variable template
│       ├── Makefile          Stack management (make up / down / backup…)
│       └── nginx/            nginx host site configurations
│
├── grafana/                  Provisioned datasources and dashboards
├── nginx/                    Local development nginx config
├── hardware/                 Component references and wiring notes
├── tests/                    Backend integration tests
│
├── compose.yaml              Development Docker Compose (local)
├── ARCHITECTURE.md           Detailed system architecture
├── CHANGELOG.md              Version history
├── CONTRIBUTING.md           Contribution guide
├── SECURITY.md               Security disclosure policy
└── LICENSE.md                MIT License
```

---

## Deployment Guide

### Prerequisites

- VPS with Docker, Docker Compose v2, nginx, and Certbot
- Domain pointing to the VPS IP
- SSH access to the server

### 1. Clone and configure

```bash
git clone https://github.com/T4t4n32/M_A_N_G_O.git
cd M_A_N_G_O/deploy/vps
cp .env.vps.example .env.vps
# Edit .env.vps — set DB_PASSWORD, SECRET_KEY, SUPER_ADMIN_EMAIL,
# INGEST_API_KEY, CORS_ORIGINS, SMTP_*, GRAFANA_PASSWORD
```

### 2. Create the Docker network

```bash
docker network create mango_net
```

### 3. Start the backend stack

```bash
make up
```

This builds the `mango-backend:local` image, starts all services, and runs `db_init` to create tables idempotently before the backend accepts traffic.

### 4. Configure nginx and TLS

```bash
sudo cp deploy/vps/nginx/integramosoe.conf /etc/nginx/sites-available/integramosoe
sudo ln -sf /etc/nginx/sites-available/integramosoe /etc/nginx/sites-enabled/integramosoe
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 5. Deploy the frontend

```bash
cd frontend && npm ci && npm run build
rsync -a --delete dist/ /var/www/mango-ui/
```

### Stack management reference

```bash
make up            # Build and start all services
make down          # Stop and remove containers (volumes preserved)
make restart       # down + up
make logs          # Follow all service logs
make logs-backend  # Follow backend logs only
make status        # Container health summary
make health        # Hit /api/v1/health and print the result
make backup        # Dump Postgres to backups/mango_<timestamp>.sql
make shell-db      # Open psql inside mango_db
make routes        # List all registered Flask routes
```

### Environment variables

| Variable              | Required | Description                                              |
|-----------------------|----------|----------------------------------------------------------|
| `DB_PASSWORD`         | Yes      | PostgreSQL password                                      |
| `SECRET_KEY`          | Yes      | Flask session signing key (32+ char random string)       |
| `SUPER_ADMIN_EMAIL`   | Yes      | Email for the initial super-admin account                |
| `INGEST_API_KEY`      | Yes      | Bearer token for edge ingest endpoints                   |
| `SESSION_SECURE`      | Yes      | Set to `1` in production (HTTPS required)                |
| `CORS_ORIGINS`        | Yes      | Comma-separated list of allowed frontend origins         |
| `SMTP_USER`           | Yes      | SMTP username for contact form email delivery            |
| `SMTP_PASSWORD`       | Yes      | SMTP password (use an App Password for Gmail)            |
| `GRAFANA_PASSWORD`    | Yes      | Grafana admin password                                   |
| `DB_USER`             | No       | PostgreSQL username (default: `mango`)                   |
| `DB_NAME`             | No       | PostgreSQL database name (default: `mango`)              |
| `API_HOST_PORT`       | No       | Host port for the backend container (default: `8000`)    |
| `GUNICORN_WORKERS`    | No       | Gunicorn worker count (default: `2`)                     |
| `MAX_UPLOAD_VIDEO_MB` | No       | Max video upload in MB (default: `2000`)                 |
| `MAX_UPLOAD_IMAGE_MB` | No       | Max image upload in MB (default: `200`)                  |

See [`backend/.env.example`](backend/.env.example) for the full reference.

---

## Hardware Overview

### Field Node (TX)

| Component              | Role                                           |
|------------------------|------------------------------------------------|
| NVIDIA Jetson TK1      | Edge compute, serial ingest, sync, missions    |
| ESP32 + RA-02          | Sensor reading, LoRa TX, serial output         |
| PT100 + MAX31865       | Temperature measurement (SPI)                  |
| pH sensor module       | pH measurement (analog output)                 |
| Turbidity sensor       | Turbidity / NTU (analog output)                |
| Huawei E3372H-153      | LTE uplink via USB HiLink mode                 |
| Waterproof enclosure   | Field deployment protection                    |

### Gateway Node (RX)

| Component              | Role                                           |
|------------------------|------------------------------------------------|
| ESP32 + RA-02          | LoRa RX at 433 MHz                             |
| Python bridge service  | Serial → HTTP POST to VPS ingest endpoint      |

### Protocol

- **Transport**: LoRa 433 MHz (RA-02 modules)
- **Payload format**: `TEMP=24.36;PH=7.12;TURB=183.4;SEQ=001;DEV=node01`
- **Cloud ingestion**: REST + JSON over HTTPS, API key required on all ingest requests
- **Deduplication**: `packet_id` field prevents duplicate readings on replay

---

## Contributing

Contributions, issue reports, and feature suggestions are welcome.
Read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a pull request.

To report a security vulnerability, follow the process in [SECURITY.md](SECURITY.md).

---

## License

MIT — see [LICENSE.md](LICENSE.md).

---

## Author

**Sebastián Sánchez** — [github.com/T4t4n32](https://github.com/T4t4n32)

This project began as a high-school degree research initiative in Colombia and is developed independently. The goal is to provide a replicable, low-cost monitoring model for mangrove conservation efforts.
