from datetime import datetime, timezone

from fastapi import APIRouter
from sqlalchemy import text

from app.config import get_settings
from app.database import engine

router = APIRouter(tags=["health"])


@router.get("/health")
def health():
    db_ok = False
    postgis = False
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            db_ok = True
            ver = conn.execute(text("SELECT PostGIS_Version()")).scalar()
            postgis = bool(ver)
    except Exception:
        db_ok = False
    settings = get_settings()
    return {
        "status": "ok" if db_ok else "degraded",
        "app": settings.app_name,
        "env": settings.app_env,
        "database": db_ok,
        "postgis": postgis,
        "ocr": settings.enable_ocr,
        "embeddings": settings.enable_embeddings,
        "ml": settings.enable_ml_model,
        "llm_configured": bool(settings.llm_provider and settings.llm_api_key),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "disclaimer": "Demo prototype. Synthetic data only. No OIL/eRTMAC live integration.",
    }
