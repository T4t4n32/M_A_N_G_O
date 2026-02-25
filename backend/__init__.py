"""Backend package entry.

Keep this file minimal.
- It only re-exports create_app so any old imports keep working.
"""

from app import create_app  # noqa: F401

__all__ = ["create_app"]
