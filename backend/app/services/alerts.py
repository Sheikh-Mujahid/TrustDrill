from __future__ import annotations

import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy.orm import Session, joinedload

from app.models import Alert, AlertAction, OperationalEvent, RiskAssessment, Well
from app.services.audit import write_audit
from app.services.geo import nearby_wells


COOLDOWN = timedelta(minutes=8)


def fingerprint(well_id: str, event_type: str, md_bin: int) -> str:
    raw = f"{well_id}|{event_type}|{md_bin}"
    return hashlib.sha256(raw.encode()).hexdigest()[:32]


def md_bin(md_m: float, size: float = 20.0) -> int:
    return int(md_m // size)


def alerts_from_assessments(
    db: Session,
    well: Well,
    assessments: list[RiskAssessment],
    radius_km: float,
    user_id: Optional[str] = None,
) -> list[Alert]:
    created: list[Alert] = []
    now = datetime.now(timezone.utc)
    for ra in assessments:
        if ra.category == "nominal" or ra.score < 35:
            continue
        fp = fingerprint(well.id, ra.category, md_bin(ra.md_m))
        existing = (
            db.query(Alert)
            .filter(Alert.fingerprint == fp, Alert.status.in_(["open", "acknowledged"]))
            .one_or_none()
        )
        if existing:
            if existing.cooldown_until and existing.cooldown_until > now:
                continue
            existing.cooldown_until = now + COOLDOWN
            continue
        recent = (
            db.query(Alert)
            .filter(Alert.fingerprint == fp, Alert.created_at >= now - COOLDOWN)
            .one_or_none()
        )
        if recent:
            continue

        matched_wells: list[str] = []
        dist = None
        offsets = nearby_wells(db, well.latitude, well.longitude, radius_km, exclude_well_id=well.id)
        if ra.matched_event_ids:
            events = db.query(OperationalEvent).filter(OperationalEvent.id.in_(ra.matched_event_ids)).all()
            well_ids = {e.well_id for e in events}
            for ow, d in offsets:
                if ow.id in well_ids:
                    matched_wells.append(ow.id)
                    dist = d
                    break

        alert = Alert(
            well_id=well.id,
            risk_assessment_id=ra.id,
            event_type=ra.category,
            severity=ra.severity,
            title=f"{ra.category.replace('_', ' ').title()} indicator at MD {ra.md_m:.1f} m",
            message=ra.evidence,
            md_m=ra.md_m,
            matched_well_ids=matched_wells,
            matched_event_ids=ra.matched_event_ids,
            distance_km=dist,
            evidence=ra.evidence,
            recommendation="; ".join(ra.suggested_actions),
            status="open",
            fingerprint=fp,
            cooldown_until=now + COOLDOWN,
        )
        db.add(alert)
        db.flush()
        db.add(AlertAction(alert_id=alert.id, user_id=user_id, action="created", note="auto from risk engine"))
        write_audit(db, user_id, "alert.create", "alert", alert.id, alert.title)
        created.append(alert)
    return created
