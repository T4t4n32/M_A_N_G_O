# backend/app/extensions.py
import os
import redis
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()
redis_client = None


def init_redis():
    global redis_client
    url = os.getenv("REDIS_URL", "").strip()
    if not url:
        redis_client = None
        return
    redis_client = redis.from_url(url, decode_responses=True)
