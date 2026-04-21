# Contributing to M.A.N.G.O

Thank you for your interest in contributing to M.A.N.G.O — Autonomous Monitoring of Oceanic Management Levels.

This guide covers how to report issues, propose changes, set up a local environment, and submit a pull request. Read it before opening an issue or writing code.

---

## Table of Contents

- [Ways to Contribute](#ways-to-contribute)
- [Before You Start](#before-you-start)
- [Local Environment Setup](#local-environment-setup)
- [Branching and Commits](#branching-and-commits)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Code of Conduct](#code-of-conduct)

---

## Ways to Contribute

**Report a bug.** Open an issue on GitHub. Include steps to reproduce, the expected result, the actual result, and any relevant logs or screenshots.

**Suggest an improvement.** Open an issue labeled "enhancement." Describe the problem it solves, not just the solution.

**Submit a fix or feature.** Fork the repository, make your changes on a branch, and open a pull request. See the process below.

**Improve documentation.** Corrections to READMEs, inline comments, or this file are welcome. Apply the same PR process as code changes.

---

## Before You Start

- Read the [README.md](README.md) to understand the system architecture.
- Check open issues and pull requests to avoid duplicating work.
- For non-trivial changes, open an issue first and describe your intended approach. This avoids wasted effort if the direction is not aligned with the project.

---

## Local Environment Setup

The project has four independent components. Set up only the ones relevant to your contribution.

### Backend (Flask + PostgreSQL)

Requires Python 3.10+, Docker, and Docker Compose.

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

To run the full stack (database, Redis, backend, Nginx):

```bash
cp .env.example .env            # fill in DB_PASSWORD, SECRET_KEY, INGEST_API_KEY
docker compose up -d
```

To run the Flask dev server directly (without Docker):

```bash
python main.py                  # starts on port 5000
```

### Frontend (React + TypeScript)

Requires Node.js 18+.

```bash
cd .lovable_ui/MANGO_PAGE_LOVABLE_V2.0
npm install
npm run dev                     # dev server on port 5173 or 8080
npm run lint                    # run ESLint before committing
npm run test                    # run Vitest
npm run build                   # production build
```

### Gateway (Python serial bridge)

```bash
cd gateway
pip install -r requirements.gateway.txt
python rx_gateway.py
```

### Firmware (Arduino / C++)

Open sketches in Arduino IDE. Current LoRa implementation is under `firmware/LoRa/3th_test/`. Flash the transmitter sketch to the sensor node and the receiver sketch to the Heltec WiFi LoRa 32 V3.

---

## Branching and Commits

### Branch names

Use the format `<type>/<short-description>`:

- `fix/ingest-auth-missing-key`
- `feat/historical-range-endpoint`
- `docs/contributing-setup`
- `chore/remove-legacy-routes`

Branch from `main`. Keep branches short-lived and focused on a single change.

### Commit messages

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short summary>
```

Common types:

| Type | Use for |
| ---- | ------- |
| `feat` | New feature or endpoint |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `chore` | Build, config, or dependency changes |
| `refactor` | Code restructure with no behavior change |
| `test` | Adding or correcting tests |

Examples:

```
fix(backend): raise on missing SECRET_KEY instead of using fallback
feat(frontend): add historical range chart for turbidity
docs(deploy): update VPS README frontend path to V2.0
```

Keep the summary under 72 characters. Use the body for context if needed.

---

## Pull Request Process

1. Fork the repository and create a branch from `main`.
2. Make your changes. Keep each commit focused on one purpose.
3. Run the linter and tests for the component you changed:
   - Frontend: `npm run lint && npm run test`
   - Backend: verify the app starts and `GET /api/v1/health` returns `200`
4. Update `CHANGELOG.md` under an `[Unreleased]` section at the top, using the [existing format](CHANGELOG.md).
5. Open a pull request against `main`. In the description:
   - Explain what changed and why.
   - Reference any related issues (`Closes #N`).
   - Note anything that requires a deploy step or environment variable change.
6. Expect review from the maintainer. Address feedback before the PR is merged.

Do not merge your own pull requests.

---

## Coding Standards

### General

- One logical change per commit.
- Do not upload binaries, build artifacts, or files larger than necessary.
- Do not break existing folder structure without prior discussion.

### Backend (Python)

- Follow the existing module structure under `backend/app/`.
- Keep business logic in `services/`, route handlers thin.
- Do not add auth logic to routes that are not auth routes.
- All new routes must be registered explicitly in `backend/app/routes/__init__.py` — the auto-discovery path is for experimental use only.

### Frontend (TypeScript / React)

- Keep API calls in `src/lib/api.ts`. Do not fetch directly from components.
- Keep auth logic server-side. Do not replicate credential or session handling in the frontend.
- Run `npm run lint` before committing. Do not disable ESLint rules without explanation.

### Firmware (C++ / Arduino)

- Keep transmitter and receiver sketches in separate directories.
- Do not hardcode credentials or server addresses — use constants defined at the top of the file.

---

## Code of Conduct

All contributors are expected to communicate respectfully and give constructive feedback. See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
