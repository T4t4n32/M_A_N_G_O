# Changelog — M.A.N.G.O

All notable changes to this project are documented here.
This project follows [Semantic Versioning](https://semver.org/) and a simplified interpretation of [Keep a Changelog](https://keepachangelog.com/).

---

## [v2.0.0] — 2026-06-03

### Added
- File upload system: images (200 MB), videos (2 GB), documents (500 MB) with MIME detection and per-kind size enforcement.
- `mango_uploads` Docker volume for persistent file storage across container restarts.
- Public file serving at `/api/v1/uploads/*` — nginx `^~` prefix block ensures uploaded images and videos are proxied to the backend instead of being served (and 404'd) as static files.
- `/api/v1/admin/uploads` list, patch, and delete endpoints; `/api/v1/admin/upload` POST.
- Signed temporary download links for documents.
- Huawei E3372H-153 LTE modem integration: HiLink API polling, signal strength, connection state, dashboard widget.
- Modem status visible from Panel Emma device cards and from the public dashboard.
- Panel Emma live content editing: all editable site sections updated in-place without a deploy.
- Panel Emma media library wired to backend API (replaces static placeholder).
- `/archivos` public document library page with category filtering.
- Public hydration of site content and documents on page load from backend.
- Super-admin lock: only one super-admin account can exist; protected from role downgrade.
- Inline user role editing from the admin user table.
- `AUTH_DISABLED` env flag for development bypass.

### Changed
- nginx `client_max_body_size` for `/api/v1/admin/upload` raised to 2 GB; `proxy_read_timeout` raised to 3600s to support large video uploads over slow connections.
- Flask `MAX_CONTENT_LENGTH` and per-kind limits aligned with nginx (no mismatch 413 errors).
- `compose.vps.yml` sets `GUNICORN_TIMEOUT=1800` to cover long-running upload requests.

### Fixed
- Login endpoint checking `res.ok` instead of `res.success` (client-side regression).
- Flask-Bcrypt missing from `requirements.txt`.
- Site-content API switched to flat key storage; frontend hydration no longer requires a separate request per section.
- Access-requests trailing-slash 308 redirect breaking POST from some clients.
- Panel Emma auth check using stale session state after logout/re-login.

---

## [v1.9.0] — 2026-05-28

### Added
- Panel Emma: real upload flows for images, videos, and documents (replaced placeholder UI).
- Live edit mode: toggle via `?live=1` query parameter; saves to backend on blur.
- Role system expanded: viewer, researcher, admin, super-admin.
- Admin user management table with inline role assignment.
- Password change endpoint and UI for admin accounts.
- `/api/v1/admin/docs` document management routes.
- `/api/v1/admin/media` media gallery routes (legacy key kept for compatibility).

### Fixed
- Frontend `/archivos` layout and Panel Emma docs tab wiring.
- `admin_required` middleware role check corrected for new role enum.

---

## [v1.8.0] — 2026-05-20

### Added
- Mission system: full lifecycle (create, start, pause, complete, cancel) via `/api/v1/missions/*`.
- Edge mission runner (`run_mission.py`): state machine on Jetson coordinates sensor sessions.
- Physical button support via ESP32 RX: `button_press` and `button_hold` events forwarded to Jetson over serial.
- `mango-mission` Upstart service on Jetson.
- BNO080 IMU firmware sketch added to `firmware/`.
- Edge app fully compatible with Python 3.4 (Ubuntu 14.04 on Jetson TK1): removed f-strings, union types, `futures`, and all Python 3.6+ constructs.
- Upstart init configs for `mango-edge-serial`, `mango-edge-sync`, `mango-edge-mission`.

### Fixed
- Upstart respawn limit raised to prevent services being disabled after rapid restarts.
- `mango-edge-*` old service names stopped before install to avoid port 9100 conflicts.
- `UnicodeEncodeError` in Python 3.4 when logging non-ASCII characters.

---

## [v1.7.0] — 2026-05-08

### Added
- `mango_hub` TUI control centre: interactive menu for service management on VPS and Jetson.
- Reverse SSH tunnel: Jetson dials out to VPS sshd on port 9200 and exposes a local port for remote access. Tunnel waits for internet connectivity before attempting SSH.
- WebSocket PTY terminal in Panel Emma: full browser-based shell sessions for VPS and Jetson via `/api/v1/admin/terminal/*`.
- Real Jetson status probe: Panel Emma device cards show live online/offline state, not a static placeholder.
- `mango_hub.sh` deploy script for the hub service on VPS.
- `compose.vps.yml` updated with explicit `mango_net` external network definition to isolate the stack from root-level Compose networks.
- VPS Docker service management commands added to Makefile.

### Fixed
- Jetson SSH tunneled via `ProxyJump` through the VPS sshd (port 5972).
- SSH parameters hardcoded in tunnel script to avoid `.env` permission issues on Upstart.
- Session missing `role` field causing terminal auth to fail after container restart.

---

## [v1.6.0] — 2026-02-06

### Added
- VPS deployment baseline: integramosoe.com domain, nginx reverse proxy, Let's Encrypt TLS.
- Docker-based backend stack: Flask, PostgreSQL 16, Redis 7, Grafana OSS, all orchestrated via `compose.vps.yml`.
- `deploy/vps/Makefile` with targets: `up`, `down`, `restart`, `logs`, `backup`, `restore`, `shell-db`, `routes`, `db-tables`.
- `db_init` container: idempotent table creation with PostgreSQL advisory lock.
- LoRa link validated: static JSON payload transmitted and received over 433 MHz.
- Backend health endpoint: `GET /api/v1/health` returns DB status and timestamp.

### Changed
- Backend workflow oriented toward production-style gunicorn deployment.
- Environment secrets moved to `.env.vps` (not committed).

---

## [v1.5.0] — 2026-01 (approximate)

### Added
- Centralized serial communication management.
- Unified in-memory sensor data structure.
- Stable health endpoint independent of hardware state.
- Initial backend architecture documentation.

### Changed
- Sensor routes now read from shared internal state instead of direct hardware access.
- Backend flow reorganized to enforce service-based architecture.
- API boundaries clarified and simplified.

### Fixed
- Serial port conflicts caused by multiple simultaneous access attempts.
- JSON parsing errors from partial or malformed serial reads.
- Inconsistent sensor payload structures.

---

## [v1.4.0] — 2025 (approximate)

### Added
- Initial validation phase for environmental sensors: temperature, turbidity, pH.
- Formal documentation of hardware issues through GitHub Issues.

### Changed
- Development focus shifted from dashboard visualization to sensor reliability.
- Turbidity and pH sensors paused pending recalibration and hardware review.

### Fixed
- Incorrect NTU readings caused by unstable analog output from turbidity module.
- Misinterpretation of analog output pin behavior.
- PT100 (3-wire) temperature sensor validated with MAX31865 over SPI.

---

## [v1.3.0] — 2025 (approximate)

### Added
- Initial Python backend structure.
- Early serial communication scripts.
- Experimental API endpoints for sensor access.

### Changed
- Shift from isolated scripts to a service-oriented backend approach.

---

## [v1.2.0] — 2025 (approximate)

### Added
- Early turbidity sensor experiments.
- Initial pH sensor readings.
- First temperature sensor integration attempts.

---

## [v1.1.0] — 2025 (approximate)

### Added
- Serial communication tests.
- Basic firmware sketches for individual sensors.
- Initial project structure and repository setup.

---

## [v1.0.0] — 2025-12-09

### Added
- Modular hardware setup with NVIDIA Jetson TK1 and water-resistant enclosure.
- LoRa wireless communication for data transmission.
- Sensors for pH, turbidity, and temperature measurements.
- Dashboard prototype for visualization.
- Pilot test site planning for Colombian mangrove ecosystems.
- CONTRIBUTING.md, LICENSE.md, initial README.

---

## [v0.9.0] — 2025-11-30

### Added
- Core concept defined and documented.
- Initial sensor selection and basic testing.
- LoRa communication experiments initiated.
- Database structure drafted.

---

## [v0.1.0] — 2025-11-15

### Added
- Project concept documented.
- Hardware components research started.
- Initial repository structure created.
