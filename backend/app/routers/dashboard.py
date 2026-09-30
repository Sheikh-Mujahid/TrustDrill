from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Alert, DataSource, DrillingParameter, OperationalEvent, User, Well
from app.security import get_current_user
from app.services.geo import nearby_wells
from app.services.simulator import simulator

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary")
def summary(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    active = db.query(Well).filter(Well.is_active_demo.is_(True)).first()
    latest = None
    nearby_count = 0
    if active:
        latest = (
            db.query(DrillingParameter)
            .filter(DrillingParameter.well_id == active.id)
            .order_by(DrillingParameter.timestamp.desc())
            .first()
        )
        nearby_count = len(nearby_wells(db, active.latitude, active.longitude, 8.0, exclude_well_id=active.id))
    open_alerts = db.query(func.count(Alert.id)).filter(Alert.status == "open").scalar()
    events = (
        db.query(OperationalEvent)
        .order_by(OperationalEvent.occurred_at.desc())
        .limit(8)
        .all()
    )
    trend = []
    if active:
        trend = (
            db.query(DrillingParameter)
            .filter(DrillingParameter.well_id == active.id)
            .order_by(DrillingParameter.timestamp.desc())
            .limit(60)
            .all()
        )
        trend = list(reversed(trend))
    sources = db.query(DataSource).all()
    return {
        "active_well": {
            "id": active.id,
            "well_uid": active.well_uid,
            "name": active.name,
            "status": active.status,
            "latitude": active.latitude,
            "longitude": active.longitude,
        }
        if active
        else None,
        "live": None
        if not latest
        else {
            "timestamp": latest.timestamp,
            "md_m": latest.md_m,
            "bit_depth_m": latest.bit_depth_m,
            "rop_m_per_hr": latest.rop_m_per_hr,
            "wob_kn": latest.wob_kn,
            "torque_knm": latest.torque_knm,
            "rpm": latest.rpm,
            "spp_kpa": latest.spp_kpa,
            "flow_in_lpm": latest.flow_in_lpm,
            "flow_out_lpm": latest.flow_out_lpm,
            "mud_weight_sg": latest.mud_weight_sg,
            "pit_volume_m3": latest.pit_volume_m3,
            "is_simulated": latest.is_simulated,
            "source": latest.source,
        },
        "simulator": {"running": simulator.running, "scenario": simulator.scenario, "label": "SIMULATED TELEMETRY"},
        "nearby_wells_count": nearby_count,
        "open_alerts": int(open_alerts or 0),
        "recent_events": [
            {
                "id": e.id,
                "title": e.title,
                "event_type": e.event_type,
                "severity": e.severity,
                "md_m": e.md_m,
                "well_id": e.well_id,
            }
            for e in events
        ],
        "trend": [
            {
                "timestamp": t.timestamp,
                "md_m": t.md_m,
                "rop_m_per_hr": t.rop_m_per_hr,
                "torque_knm": t.torque_knm,
                "spp_kpa": t.spp_kpa,
                "pit_volume_m3": t.pit_volume_m3,
                "flow_in_lpm": t.flow_in_lpm,
                "flow_out_lpm": t.flow_out_lpm,
            }
            for t in trend
        ],
        "sources": [{"code": s.code, "name": s.name, "status": s.status} for s in sources],
        "disclaimer": "All dashboard values are from synthetic seed or simulator streams.",
    }
