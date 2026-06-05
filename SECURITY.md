# Security Policy

## Supported Versions

Only the latest release on the `main` branch receives security fixes. We do not backport patches to older versions.

| Version | Supported |
|---------|-----------|
| `2.x` (latest) | Yes |
| `1.x` | No |

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Report vulnerabilities by email to: **histsoluciones@gmail.com**

Please include:
- A description of the vulnerability and its potential impact
- Steps to reproduce the issue or a proof-of-concept
- Affected component (backend, nginx config, edge firmware, etc.)
- Any suggested mitigation

We will acknowledge receipt within 72 hours and aim to issue a fix within 14 days for critical issues. We will credit reporters in the release notes unless anonymity is requested.

## Scope

The following components are in scope:

- Backend REST API (`/backend`)
- nginx reverse proxy configuration (`/nginx`)
- Docker Compose orchestration (`compose.yaml`, `deploy/vps`)
- Authentication and session management
- Sensor ingest endpoints and API key handling
- Edge device firmware (`/edge`, `/bridge`)

Out of scope: third-party dependencies (Flask, PostgreSQL, Grafana). Report those to their respective maintainers.

## Security Design Notes

- Sessions use server-side cookies with `HttpOnly`, `SameSite=Lax`, and `Secure` in production.
- Ingest endpoints are protected by a shared API key (`INGEST_API_KEY`).
- Passwords are hashed with Werkzeug's PBKDF2-HMAC-SHA256.
- API keys stored in the database are plaintext tokens — rotate them on any suspected exposure.
- The admin terminal (`/api/v1/admin/terminal`) exposes SSH to the VPS. Do not expose port 8000 directly.
- `SESSION_SECURE` must be set to `1` in production. The compose file defaults to `1`.
