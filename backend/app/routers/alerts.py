from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Alert, AlertAction, User
from app.schemas import AlertActionRequest
from app.security import ENGINEER_ROLES, get_current_user, require_roles
from app.services.audit import write_audit

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("")
def list_alerts(
    status: str | None = None,
    severity: str | None = None,
    well_id: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = db.query(Alert)
    if status:
        q = q.filter(Alert.status == status)
    if severity:
        q = q.filter(Alert.severity == severity)
    if well_id:
        q = q.filter(Alert.well_id == well_id)
    rows = q.order_by(Alert.created_at.desc()).limit(200).all()
    return [
        {
            "id": a.id,
            "well_id": a.well_id,
            "event_type": a.event_type,
            "severity": a.severity,
            "title": a.title,
            "message": a.message,
            "md_m": a.md_m,
            "matched_well_ids": a.matched_well_ids,
            "matched_event_ids": a.matched_event_ids,
            "distance_km": a.distance_km,
            "evidence": a.evidence,
            "recommendation": a.recommendation,
            "status": a.status,
            "created_at": a.created_at,
        }
        for a in rows
    ]


def _act(db: Session, alert_id: str, user: User, action: str, note: str | None):
    alert = db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(404, "Alert not found")
    if action == "acknowledge":
        alert.status = "acknowledged"
    elif action == "resolve":
        alert.status = "resolved"
    db.add(AlertAction(alert_id=alert.id, user_id=user.id, action=action, note=note))
    write_audit(db, user.id, f"alert.{action}", "alert", alert.id, note or "")
    db.commit()
    return {"id": alert.id, "status": alert.status}


@router.post("/{alert_id}/acknowledge")
def ack(
    alert_id: str,
    body: AlertActionRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*ENGINEER_ROLES)),
):
    return _act(db, alert_id, user, "acknowledge", body.note)


@router.post("/{alert_id}/resolve")
def resolve(
    alert_id: str,
    body: AlertActionRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*ENGINEER_ROLES)),
):
    return _act(db, alert_id, user, "resolve", body.note)


@router.get("/{alert_id}/audit")
def audit(alert_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = db.query(AlertAction).filter(AlertAction.alert_id == alert_id).order_by(AlertAction.created_at).all()
    return [{"action": r.action, "note": r.note, "created_at": r.created_at, "user_id": r.user_id} for r in rows]
