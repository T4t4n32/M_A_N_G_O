# Project identity
- M_A_N_G_O is a real-data ocean monitoring project.
- Do not invent sensors, features, endpoints, metrics, or deployment status.
- Keep recommendations practical and production-oriented.

# Architecture rules
- Keep backend/auth/API separate from frontend experimentation.
- Prefer modular structure and clear boundaries.
- Do not move business logic into the frontend.

# Product constraints
- Secure login is required.
- Dashboard-related work must preserve visibility of the 3 core sensors.
- No fake data in demos, docs, or UI copy.

# Documentation style
- Professional tone.
- No emojis in public docs, commits, releases, or notes.
- Prefer concise, implementation-aligned writing.

# Workflow
- Before proposing large changes, inspect the exact target files first.
- Prefer small commit-sized changes.
- Do not scan unrelated files unless explicitly asked.
