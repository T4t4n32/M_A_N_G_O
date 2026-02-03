# M.A.N.G.O. Backend (FastAPI)

This backend provides a secure, institutional-grade API for **M.A.N.G.O. (Monitoring of Aquatic & Natural Global Observations)** with strict access control, sensor ingestion, and read-only dashboards.

## Highlights

- **FastAPI** with JWT authentication (access + refresh tokens)
- **Role-based access control** (admin, institution, analyst, viewer)
- **No public registration** — users are created by administrators
- **Write-only ingestion** API for real sensor data
- **Read-only dashboard** API with institution scoping
- **Structured logging** with access logs stored in the database
- **Extensible architecture** prepared for future MQTT ingestion

## Project Structure

```
backend/
  mango_api/
    api/
      deps.py
      routes/
        admin.py
        auth.py
        dashboard.py
        health.py
        ingestion.py
        sensors.py
    core/
      config.py
      security.py
    db/
      base.py
      session.py
    middleware/
      access_log.py
    models/
      access_log.py
      institution.py
      measurement.py
      sensor.py
      token_blocklist.py
      user.py
    schemas/
      auth.py
      institution.py
      measurement.py
      sensor.py
      user.py
    services/
      ingestion.py
    utils/
      validators.py
    main.py
```

## Environment Variables

Copy the example and update secrets before running:

```bash
cp .env.example .env
```

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL or SQLite connection string |
| `SECRET_KEY` | JWT signing secret (long, random) |
| `ACCESS_TOKEN_EXP_MINUTES` | Access token TTL in minutes |
| `REFRESH_TOKEN_EXP_DAYS` | Refresh token TTL in days |

## Running Locally

```bash
pip install -r requirements.txt
uvicorn mango_api.main:app --reload --host 0.0.0.0 --port 8000
```

OpenAPI docs: `http://localhost:8000/api/docs`

## Core API Flows

### Authentication
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

### Admin Operations (admin only)
- `POST /api/admin/institutions`
- `POST /api/admin/users`
- `POST /api/admin/sensors`

### Sensor Ingestion (admin or institution)
- `POST /api/ingestion/measurements`

### Dashboard Access (authenticated)
- `GET /api/dashboard/measurements`
- `GET /api/dashboard/sensors`
- `GET /api/sensors/status`

## Security Notes

- **No public registration** endpoints are exposed.
- JWT tokens are revoked on logout via the `token_blocklist` table.
- Every request is recorded in the `access_logs` table.
- Sensor measurements are **validated for timestamp, sensor ID, and physical ranges** before persistence.

## Future MQTT Support

The ingestion layer is isolated in `services/ingestion.py` so an MQTT consumer can reuse the same validation and persistence logic.
