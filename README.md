# M.A.N.G.O — Autonomous Monitoring of Ocean Management Levels

<p align="center">
  <img src="docs/overview/LOGO.png" width="340" alt="M.A.N.G.O Logo" style="max-width: 100%;">
</p>

<h3 align="center">
  Real-time environmental data collection to support the protection and management of mangrove ecosystems in Colombia.
</h3>

<div align="center">

[![Release](https://img.shields.io/github/v/release/T4t4n32/M_A_N_G_O?include_prereleases=true&style=for-the-badge&label=Release)](https://github.com/T4t4n32/M_A_N_G_O/releases/latest)
[![Version](https://img.shields.io/github/v/tag/T4t4n32/M_A_N_G_O?sort=semver&style=for-the-badge&label=Version)](https://github.com/T4t4n32/M_A_N_G_O/tags)
[![License](https://img.shields.io/github/license/T4t4n32/M_A_N_G_O?style=for-the-badge&label=License)](LICENSE.md)
[![Issues](https://img.shields.io/github/issues/T4t4n32/M_A_N_G_O?style=for-the-badge&label=Issues)](https://github.com/T4t4n32/M_A_N_G_O/issues)
[![Pull Requests](https://img.shields.io/github/issues-pr/T4t4n32/M_A_N_G_O?style=for-the-badge&label=Pull%20Requests)](https://github.com/T4t4n32/M_A_N_G_O/pulls)
[![Stars](https://img.shields.io/github/stars/T4t4n32/M_A_N_G_O?style=for-the-badge&label=Stars)](https://github.com/T4t4n32/M_A_N_G_O/stargazers)
[![Build](https://img.shields.io/github/actions/workflow/status/T4t4n32/M_A_N_G_O/blank.yml?branch=main&style=for-the-badge&label=Build)](https://github.com/T4t4n32/M_A_N_G_O/actions/workflows/blank.yml)

</div>

## Latest Release
- **Latest release page:** https://github.com/T4t4n32/M_A_N_G_O/releases/latest  
- **Changelog:** [CHANGELOG.md](CHANGELOG.md)

> Why this matters: linking to `/releases/latest` always points to your most recent published release, even after you publish new versions. :contentReference[oaicite:3]{index=3}

---

## Table of Contents
- [What is M.A.N.G.O?](#what-is-mango)
- [Key Features](#key-features)
- [System Measurements](#system-measurements)
- [Important Clarification](#important-clarification)
- [Technology Stack](#technology-stack)
- [Installation & Usage](#installation--usage)
- [Repository Structure](#repository-structure)
- [Roadmap](#roadmap)
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
- **Cloud-ready direction:** VPS + domain in place (website content pending)

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
- Measurements are recorded and sent
- Device can be removed, checked, and recharged
- The **database remains available 24/7** for stored data

---

## Technology Stack
| Layer | Technology / Hardware | Purpose |
| --- | --- | --- |
| Edge compute | NVIDIA Jetson TK1 | Sensor management + data processing |
| Transport | LoRa modules | Long-range, low-power link |
| Backend | (Current) Dockerized backend | Consistent local + server runtime |
| Server | VPS + domain (integramosoe.com) | Deployment target (site pending) |
| Frontend | Web dashboard (early-stage) | Visualization layer (minimal for now) |
| Sensors | pH, turbidity, temperature | Field measurements |

---

## Installation & Usage (Developer Setup)
> This section is intentionally simple and safe for beginners.

### 1) Clone
```bash
git clone https://github.com/T4t4n32/M_A_N_G_O.git
cd M_A_N_G_O
2) Backend (Docker)
Go to the backend folder (where your Docker setup lives) and follow its README.

The goal is: one command to run the backend the same way locally and on the VPS.

3) LoRa Tests
LoRa test sketches are available under CODE/ (see the LoRa test folders).

Current milestone: JSON message transmit/receive is working (payload still static).

Repository Structure
Your repo is large; this map helps people find things fast.

CODE/ — experiments and implementation (LoRa tests, sensor scripts, historical code)

HARDWARE/ — hardware references, components, and build-related files

DEGREE PROJECT/ — research docs, drafts, investigation sources

SENA/ — presentations and academic deliverables

.github/workflows/ — CI workflows (build status badge)

Roadmap
Planned next milestones:

Switch LoRa payload from static JSON → real sensor readings + validation rules

Finish VPS web serving (reverse proxy + HTTPS) and connect frontend to stable API

Add persistence (SQLite or time-series DB) + historical endpoints per sensor

Tip: This roadmap is written in a changelog-style mindset (Added/Changed/Fixed), which makes updates easy to track. 

Contributing
See CONTRIBUTING.md.

License
MIT — see LICENSE.md.

Author
Sebastián Sánchez — https://github.com/T4t4n32

Project Note
This project began as a high-school research initiative and is currently developed independently by Sebastián Sánchez.


---