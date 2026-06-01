#!/usr/bin/env python3
"""
Import all existing static site files into the uploaded_files DB table.
Run on the VPS host (not inside Docker).  Idempotent — skips records
whose url already exists in the table.

Usage:
  python3 import_static_assets.py | docker exec -i mango_db \
      psql -U mango -d mango -v ON_ERROR_STOP=1
"""
from __future__ import annotations
import os, mimetypes, re, sys

SITE_ROOT  = "/var/www/mango-ui"
IMAGES_DIR = os.path.join(SITE_ROOT, "images", "gallery")
DOCS_DIR   = os.path.join(SITE_ROOT, "docs")

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".svg", ".bmp", ".tiff", ".tif"}
VIDEO_EXTS = {".mp4", ".webm", ".mov", ".m4v", ".avi", ".mkv"}
DOC_EXTS   = {
    ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
    ".md", ".txt", ".csv", ".zip", ".rar", ".7z", ".odt", ".ods", ".odp",
}

# ── helpers ──────────────────────────────────────────────────────────────────

def _ext(path: str) -> str:
    return os.path.splitext(path)[1].lower()

def _kind(path: str) -> str | None:
    e = _ext(path)
    if e in IMAGE_EXTS: return "image"
    if e in VIDEO_EXTS: return "video"
    if e in DOC_EXTS:   return "document"
    return None

def _clean_title(filename: str) -> str:
    name = os.path.splitext(filename)[0]
    # Remove leading numeric index patterns like "hardware_13_"
    name = re.sub(r'^hardware_\d+_', '', name, flags=re.IGNORECASE)
    name = re.sub(r'^(\w+)_\d+_', r'\1 ', name)
    name = name.replace("_", " ").strip()
    return name if name else filename

def _image_category_from_folder(folder: str) -> str:
    folder = folder.lower()
    if "hardware" in folder: return "Hardware"
    if "leader"   in folder: return "Competencias"
    return "Hardware"

def _image_category_from_name(filename: str, folder: str) -> str:
    name = filename.lower()
    folder = folder.lower()
    if "hardware" in folder:
        return "Hardware"
    # leader folder
    if any(k in name for k in ("lider", "leader", "team")):
        return "Líder"
    if any(k in name for k in ("fll", "houston", "inicios", "masterpiece",
                                "superpowered", "motivated", "ecolatas",
                                "submerged", "cargo", "unearthed")):
        return "Competencias"
    return "Competencias"

def _doc_category_from_name(filename: str, rel_path: str) -> str:
    name   = filename.lower()
    path   = rel_path.lower()
    if "fuentes/" in path or "fuentes\\" in path:
        return "Fuentes"
    if name.startswith("bitacora"):
        return "Bitácoras"
    if any(k in name for k in ("electronica", "esquematico", "mango-electronica")):
        return "Electrónica"
    if any(k in name for k in ("pitch", "fs_mango")):
        return "Pitch"
    if any(k in name for k in ("board_", "presentation", "presentacion",
                                "sena_mango", "plantilla_sena", "ej_plantilla",
                                "plantilla_emp", "gc-f-004", "v1_mango.pptx",
                                "latest_pres", "sbtds", "economia_mango",
                                "foro_mango", "problematica_plantilla")):
        return "Presentaciones"
    if any(k in name for k in ("informe_tecnico", "esquema_hardware",
                                "esquema_conexiones", "analisis_cad",
                                "aspectos_criticos", "flujo_datos",
                                "codigos_old", "problemas_dudas",
                                "mango_formalizacion")):
        return "Técnico"
    if any(k in name for k in ("mango.pdf", "mango_english", "m_a_n_g_o.docx",
                                "raw_mango", "sumerged",
                                "early_version", "v1.0_mango", "v1.2_mango",
                                "v1_readme", "marco_teorico", "justificacion",
                                "conclusion", "objetivos", "problematica_drafts",
                                "contexto_general", "mango_v1",
                                "copilacion", "base_presentacion",
                                "earley_readme", "notes",
                                "formato_proyecto", "fuente_guia",
                                "v2_handwritten", "v1_handwritten")):
        return "Investigación"
    return "Investigación"

def _sql_str(s: str | None, max_len: int | None = None) -> str:
    if s is None: return "NULL"
    if max_len and len(s) > max_len: s = s[:max_len]
    return "'" + s.replace("'", "''") + "'"

# ── scan and emit SQL ─────────────────────────────────────────────────────────

records: list[dict] = []

# -- Gallery images & videos --------------------------------------------------
for folder in (os.path.join(IMAGES_DIR, "hardware"), os.path.join(IMAGES_DIR, "leader")):
    if not os.path.isdir(folder):
        continue
    for fname in sorted(os.listdir(folder)):
        fpath = os.path.join(folder, fname)
        if not os.path.isfile(fpath):
            continue
        kind = _kind(fpath)
        if kind not in ("image", "video"):
            continue

        rel = os.path.relpath(fpath, SITE_ROOT).replace("\\", "/")
        public_url = "/" + rel
        size = os.path.getsize(fpath)
        mime = mimetypes.guess_type(fpath)[0] or ""
        title = _clean_title(fname)
        category = (
            _image_category_from_name(fname, folder)
            if kind == "image"
            else "Competencias"
        )
        stored_name = "static:" + rel

        records.append({
            "stored_name":   stored_name,
            "original_name": fname,
            "url":           public_url,
            "kind":          kind,
            "title":         title,
            "category":      category,
            "size":          size,
            "mime_type":     mime,
        })

# -- Docs (recursive) ---------------------------------------------------------
for dirpath, _, filenames in os.walk(DOCS_DIR):
    for fname in sorted(filenames):
        fpath = os.path.join(dirpath, fname)
        if not os.path.isfile(fpath):
            continue
        kind = _kind(fpath)
        if kind != "document":
            continue

        rel = os.path.relpath(fpath, SITE_ROOT).replace("\\", "/")
        public_url = "/" + rel
        size = os.path.getsize(fpath)
        mime = mimetypes.guess_type(fpath)[0] or ""
        title = _clean_title(fname)
        category = _doc_category_from_name(fname, rel)
        stored_name = "static:" + rel

        records.append({
            "stored_name":   stored_name,
            "original_name": fname,
            "url":           public_url,
            "kind":          kind,
            "title":         title,
            "category":      category,
            "size":          size,
            "mime_type":     mime,
        })

# ── emit SQL ──────────────────────────────────────────────────────────────────

print("BEGIN;")
print()
print("-- Static site asset import — idempotent (skips existing urls)")
print()

inserted = 0
for r in records:
    print(
        "INSERT INTO uploaded_files "
        "(stored_name, original_name, url, kind, title, description, category, size, mime_type, uploaded_at) "
        "SELECT "
        f"{_sql_str(r['stored_name'])}, "
        f"{_sql_str(r['original_name'])}, "
        f"{_sql_str(r['url'])}, "
        f"{_sql_str(r['kind'])}, "
        f"{_sql_str(r['title'])}, "
        "NULL, "
        f"{_sql_str(r['category'])}, "
        f"{r['size']}, "
        f"{_sql_str(r['mime_type'], 64)}, "
        "NOW() AT TIME ZONE 'UTC' "
        f"WHERE NOT EXISTS (SELECT 1 FROM uploaded_files WHERE url = {_sql_str(r['url'])});"
    )
    inserted += 1

print()
print("COMMIT;")
print(f"-- {inserted} records processed (existing urls skipped automatically)", file=sys.stderr)
