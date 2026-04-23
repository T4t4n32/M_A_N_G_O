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
[![Pull Requests](https://img.shields.io/github/issues-pr/T4t4n32/M.A.N.G.O?style=for-the-badge&label=Pull%20Requests)](https://github.com/T4t4n32/M.A.N.G.O/pulls)
[![Stars](https://img.shields.io/github/stars/T4t4n32/M.A.N.G.O?style=for-the-badge&label=Stars)](https://github.com/T4t4n32/M.A.N.G.O/stargazers)
[![Build](https://img.shields.io/github/actions/workflow/status/T4t4n32/M.A.N.G.O/blank.yml?branch=main&style=for-the-badge&label=Build)](https://github.com/T4t4n32/M.A.N.G.O/actions/workflows/blank.yml)

</div>

---

## Table of Contents

- [What is M.A.N.G.O?](#what-is-mango)
- [Key Features](#key-features)
- [System Measurements](#system-measurements)
- [Field Operation Model](#field-operation-model)
- [Current Status](#current-status)
- [Technology Stack](#technology-stack)
- [Installation and Usage](#installation-and-usage)
- [Repository Structure](#repository-structure)
- [Roadmap](#roadmap)
- [Changelog and Releases](#changelog-and-releases)
- [Contributing](#contributing)
- [License](#license)
- [Author](#author)

---

## What is M.A.N.G.O?

**M.A.N.G.O** is a low-cost, portable monitoring system designed to measure key water conditions in mangrove ecosystems.
Its goal is to provide accurate field measurements and make them accessible for conservation, research, and decision-making.

Mangroves are essential for:

- Protecting coastal communities from storms
- Filtering polluted water
- Hosting rich biodiversity
- Supporting local livelihoods

M.A.N.G.O addresses a critical gap: **lack of reliable and continuous environmental data** in many mangrove areas.

---

## Key Features

- **Field-ready monitoring:** Portable deployments during measurement sessions.
- **LoRa connectivity:** Long-range data transport suitable for remote areas.
- **Modular approach:** Components can evolve without redesigning the entire system.
- **Backend-first reliability:** Prioritizes data ingestion correctness before heavy UI development.
- **Dockerized backend:** Consistent runtime locally and on the deployment server.
- **Cloud deployment:** VPS and domain integrated at integramosoe.com.

---

## System Measurements

M.A.N.G.O records:

- **pH**
- **Turbidity**
- **Temperature**

Data flow: Sensors → NVIDIA Jetson TK1 → LoRa transport → Base station → PostgreSQL database

---

## Field Operation Model

The device is deployed temporarily during field sessions, not permanently submerged.

- Measurements are recorded and transmitted during each session.
- The device can be retrieved, inspected, and recharged between sessions.
- The backend database remains available continuously for stored data access.

---

## Current Status

- LoRa link validated: JSON message transmitted and received (static test payload for now).
- Backend hardened for robust ingestion and delivery.
- VPS and domain integrated: integramosoe.com (website content pending).
- Frontend dashboard at early stage.

See [STATUS.md](STATUS.md) for detail.

---

## Technology Stack

| Layer        | Technology / Hardware           | Purpose                              |
| ------------ | ------------------------------- | ------------------------------------ |
| Edge compute | NVIDIA Jetson TK1               | Sensor handling and processing       |
| Transport    | LoRa modules                    | Long-range, low-power communication  |
| Backend      | Flask, PostgreSQL, Docker        | Data ingestion, API, storage         |
| Server       | VPS + domain (integramosoe.com) | Deployment target                    |
| Frontend     | React, Vite, TypeScript         | Web dashboard                        |
| Sensors      | pH, turbidity, temperature      | Field measurements                   |

---

## Installation and Usage

### 1. Clone the repository

```bash
git clone https://github.com/T4t4n32/M.A.N.G.O.git
cd M.A.N.G.O
```

### 2. Start the backend (Docker)

```bash
cp .env.example .env   # fill in DB_PASSWORD, SECRET_KEY, INGEST_API_KEY
docker compose up -d
```

See `backend/README.md` for environment variable reference and VPS deployment instructions.

### 3. Start the frontend

```bash
cd .lovable_ui/MANGO_PAGE_LOVABLE_V2.0
npm install
npm run dev
```

### 4. LoRa firmware

Sketches are under `firmware/LoRa/3th_test/`. Flash with Arduino IDE. Gateway service is in `gateway/`.

---

## Repository Structure

| Path | Contents |
| ---- | -------- |
| `backend/` | Flask API, Docker setup, database migrations |
| `.lovable_ui/` | Web dashboard (React + TypeScript) |
| `firmware/` | Arduino sketches for sensor nodes and LoRa transport |
| `gateway/` | Python gateway: serial LoRa RX to HTTP POST |
| `edge/` | Edge compute scripts (NVIDIA Jetson TK1) |
| `hardware/` | Component references and schematics |
| `link/` `bridge/` | LoRa transport layer and bridge service |
| `deploy/` `nginx/` | Deployment configs and reverse proxy |
| `scripts/` | Setup and maintenance scripts |

---

## Roadmap

1. Switch LoRa payload from static JSON to real sensor readings with validation
2. Finish VPS web serving (HTTPS) and connect frontend to stable API
3. Add historical query endpoints per sensor type
4. Expand dashboard with calibration and confidence indicators

See [ROADMAP.md](ROADMAP.md) for detail.

---

## Changelog and Releases

- [CHANGELOG.md](CHANGELOG.md) — curated history of notable changes
- [Releases](https://github.com/T4t4n32/M.A.N.G.O/releases/latest) — published releases

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

MIT — see [LICENSE.md](LICENSE.md).

---

## Author

Sebastián Sánchez — [github.com/T4t4n32](https://github.com/T4t4n32)

This project began as a high-school degree research initiative and is currently developed independently.
