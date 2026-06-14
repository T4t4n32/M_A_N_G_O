"""
Security utilities — password hashing helpers.

The application uses werkzeug's pbkdf2-based hashing (via MangoUser.set_password /
check_password). This module exposes thin wrappers kept for any internal tooling
that imports from here directly.

JWT and bcrypt integrations were removed: flask_jwt_extended is not installed and
mixing hashing backends caused silent failures.
"""
from __future__ import annotations

from werkzeug.security import check_password_hash, generate_password_hash


def hash_password(password: str) -> str:
    return generate_password_hash(password)


def verify_password(password: str, hashed: str) -> bool:
    return check_password_hash(hashed, password)
