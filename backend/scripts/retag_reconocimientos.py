#!/usr/bin/env python3
"""One-off: move the 8 "Reconocimiento(s) Comfandi" photos out of the generic
"Progreso" gallery category into the two new Visión y Liderazgo categories.

Run inside the backend container:
  docker exec -it mango_backend python /app/scripts/retag_reconocimientos.py
"""
from __future__ import annotations

import sys

sys.path.insert(0, "/app")
from app import create_app                          # noqa: E402
from app.extensions import db                        # noqa: E402
from app.models.uploaded_file import UploadedFile     # noqa: E402

MEJOR_PROYECTO_IDS = [996, 997, 998]   # Reconocimiento Comfandi - Mejor Proyecto (1/2/3)
HOUSTON_IDS = [993, 994, 995]          # Reconocimiento Comfandi - FLL (1/2/3)
GENERIC_MEJOR_PROYECTO_COVER = 999     # Reconocimientos Comfandi (1) — both plaques together
GENERIC_HOUSTON_COVER = 1000           # Reconocimientos Comfandi (2) — both plaques together

CAT_MEJOR_PROYECTO = "hito-reconocimiento-electronica"
CAT_HOUSTON = "hito-reconocimiento-houston"


def main() -> int:
    app = create_app()
    with app.app_context():
        updates = (
            [(i, CAT_MEJOR_PROYECTO) for i in MEJOR_PROYECTO_IDS + [GENERIC_MEJOR_PROYECTO_COVER]]
            + [(i, CAT_HOUSTON) for i in HOUSTON_IDS + [GENERIC_HOUSTON_COVER]]
        )
        for record_id, category in updates:
            record = db.session.get(UploadedFile, record_id)
            if not record:
                print(f"WARNING: id {record_id} not found, skipping")
                continue
            record.category = category
            print(f"id={record_id} '{record.title}' -> {category}")
        db.session.commit()
        print("Done.")
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
