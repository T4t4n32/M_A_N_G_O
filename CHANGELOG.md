# Changelog — M.A.N.G.O

All notable changes to this project are documented here.
This project follows [Semantic Versioning](https://semver.org/) and a simplified interpretation of [Keep a Changelog](https://keepachangelog.com/).

---

## [v1.6.0] — 2026-02-06

### Added
- VPS deployment baseline and domain acquisition: integramosoe.com (content pending).
- Docker-based backend setup for consistent local and production environments.
- LoRa JSON link validation: static payload successfully transmitted and received.

### Changed
- Backend workflow oriented toward production-style deployment.
- Minor improvements to the dashboard and frontend layer (early stage).

### Notes
LoRa payload is currently static. Next milestone is real sensor data integration.

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

### Removed
- Direct serial access from API routes.
- Redundant and experimental backend components.

### Notes
This version intentionally excludes database persistence, dashboard rendering, and authentication logic. These features are introduced only after backend stability is confirmed.

---

## [v1.4.0] — 2025 (approximate)

### Added
- Initial validation phase for environmental sensors: temperature, turbidity, pH.
- Formal documentation of hardware issues through GitHub Issues.
- Baseline workflow for sensor testing prior to data ingestion.

### Changed
- Development focus shifted from dashboard visualization to sensor reliability.
- Turbidity and pH sensors paused pending recalibration and hardware review.
- Project flow adjusted to validate sensors individually before unifying data.

### Fixed
- Incorrect NTU readings caused by unstable analog output from turbidity module.
- Misinterpretation of analog output pin behavior and potentiometer functionality.
- Assumptions regarding quantitative capability of non-industrial turbidity sensors.

### Changed
- PT100 (3-wire) temperature sensor validated with MAX31865.
- Stable SPI communication and repeatable temperature measurements confirmed.
- Clear separation established between validated, experimental, and pending sensors.

---

## [v1.3.0] — 2025 (approximate)

### Added
- Initial Python backend structure.
- Early serial communication scripts.
- Experimental API endpoints for sensor access.

### Changed
- Shift from isolated scripts to a service-oriented backend approach.
- Early experimentation with Flask for API exposure.

### Fixed
- Basic serial reading stability issues.
- Initial environment and dependency conflicts.

### Notes
This release is considered experimental and served as a foundation for subsequent refactors.

---

## [v1.2.0] — 2025 (approximate)

### Added
- Early turbidity sensor experiments.
- Initial pH sensor readings.
- First temperature sensor integration attempts.

### Changed
- Multiple firmware iterations across sensor types.
- Rapid adjustments to sensor wiring and calibration logic.

### Notes
Data produced during this phase is not considered reliable and should not be used for analysis.

---

## [v1.1.0] — 2025 (approximate)

### Added
- Serial communication tests.
- Basic firmware sketches for individual sensors.
- Initial project structure and repository setup.

### Notes
This version marks the beginning of hands-on hardware interaction.

---

## [v1.0.0] — 2025-12-09

### Added
- Modular hardware setup with NVIDIA Jetson TK1 and water-resistant enclosure.
- LoRa wireless communication for data transmission.
- Sensors for pH, turbidity, and temperature measurements.
- Real-time data ingestion into a cloud-based database.
- Dashboard prototype for visualization and alerts.
- Pilot test site planning for Colombian mangrove ecosystems.
- Full README with system overview, goals, and repository structure.
- CONTRIBUTING.md with contribution guidelines.
- LICENSE.md under MIT License.
- Repository folders organized for hardware, software, database, and dashboard.

### Notes
Device is temporarily deployed during field sessions. Database remains accessible continuously.

---

## [v0.9.0] — 2025-11-30

### Added
- Core concept defined and documented.
- Initial sensor selection and basic testing.
- LoRa communication experiments initiated.
- Database structure drafted.
- Dashboard framework prototyped.
- Pilot site shortlist created.

### Notes
Pre-release for internal testing and calibration. No stable deployment.

---

## [v0.1.0] — 2025-11-15

### Added
- Project concept documented.
- Hardware components research started.
- Initial repository structure created.
- Placeholder README drafted.
