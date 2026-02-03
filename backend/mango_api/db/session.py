from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from mango_api.core.config import settings

engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
