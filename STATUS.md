# 📊 PROJECT STATUS — M.A.N.G.O.

**Project:** M.A.N.G.O — Autonomous Monitoring of Oceanic Management Levels  
**Status:** Active Development  
**Last update:** 2026-01-05  

---

## 🟢 CURRENT STATE (WHAT WORKS)

### Backend (Flask API)
- ✅ Flask backend runs correctly on `0.0.0.0:5000`
- ✅ API structure stabilized under `/api/*`
- ✅ Health check endpoint operational
- ✅ Sensor endpoints operational:
  - `/api/ph/latest`
  - `/api/temperature/latest`
  - `/api/turbidity/latest`
- ✅ JSON responses correctly formatted
- ✅ No HTML served from backend (API-only design)

### Serial Communication
- ✅ Serial device detected (`/dev/ttyACM0`)
- ✅ Serial connection established from backend
- ✅ Sensor data is received from microcontroller
- ✅ Data ingestion pipeline active
- ✅ Serial access centralized (single access point)

### Internal Architecture
- ✅ Clear separation of concerns:
  - `routes/` → API endpoints
  - `services/` → serial + data logic
  - `models/` → reserved for future persistence
- ✅ Circular imports resolved
- ✅ Duplicate blueprints removed
- ✅ Runtime errors significantly reduced

---

## 🟡 PARTIALLY WORKING / IN PROGRESS

### Data Flow
- ⚠️ Sensor data is received but not always reflected in the dashboard
- ⚠️ Some serial read errors still appear under heavy polling
- ⚠️ No buffering or smoothing applied yet

### Frontend (Dashboard)
- ⚠️ Dashboard exists but is not fully connected to the API
- ⚠️ Root URL (`/`) returns 404 (expected behavior)
- ⚠️ Offline/online status handling not implemented yet
- ⚠️ No automatic refresh or error state UI

---

## 🔴 NOT IMPLEMENTED YET

### Persistence
- ❌ No database enabled
- ❌ No historical data storage
- ❌ No export or logging system

### Authentication & Security
- ❌ No auth system enabled
- ❌ No rate limiting
- ❌ No environment-based secrets enforcement

### Deployment
- ❌ No production WSGI server
- ❌ No containerization
- ❌ No CI/CD pipeline

---

## 📌 TECHNICAL DECISIONS (CONFIRMED)

- Backend serves **API only**, never frontend
- Frontend uses **HTML + CSS + Vanilla JS**
- React or SPA frameworks are **not used at this stage**
- Serial access must remain **single-owner**
- Database is deferred to a later phase
- Project structure prioritized over premature optimization

---

## 🎯 CURRENT FOCUS

1. Stabilize serial ingestion
2. Connect dashboard to live API data
3. Implement clear ONLINE / OFFLINE logic
4. Document architecture and roadmap
5. Prepare first clean release

---

## 🧠 NOTES

This project is transitioning from experimental development to
a structured, documented, and versioned system suitable for
academic presentation and real-world prototyping.
