# Claude Code Project Setup — M.A.N.G.O.

This document contains all templates needed to complete the `.claude/` directory structure.
Run the commands below from within the project root using Claude Code CLI (`claude`).

## Required structure

```
.claude/
  settings.json          (already exists)
  settings.local.json    (already exists — do not commit)
  rules/
    code-style.md
    testing.md
    api-conventions.md
  commands/
    review.md
    fix-issue.md
  skills/
    deploy/
      SKILL.md
      deploy-config.md
  agents/
    code-reviewer.md
    security-auditor.md
  hooks/
    validate-bash.sh
```

---

## .claude/rules/code-style.md

```md
# Code Style — M.A.N.G.O.

## General

- Professional tone in all comments, docstrings, and variable names.
- No emojis in source files, docstrings, or commit messages.
- Prefer explicit over implicit.

## Python (Backend)

- Follow PEP 8.
- Use 4-space indentation. No tabs.
- Maximum line length: 100 characters.
- All functions and classes must have docstrings.
- Use type hints on all function signatures.
- Prefer f-strings over .format() or %.
- Imports: stdlib first, third-party second, local last. Each group separated by a blank line.

### Flask-specific

- One blueprint per file in routes/.
- No business logic in route handlers — delegate to services/.
- Return jsonify() for all API responses. Never return raw dicts.
- Use url_prefix="/api" on all blueprints.

## Arduino / C++ (Firmware)

- Use camelCase for variables and functions.
- Use SCREAMING_SNAKE_CASE for constants.
- Comment each sensor read block with the sensor name and units.
- Each firmware version gets its own folder, named SensorName_Vx.y.z.

## HTML / CSS / JavaScript (Frontend)

- No frameworks at this stage. Vanilla JS only.
- Use const and let. Never use var.
- Use async/await over raw .then() chains.
- CSS: BEM-like naming. Keep styles scoped.

## Git

- Commit messages: imperative mood, lowercase, under 72 chars.
  - Correct: add turbidity endpoint to sensors route
  - Incorrect: Added turbidity! ✅
- No merge commits on main. Use rebase.
```

---

## .claude/rules/testing.md

```md
# Testing Conventions — M.A.N.G.O.

## Scope

Testing applies to the Flask backend API. Firmware testing is manual and documented
separately in firmware/sensors/*/experiment notes.

## Backend Testing

### Framework

- Use pytest for all backend tests.
- Test files must be located in backend/tests/.
- File naming: test_<module>.py (e.g., test_sensors.py).

### Coverage requirements

- Every endpoint in routes/ must have at least one passing test.
- Authentication paths (login, logout, unauthorized access) must be tested explicitly.
- Tests must not depend on external hardware (serial device) or a live sensor.

### Fixtures

- Use pytest fixtures to create the Flask test client.
- Mock serial reads using unittest.mock.patch.
- Never call random in test assertions — test structure and HTTP status codes, not values.

### Assertions

- Assert HTTP status codes first.
- Assert Content-Type: application/json on all API responses.
- Assert required keys present in JSON response body.

## What not to test

- Do not write tests that assert specific sensor values (they change).
- Do not test the venv or third-party libraries.
- Do not test CLAUDE.md or documentation files.

## Running tests

cd backend
source venv/bin/activate
pytest tests/ -v
```

---

## .claude/rules/api-conventions.md

```md
# API Conventions — M.A.N.G.O.

## Base URL

All API routes are prefixed with /api.

## Authentication

- Login is required before accessing any sensor data endpoint.
- Session-based authentication (flask.session).
- Unauthenticated requests must return 401 Unauthorized.
- Login endpoint: POST /api/login
- Logout endpoint: GET /api/logout

## Endpoints

### Naming

- Use lowercase, hyphen-separated resource names: /api/sensor-data, not /api/sensorData.
- Group by resource: /api/ph/latest, /api/temperature/latest, /api/turbidity/latest.
- Do not abbreviate sensor names in routes.

### Response format

All responses must be JSON:

{
  "value": 7.4,
  "unit": "pH",
  "timestamp": "2026-01-05T12:00:00Z"
}

Error responses:

{
  "error": "unauthorized"
}

- timestamp must be ISO 8601 format, UTC, with Z suffix.
- value must be a float, rounded to 2 decimal places.
- Never return null for value — omit the field or return an error instead.

## Core sensor endpoints (protected — must remain accessible)

- GET /api/ph/latest
- GET /api/temperature/latest
- GET /api/turbidity/latest
```

---

## .claude/commands/review.md

```md
Review the target file or module for:

1. Adherence to .claude/rules/code-style.md
2. Correct separation of concerns (no business logic in routes/)
3. Missing type hints or docstrings
4. Hardcoded credentials or secrets
5. Any fake or placeholder data in production paths

Report findings grouped by severity: critical, warning, suggestion.
Do not rewrite files — only report.
```

---

## .claude/commands/fix-issue.md

```md
Given an issue description or error output:

1. Identify the affected file(s) using Glob and Grep before proposing changes.
2. Confirm the root cause by reading the relevant section of the file.
3. Propose the minimal change that resolves the issue.
4. Do not touch unrelated files.
5. After the fix, describe what was changed and why.

If the issue involves the serial device or sensor data, do not simulate or fake the data.
```

---

## .claude/skills/deploy/SKILL.md

```md
# Deploy Skill — M.A.N.G.O.

Use this skill when deploying the backend to a production or staging environment.

## Pre-deploy checklist

1. Confirm FLASK_DEBUG=False in production config.
2. Confirm SECRET_KEY is set via environment variable, not hardcoded.
3. Confirm requirements.txt is up to date (pip freeze > requirements.txt).
4. Run backend tests: pytest backend/tests/ -v.
5. Confirm serial port configuration matches target hardware.

## Deploy steps

1. Read deploy-config.md for environment-specific settings.
2. Install dependencies: pip install -r backend/requirements.txt.
3. Start with a production WSGI server (gunicorn or waitress).
4. Verify /api/health returns 200 before serving traffic.

## Do not

- Deploy with debug=True.
- Expose the serial device port publicly.
- Skip the health check verification step.
```

---

## .claude/skills/deploy/deploy-config.md

```md
# Deploy Configuration — M.A.N.G.O.

## Environments

### Development (local)

- FLASK_DEBUG=1
- FLASK_ENV=development
- PORT=5000
- Serial: /dev/ttyACM0 (Linux) or COM port (Windows)

### Production (future)

- FLASK_DEBUG=0
- FLASK_ENV=production
- PORT=8000 (behind nginx or similar)
- WSGI: gunicorn backend/main:app
- Serial: confirm physical port at deployment site

## Environment variables (never hardcode)

- SECRET_KEY
- SERIAL_PORT
- FLASK_DEBUG
- DATABASE_URL (future)

## Notes

- This project does not use containerization yet.
- A CI/CD pipeline is planned. See STATUS.md for current deployment status.
```

---

## .claude/agents/code-reviewer.md

```md
# Code Reviewer Agent — M.A.N.G.O.

## Role

Isolated code review context. Reviews changes without modifying files.

## Tools

Read, Glob, Grep

## Instructions

You are a code reviewer for the M.A.N.G.O. ocean monitoring project.

When reviewing code:

1. Read .claude/rules/code-style.md and .claude/rules/api-conventions.md first.
2. Check the specific file(s) identified by the user.
3. Flag any violations of project rules.
4. Flag any hardcoded credentials, secrets, or fake/simulated sensor values in production paths.
5. Flag missing authentication guards on API endpoints.
6. Report findings in this format:

   CRITICAL: description of the problem (file:line)
   WARNING: description (file:line)
   SUGGESTION: description (file:line)

7. Do not propose rewrites. Report only.
8. Do not scan unrelated files.
```

---

## .claude/agents/security-auditor.md

```md
# Security Auditor Agent — M.A.N.G.O.

## Role

Security-focused audit agent. Read-only. Reports vulnerabilities and risks.

## Tools

Read, Glob, Grep

## Instructions

You are a security auditor for the M.A.N.G.O. project.

When auditing:

1. Check all files in backend/ for:
   - Hardcoded credentials or secrets (SECRET_KEY, passwords, tokens).
   - Unprotected API endpoints (missing session/auth checks).
   - Unrestricted CORS origins.
   - Input validation gaps (missing type checks, no sanitization).
   - Use of debug=True in non-development contexts.

2. Check firmware/ for:
   - Hardcoded network credentials (SSID, passwords).
   - Unencrypted data transmission.

3. Report findings grouped by severity:
   - CRITICAL: Immediate action required.
   - HIGH: Fix before next release.
   - MEDIUM: Fix in upcoming sprint.
   - LOW: Best practice recommendation.

4. Do not modify any files. Audit only.
5. Cross-reference STATUS.md for known open issues before reporting duplicates.
```

---

## .claude/hooks/validate-bash.sh

```bash
#!/bin/bash
# Pre-tool hook: validate bash commands before execution
# Blocks destructive or out-of-scope operations.

COMMAND="$1"

# Block recursive deletions
if echo "$COMMAND" | grep -qE "rm -rf|rm -r"; then
  echo "BLOCKED: recursive delete not allowed via agent. Run manually if intentional." >&2
  exit 1
fi

# Block writes to venv
if echo "$COMMAND" | grep -qE "venv/"; then
  echo "BLOCKED: do not modify venv directly. Use pip install." >&2
  exit 1
fi

# Block git push without explicit user intent
if echo "$COMMAND" | grep -qE "^git push"; then
  echo "BLOCKED: git push must be run manually." >&2
  exit 1
fi

exit 0
```

---

## How to create these files via Claude Code CLI

Open a terminal in the project root and run:

```bash
# Start Claude Code
claude

# Then ask:
# "Create the .claude/ subdirectory structure for this project
#  following the templates in docs/claude-config.md"
```

Claude Code CLI can write to .claude/ directly. Cowork cannot (protected by design).
