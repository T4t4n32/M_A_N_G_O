from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from mango_api.api.deps import get_db


router = APIRouter(prefix="/health", tags=["health"])


@router.get("/")
def health(db: Session = Depends(get_db)) -> dict:
    db.execute("SELECT 1")
    return {"status": "ok"}
