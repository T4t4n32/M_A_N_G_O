# 📜 Changelog — M.A.N.G.O

All notable changes to this project will be documented in this file.  
This project adheres to [Semantic Versioning](https://semver.org/).

---

# Changelog
All notable changes to this project will be documented in this file.

The format follows a simplified interpretation of Keep a Changelog and semantic versioning principles adapted to the project’s experimental and research-driven nature.

---

## [v1.5.0] – Backend Stabilization & Data Flow Hardening
**Release date:** 2026-01-XX

This release consolidates the backend architecture after the hardware validation phase.
The focus is on stability, separation of concerns, and data integrity, preparing the system for future persistence and dashboard integration.

### Added
- Centralized serial communication management
- Unified in-memory sensor data structure
- Stable health endpoint independent of hardware state
- Initial backend architecture documentation

### Changed
- Sensor routes now read from shared internal state instead of direct hardware access
- Backend flow reorganized to enforce service-based architecture
- API boundaries clarified and simplified

### Fixed
- Serial port conflicts caused by multiple access attempts
- JSON parsing errors from partial or malformed serial reads
- Inconsistent sensor payload structures

### Removed
- Direct serial access from API routes
- Redundant or experimental backend components

### Notes
This version intentionally does not include:
- Database persistence
- Dashboard rendering
- Authentication logic

These features will be introduced only after backend stability is guaranteed.

---

## [v1.4.0] – Sensor Validation & Hardware Reality Check
**Release date:** 2025-XX-XX

This release marks an important technical milestone focused on real-world sensor validation rather than visual output.
It exposed key hardware limitations, confirmed stable components, and clarified the correct path forward for reliable environmental monitoring.

### Added
- Initial validation phase for environmental sensors (temperature, turbidity, pH)
- Formal documentation of hardware issues through GitHub Issues
- Baseline workflow for sensor testing before data ingestion

### Changed
- Development focus shifted from dashboard visualization to sensor reliability
- Turbidity and pH sensors paused pending recalibration and hardware review
- Project flow adjusted to validate sensors individually before unifying data

### Fixed
- Incorrect NTU readings caused by unstable analog output from turbidity module
- Misinterpretation of AO pin behavior and potentiometer functionality
- Assumptions regarding quantitative capability of non-industrial turbidity sensors

### Improved
- PT100 (3-wire) temperature sensor successfully validated with MAX31865
- Stable SPI communication and repeatable temperature measurements achieved
- Clear separation between validated, experimental, and pending sensors

### Next Steps
- Recalibrate pH sensor using standard buffer solutions
- Evaluate replacement of turbidity sensor with industrial-grade alternatives (e.g. TSW-20m)
- Unify validated sensor data into a single structured payload
- Resume dashboard integration only after sensor confidence is achieved

---

## [v1.3.0] – Python Integration & Early Backend Experiments
**Release date:** 2025-XX-XX

This version represents the first serious attempt at integrating sensor data into a Python-based backend.
Several architectural assumptions were tested and later refined in subsequent releases.

### Added
- Initial Python backend structure
- Early serial communication scripts
- Experimental API endpoints for sensor access

### Changed
- Shift from isolated scripts to a service-oriented backend approach
- Early experimentation with Flask for API exposure

### Fixed
- Basic serial reading stability issues
- Initial environment and dependency conflicts

### Notes
This release is considered experimental and served as a foundation for later refactors.

---

## [v1.2.0] – Multi-Sensor Prototyping Phase
**Release date:** 2025-XX-XX

Focused on rapid prototyping and parallel development of multiple sensors.

### Added
- Early turbidity sensor experiments
- Initial pH sensor readings
- First temperature sensor integration attempts

### Changed
- Multiple firmware iterations across sensor types
- Rapid adjustments to sensor wiring and calibration logic

### Notes
Data produced during this phase is not considered reliable and should not be used for analysis.

---

## [v1.1.0] – Hardware Bring-Up & Communication Tests
**Release date:** 2025-XX-XX

This release focused on bringing up hardware components and validating basic communication paths.

### Added
- Serial communication tests
- Basic firmware sketches for individual sensors
- Initial project structure and repository setup

### Notes
This version marks the beginning of hands-on hardware interaction.

---

## [v1.0.0] – 2025-12-09
### 🚀 Initial Stable Release
**M.A.N.G.O** is officially published as a fully documented, functional prototype.  

**Features included:**
- Modular hardware setup with NVIDIA Jetson TK1 and water-resistant enclosure  
- Integration of LoRa wireless communication for data transmission  
- Sensors for pH, turbidity, and temperature measurements  
- Real-time data ingestion into a cloud-based database  
- Dashboard prototype for visualization and alerts  
- Pilot test site planning for Colombian mangrove ecosystems  

**Documentation:**
- Full README with system overview, goals, and repository structure  
- CONTRIBUTING.md for professional contribution guidelines  
- LICENSE.md under MIT License  
- Repository folders organized for hardware, software, database, and dashboard  

**Notes:**
- Device is temporarily deployed during field sessions, database remains 24/7  
- Future upgrades planned: AI predictions, solar power module, dashboard enhancements  

---

## [v0.9.0] – 2025-11-30
### 🛠 Pre-release / Prototype Stage
- Core concept defined  
- Initial sensor selection and basic testing  
- LoRa communication experiments initiated  
- Database structure drafted  
- Dashboard framework prototyped  
- Pilot site shortlist created  

**Notes:**
- Pre-release for internal testing and calibration  
- No stable deployment yet  

---

## [v0.1.0] – 2025-11-15
### 🔧 Conceptual Prototype
- Project concept documented  
- Hardware components research started  
- Initial repository structure created  
- Placeholder README drafted  

---

> **Tip:** Always update this file with **every new release or important change**.  
> Use Semantic Versioning to indicate:  
> - MAJOR: breaking changes or new architecture  
> - MINOR: new features, backward-compatible  
> - PATCH: bug fixes, minor updates  


