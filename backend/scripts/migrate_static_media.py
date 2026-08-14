#!/usr/bin/env python3
"""
One-off migration: import the static gallery + leader media (previously
hardcoded in GallerySection.tsx / leaderData.ts) into the uploaded_files
table, so Panel Emma can browse/edit/delete every photo and video on the
site — not just the ones uploaded through the panel.

Idempotent: safe to re-run. Each row gets a deterministic stored_name
derived from its URL, so a second run skips rows that already exist.

Run inside the backend container:
  docker exec -it mango_backend python /app/scripts/migrate_static_media.py
"""
from __future__ import annotations

import hashlib
import json
import os
import sys
from datetime import datetime, timedelta, timezone

sys.path.insert(0, "/app")
from sqlalchemy import text                                       # noqa: E402
from app import create_app                                        # noqa: E402
from app.extensions import db                                     # noqa: E402
from app.models.uploaded_file import UploadedFile                 # noqa: E402

MANIFEST_PATH = os.path.join(os.path.dirname(__file__), "static_media_manifest.json")


def ensure_subcategory_column() -> None:
    """The `subcategory` column was added to the model after uploaded_files
    already existed in production — db.create_all() only creates missing
    tables, not missing columns, so add it manually (idempotent)."""
    dialect = db.engine.dialect.name
    if dialect == "postgresql":
        db.session.execute(text(
            "ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS subcategory VARCHAR(64)"
        ))
        db.session.commit()


def stored_name_for(url: str) -> str:
    ext = os.path.splitext(url)[1] or ".bin"
    digest = hashlib.md5(url.encode("utf-8")).hexdigest()[:20]
    return f"static-{digest}{ext}"


def main() -> int:
    with open(MANIFEST_PATH, encoding="utf-8") as f:
        manifest = json.load(f)

    app = create_app()
    with app.app_context():
        ensure_subcategory_column()

        existing = {r.stored_name for r in UploadedFile.query.with_entities(UploadedFile.stored_name).all()}

        base_time = datetime.now(timezone.utc)
        inserted = 0
        skipped = 0

        for i, item in enumerate(manifest):
            stored_name = stored_name_for(item["url"])
            if stored_name in existing:
                skipped += 1
                continue

            record = UploadedFile(
                stored_name=stored_name,
                original_name=item["original_name"],
                url=item["url"],
                kind=item["kind"],
                title=item["title"] or item["original_name"],
                description=item["description"] or None,
                category=item["category"],
                subcategory=item.get("subcategory"),
                size=item["size"],
                mime_type=item.get("mime_type"),
                # Spaced-apart descending timestamps so `ORDER BY uploaded_at DESC`
                # (used by every listing endpoint) preserves the manifest's order.
                uploaded_at=base_time - timedelta(seconds=i),
            )
            db.session.add(record)
            inserted += 1

        db.session.commit()
        print(f"Inserted {inserted} rows, skipped {skipped} already-migrated rows.")
        print(f"Total manifest entries: {len(manifest)}")
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
