from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.models import AppSetting, AuditLog, DataSource, Document, User
from app.schemas import SettingUpdate
from app.security import get_current_user, require_roles
from app.services.audit import write_audit

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("")
def get_settings_view(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    s = get_settings()
    return {
        "app": s.app_name,
        "env": s.app_env,
        "demo_auth": s.demo_auth,
        "demo_region": {"name": s.demo_region_name, "lat": s.demo_region_lat, "lon": s.demo_region_lon},
        "ocr": s.enable_ocr,
        "embeddings": s.enable_embeddings,
        "ml": s.enable_ml_model,
        "llm_provider": s.llm_provider or None,
        "keys": {row.key: {"value": row.value, "description": row.description} for row in db.query(AppSetting).all()},
        "disclaimer": "Demo thresholds are not field-safe. Malware scanning of uploads is a production consideration, not implemented here.",
    }


@router.put("/{key}")
def update_setting(
    key: str,
    body: SettingUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("admin")),
):
    row = db.query(AppSetting).filter(AppSetting.key == key).one_or_none()
    if not row:
        raise HTTPException(404, "Unknown setting")
    row.value = body.value
    write_audit(db, user.id, "settings.update", "setting", key, body.value)
    db.commit()
    return {"key": key, "value": row.value}


@router.get("/sources")
def sources(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return [
        {
            "code": s.code,
            "name": s.name,
            "kind": s.kind,
            "status": s.status,
            "details": s.details,
            "last_heartbeat": s.last_heartbeat,
        }
        for s in db.query(DataSource).all()
    ]


@router.get("/audit")
def audit(db: Session = Depends(get_db), user: User = Depends(require_roles("admin"))):
    rows = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(200).all()
    return [
        {
            "created_at": r.created_at,
            "user_id": r.user_id,
            "action": r.action,
            "entity_type": r.entity_type,
            "entity_id": r.entity_id,
            "details": r.details,
        }
        for r in rows
    ]


@router.get("/ingestion")
def ingestion(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    docs = db.query(Document).order_by(Document.created_at.desc()).limit(100).all()
    return [
        {
            "id": d.id,
            "filename": d.original_filename,
            "status": d.status,
            "error": d.error_message,
            "created_at": d.created_at,
            "ocr_used": d.ocr_used,
        }
        for d in docs
    ]
