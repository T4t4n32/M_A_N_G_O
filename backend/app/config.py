import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "data" / "mango.db"

class Config:
    ENV = os.getenv("FLASK_ENV", "development")
    DB_PATH = os.getenv("MANGO_DB_PATH", str(DB_PATH))
    JSON_SORT_KEYS = False
