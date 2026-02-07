# M.A.N.G.O — Autonomous Monitoring of Oceanic Management Levels

<p align="center">
  <img src="frontend/assets/images/LOGO.png" width="340" alt="M.A.N.G.O Logo" style="max-width: 100%;">
</p>

<h3 align="center">
  Real-time environmental data collection to support the protection and management of mangrove ecosystems in Colombia.
</h3>

<div align="center">

<!-- =========================================================
BADGES (CURRENT REPO NAME: M.A.N.G.O)
If these badges fail due to the dots in the repo name,
use the NO DOTS block right below instead.
Known issue exists for repo names with "." on Shields release badges. 
========================================================= -->

[![Release](https://img.shields.io/github/v/release/T4t4n32/M.A.N.G.O?include_prereleases=true&style=for-the-badge&label=Release)](https://github.com/T4t4n32/M.A.N.G.O/releases/latest)
[![Version](https://img.shields.io/github/v/tag/T4t4n32/M.A.N.G.O?sort=semver&style=for-the-badge&label=Version)](https://github.com/T4t4n32/M.A.N.G.O/tags)
[![License](https://img.shields.io/github/license/T4t4n32/M.A.N.G.O?style=for-the-badge&label=License)](LICENSE.md)
[![Issues](https://img.shields.io/github/issues/T4t4n32/M.A.N.G.O?style=for-the-badge&label=Issues)](https://github.com/T4t4n32/M.A.N.G.O/issues)
[![Pull Requests](https://img.shields.io/github/issues-pr/T4t4n32/M.A.N.G.O?style=for-the-badge&label=Pull%20Requests)](https://github.com/T4t4n32/M.A.N.G.O/pulls)
[![Stars](https://img.shields.io/github/stars/T4t4n32/M.A.N.G.O?style=for-the-badge&label=Stars)](https://github.com/T4t4n32/M.A.N.G.O/stargazers)

<!-- Build badge (only works if workflow path/name matches) -->
[![Build](https://img.shields.io/github/actions/workflow/status/T4t4n32/M.A.N.G.O/blank.yml?branch=main&style=for-the-badge&label=Build)](https://github.com/T4t4n32/M.A.N.G.O/actions/workflows/blank.yml)

</div>

<!-- =========================================================
BADGES (NO DOTS VARIANT)
If your release badge shows "no releases" or "repo not found",
rename the repository (recommended), then use this block:

Example repo names:
- MANGO
- M_A_N_G_O
- M-A-N-G-O

Then replace REPO_NAME_HERE below with your final repo name.
=========================================================

<div align="center">

[![Release](https://img.shields.io/github/v/release/T4t4n32/REPO_NAME_HERE?include_prereleases=true&style=for-the-badge&label=Release)](https://github.com/T4t4n32/REPO_NAME_HERE/releases/latest)
[![Version](https://img.shields.io/github/v/tag/T4t4n32/REPO_NAME_HERE?sort=semver&style=for-the-badge&label=Version)](https://github.com/T4t4n32/REPO_NAME_HERE/tags)
[![License](https://img.shields.io/github/license/T4t4n32/REPO_NAME_HERE?style=for-the-badge&label=License)](LICENSE.md)
[![Issues](https://img.shields.io/github/issues/T4t4n32/REPO_NAME_HERE?style=for-the-badge&label=Issues)](https://github.com/T4t4n32/REPO_NAME_HERE/issues)
[![Pull Requests](https://img.shields.io/github/issues-pr/T4t4n32/REPO_NAME_HERE?style=for-the-badge&label=Pull%20Requests)](https://github.com/T4t4n32/REPO_NAME_HERE/pulls)
[![Stars](https://img.shields.io/github/stars/T4t4n32/REPO_NAME_HERE?style=for-the-badge&label=Stars)](https://github.com/T4t4n32/REPO_NAME_HERE/stargazers)
[![Build](https://img.shields.io/github/actions/workflow/status/T4t4n32/REPO_NAME_HERE/blank.yml?branch=main&style=for-the-badge&label=Build)](https://github.com/T4t4n32/REPO_NAME_HERE/actions/workflows/blank.yml)

</div>

========================================================= -->

---

## Latest Release

- **Latest release (always up-to-date):** https://github.com/T4t4n32/M.A.N.G.O/releases/latest  
- **Changelog:** [CHANGELOG.md](CHANGELOG.md)

> Why use `/releases/latest`? It always points to the most recent published release, so you don’t have to update the README every time.  

---

## Table of Contents

- [What is M.A.N.G.O?](#what-is-mango)
- [Key Features](#key-features)
- [System Measurements](#system-measurements)
- [Important Clarification](#important-clarification)
- [Current Status](#current-status)
- [Technology Stack](#technology-stack)
- [Installation & Usage](#installation--usage)
- [Repository Structure](#repository-structure)
- [Roadmap](#roadmap)
- [Changelog & Releases](#changelog--releases)
- [Contributing](#contributing)
- [License](#license)
- [Author](#author)
- [Project Note](#project-note)

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

- **Field-ready monitoring:** portable deployments during measurement sessions
- **LoRa connectivity:** long-range data transport suitable for remote areas
- **Modular approach:** components can evolve without redesigning everything
- **Backend-first reliability:** prioritize ingestion correctness before heavy UI work
- **Cloud-ready direction:** VPS + domain integrated (website content pending)
- **Dockerized backend:** consistent runtime locally and on the server

---

## System Measurements

M.A.N.G.O records:
- **pH**
- **Turbidity**
- **Temperature**

High-level flow:
Sensors → Jetson TK1 → LoRa transport → Base station / server → Database (24/7 access)

---

## Important Clarification

The device **does NOT stay permanently deployed in water (24/7)**.
Instead:
- Temporarily deployed during field sessions
- Measurements are recorded and transmitted
- Device can be removed, checked, and recharged
- The **database remains available 24/7** for stored data

---

## Current Status

- LoRa link validated: **JSON message transmitted and received** (static test payload for now).
- Backend is being hardened for robust ingestion and delivery.
- VPS and domain are integrated: **integramosoe.com** (website content pending).
- Minimal improvements applied to the dashboard/frontend layer.

---

## Technology Stack

| Layer | Technology / Hardware | Purpose |
| --- | --- | --- |
| Edge compute | NVIDIA Jetson TK1 | Sensor handling + processing |
| Transport | LoRa modules | Long-range, low-power communication |
| Backend | Dockerized backend | Consistent environment (local + VPS) |
| Server | VPS + domain (integramosoe.com) | Deployment target (site pending) |
| Frontend | Web dashboard (early stage) | Visualization layer (minimal for now) |
| Sensors | pH, turbidity, temperature | Field measurements |

---

## Installation & Usage

> Beginner-friendly on purpose: clean steps, no hidden complexity.

### 1) Clone

```bash
git clone https://github.com/T4t4n32/M.A.N.G.O.git
cd M.A.N.G.O
````

### 2) Backend (Docker)

* Go to the backend folder that contains the Docker setup (e.g., `docker-compose.yml` or a `Dockerfile`).
* Follow the backend README in that folder (if it exists).
* Goal: one command that runs the backend the same way locally and on the VPS.

### 3) LoRa Tests

* LoRa test sketches live under `CODE/` (see LoRa test folders).
* Current milestone: JSON message receive/transmit works (payload still static).

---

## Repository Structure

This repository includes both engineering work and degree-project documentation.

* `CODE/`
  Implementation and experiments (LoRa tests, sensor code, historical programming folders).
* `HARDWARE/`
  Hardware documentation, component references, and build-related files.
* `DEGREE PROJECT/`
  Research docs, drafts, investigation sources, and degree-project material.
* `SENA/`
  Presentations and academic deliverables.
* `.github/workflows/`
  CI workflows (build badge depends on this).

---

## Roadmap

Planned next milestones:

1. Switch LoRa payload from static JSON → **real sensor readings** + validation rules
2. Finish VPS web serving (reverse proxy + HTTPS) and connect frontend to stable API
3. Add persistence (SQLite or time-series DB) + historical endpoints per sensor
4. Expand dashboard with calibration/confidence indicators (when data pipeline is stable)

---

## Changelog & Releases

* [CHANGELOG.md](CHANGELOG.md) contains a curated history of notable changes.
* Releases are published in GitHub under the Releases tab.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

MIT — see [LICENSE.md](LICENSE.md).

---

## Author

Sebastián Sánchez — [https://github.com/T4t4n32](https://github.com/T4t4n32)

---

## Project Note

This project began as a high-school degree research initiative and is currently developed independently by Sebastián Sánchez.
