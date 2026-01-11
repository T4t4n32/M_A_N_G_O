# 🗺️ ROADMAP — M.A.N.G.O.

**Project:** M.A.N.G.O — Autonomous Monitoring of Oceanic Management Levels  
**Scope:** Academic + Functional Prototype  
**Approach:** Incremental, modular, verifiable  

---

## 🟢 PHASE 0 — Foundation (COMPLETED)

**Goal:** Establish a stable backend and data ingestion pipeline.

### Completed
- ✔ Backend structure defined (`routes`, `services`, `models`)
- ✔ Flask API operational
- ✔ Serial communication established
- ✔ Sensor endpoints responding
- ✔ API-only backend design enforced
- ✔ Project cleanup and folder normalization

**Outcome:**  
A functional backend capable of receiving real sensor data.

---

## 🟡 PHASE 1 — Data Stabilization (CURRENT)

**Goal:** Ensure reliable, clean, and continuous sensor data flow.

### Objectives
- Normalize serial JSON format
- Prevent multi-access to serial port
- Add basic buffering / last-value cache
- Improve error handling and logging
- Define “sensor online/offline” logic

### Deliverables
- Stable sensor readings
- Reduced serial read errors
- Reliable `/api/*/latest` endpoints

---

## 🟠 PHASE 2 — Dashboard Integration (NEXT)

**Goal:** Connect frontend dashboard to live backend data.

### Objectives
- Connect HTML + JS dashboard to API
- Fetch sensor data via `fetch()`
- Implement auto-refresh mechanism
- Display online/offline status
- Graceful handling of missing data

### Non-goals
- ❌ No React
- ❌ No complex state management
- ❌ No styling focus

---

## 🔵 PHASE 3 — Persistence Layer (FUTURE)

**Goal:** Store historical sensor data.

### Objectives
- Decide on SQLite vs CSV
- Implement write-on-interval strategy
- Avoid blocking serial reads
- Enable future data visualization

---

## 🟣 PHASE 4 — Validation & Calibration

**Goal:** Ensure scientific and technical credibility.

### Objectives
- Sensor calibration curves
- Noise filtering
- Voltage → value mapping review
- Test under real environmental conditions

---

## ⚫ PHASE 5 — Deployment & Documentation

**Goal:** Prepare project for presentation and evaluation.

### Objectives
- Final documentation
- Architecture diagrams
- System limitations clearly stated
- Academic justification of design decisions

---

## 🚫 OUT OF SCOPE (FOR NOW)

- Mobile apps
- Cloud infrastructure
- AI-based predictions
- User authentication
- Large-scale deployment

---

## 📌 ROADMAP PRINCIPLES

- Stability over features
- Documentation over assumptions
- One step at a time
- Prototype first, optimize later

---

## 🧠 FINAL NOTE

This roadmap is intentionally conservative.
Each phase produces a demonstrable improvement
without compromising system stability.

