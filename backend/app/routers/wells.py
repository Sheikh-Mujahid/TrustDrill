from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from geoalchemy2.elements import WKTElement
from sqlalchemy.orm import Session, joinedload

from app.config import get_settings
from app.database import get_db
from app.models import (
    CasingRecord,
    CementingRecord,
    Document,
    DrillingParameter,
    Formation,
    MudProgram,
    OperationalEvent,
    User,
    Well,
    WellFormationInterval,
    WellSurvey,
)
from app.schemas import (
    CasingOut,
    CementOut,
    DocumentOut,
    EventOut,
    FormationIntervalOut,
    FormationOut,
    MudOut,
    NearbyWell,
    SurveyOut,
    TelemetryOut,
    WellCreate,
    WellSummary,
)
from app.security import WRITE_ROLES, get_current_user, require_roles
from app.services.audit import write_audit
from app.services.geo import nearby_wells

router = APIRouter(prefix="/wells", tags=["wells"])


def _summary(w: Well) -> WellSummary:
    return WellSummary.model_validate(w)


@router.get("", response_model=list[WellSummary])
def list_wells(
    q: Optional[str] = None,
    status: Optional[str] = None,
    field: Optional[str] = None,
    formation: Optional[str] = None,
    operator: Optional[str] = None,
    sort_by: Optional[str] = "well_uid",
    sort_desc: bool = False,
    page: Optional[int] = None,
    page_size: Optional[int] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    stmt = db.query(Well)
    if q:
        like = f"%{q}%"
        stmt = stmt.filter((Well.well_uid.ilike(like)) | (Well.name.ilike(like)))
    if status:
        stmt = stmt.filter(Well.status == status)
    if field:
        stmt = stmt.filter(Well.field_name.ilike(f"%{field}%"))
    if operator:
        stmt = stmt.filter(Well.operator.ilike(f"%{operator}%"))
    if formation:
        stmt = stmt.join(WellFormationInterval).join(Formation).filter(
            (Formation.code.ilike(f"%{formation}%")) | (Formation.name.ilike(f"%{formation}%"))
        ).distinct()

    # Sorting
    if sort_by == "name":
        order_col = Well.name
    elif sort_by == "total_depth_md_m" or sort_by == "depth":
        order_col = Well.total_depth_md_m
    elif sort_by == "status":
        order_col = Well.status
    elif sort_by == "field_name" or sort_by == "field":
        order_col = Well.field_name
    else:
        order_col = Well.well_uid

    if sort_desc:
        stmt = stmt.order_by(order_col.desc())
    else:
        stmt = stmt.order_by(order_col.asc())

    if page is not None and page_size is not None:
        offset = (max(1, page) - 1) * page_size
        stmt = stmt.offset(offset).limit(page_size)

    wells = stmt.all()
    out = []
    for w in wells:
        item = WellSummary.model_validate(w)
        item.event_count = db.query(OperationalEvent).filter(OperationalEvent.well_id == w.id).count()
        item.formation_count = db.query(WellFormationInterval).filter(WellFormationInterval.well_id == w.id).count()
        out.append(item)
    return out


@router.post("", response_model=WellSummary, status_code=201)
def create_well(
    body: WellCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*WRITE_ROLES)),
):
    if db.query(Well).filter(Well.well_uid == body.well_uid).first():
        raise HTTPException(400, "well_uid already exists")
    well = Well(
        well_uid=body.well_uid,
        name=body.name,
        status=body.status,
        latitude=body.latitude,
        longitude=body.longitude,
        location=WKTElement(f"POINT({body.longitude} {body.latitude})", srid=4326),
        total_depth_md_m=body.total_depth_md_m,
        total_depth_tvd_m=body.total_depth_tvd_m,
        data_provenance="USER ENTERED IN DEMO — still not operational OIL data unless independently verified",
    )
    db.add(well)
    write_audit(db, user.id, "well.create", "well", well.well_uid, well.name)
    db.commit()
    db.refresh(well)
    return well


@router.get("/formations", response_model=list[FormationOut])
def list_formations(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Formation).order_by(Formation.code).all()


@router.get("/nearby", response_model=list[NearbyWell])
def get_nearby(
    well_id: Optional[str] = None,
    active_well_id: Optional[str] = None,
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    radius_km: float = Query(8.0, ge=0.1, le=100.0),
    status: Optional[str] = None,
    formation: Optional[str] = None,
    event_type: Optional[str] = None,
    risk_level: Optional[str] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    target_well_id = active_well_id or well_id
    if target_well_id:
        well = db.get(Well, target_well_id)
        if not well:
            raise HTTPException(404, "Well not found")
        lat, lon = well.latitude, well.longitude
        exclude = well.id
    else:
        if lat is None or lon is None:
            raise HTTPException(400, "Provide well_id or lat/lon")
        if lat < -90 or lat > 90 or lon < -180 or lon > 180:
            raise HTTPException(400, "Coordinates out of range (-90..90, -180..180)")
        exclude = None

    rows = nearby_wells(db, lat, lon, radius_km, status=status, exclude_well_id=exclude)
    out = []
    for w, dist in rows:
        # Load formation intervals and events for enrichment
        ivs = (
            db.query(WellFormationInterval)
            .options(joinedload(WellFormationInterval.formation))
            .filter(WellFormationInterval.well_id == w.id)
            .all()
        )
        fm_codes = [iv.formation.code for iv in ivs if iv.formation]
        if formation and formation not in fm_codes and not any(formation.lower() in (iv.formation.name.lower() if iv.formation else "") for iv in ivs):
            continue

        events = (
            db.query(OperationalEvent)
            .filter(OperationalEvent.well_id == w.id, OperationalEvent.published.is_(True))
            .all()
        )
        ev_types = [e.event_type for e in events]
        if event_type and event_type not in ev_types:
            continue

        severities = [e.severity.lower() for e in events]
        highest_sev = "critical" if "critical" in severities else "high" if "high" in severities else "medium" if "medium" in severities else "low" if "low" in severities else None
        if risk_level and risk_level.lower() != (highest_sev or "nominal"):
            continue

        summary = WellSummary.model_validate(w).model_dump()
        summary.update(
            {
                "distance_km": round(dist, 3),
                "formations": fm_codes,
                "recent_events": [e.title for e in events[:3]],
                "highest_severity": highest_sev,
                "formation_count": len(ivs),
                "event_count": len(events),
            }
        )
        item = NearbyWell.model_validate(summary)
        out.append(item)
    return out


@router.get("/{well_id}/formations", response_model=list[FormationIntervalOut])
def well_formations(
    well_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    well = db.get(Well, well_id)
    if not well:
        raise HTTPException(404, "Well not found")
    intervals = (
        db.query(WellFormationInterval)
        .options(joinedload(WellFormationInterval.formation))
        .filter(WellFormationInterval.well_id == well_id)
        .order_by(WellFormationInterval.top_md_m)
        .all()
    )
    return intervals


@router.get("/{well_id}")
def well_detail(well_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    well = db.get(Well, well_id)
    if not well:
        raise HTTPException(404, "Well not found")
    surveys = db.query(WellSurvey).filter(WellSurvey.well_id == well_id).order_by(WellSurvey.md_m).all()
    intervals = (
        db.query(WellFormationInterval)
        .options(joinedload(WellFormationInterval.formation))
        .filter(WellFormationInterval.well_id == well_id)
        .order_by(WellFormationInterval.top_md_m)
        .all()
    )
    events = (
        db.query(OperationalEvent)
        .options(joinedload(OperationalEvent.formation), joinedload(OperationalEvent.mitigations))
        .filter(OperationalEvent.well_id == well_id)
        .order_by(OperationalEvent.md_m)
        .all()
    )
    casing = db.query(CasingRecord).filter(CasingRecord.well_id == well_id).all()
    mud = db.query(MudProgram).filter(MudProgram.well_id == well_id).all()
    cement = db.query(CementingRecord).filter(CementingRecord.well_id == well_id).all()
    documents = db.query(Document).filter(Document.well_id == well_id).all()
    return {
        "well": WellSummary.model_validate(well),
        "surveys": [SurveyOut.model_validate(s) for s in surveys],
        "formations": [FormationIntervalOut.model_validate(i) for i in intervals],
        "events": [
            {
                **EventOut.model_validate(e).model_dump(),
                "mitigations": [{"action": m.action, "result": m.result, "sequence": m.sequence} for m in e.mitigations],
            }
            for e in events
        ],
        "casing": [CasingOut.model_validate(c) for c in casing],
        "mud": [MudOut.model_validate(m) for m in mud],
        "cement": [CementOut.model_validate(c) for c in cement],
        "documents": [DocumentOut.model_validate(d) for d in documents],
        "depth_note": "MD and TVD are stored separately. Do not treat them as equivalent.",
    }


@router.get("/{well_id}/events", response_model=list[EventOut])
def well_events(
    well_id: str,
    event_type: Optional[str] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = db.query(OperationalEvent).options(joinedload(OperationalEvent.formation)).filter(
        OperationalEvent.well_id == well_id
    )
    if event_type:
        q = q.filter(OperationalEvent.event_type == event_type)
    return q.order_by(OperationalEvent.md_m).all()


@router.get("/{well_id}/telemetry", response_model=list[TelemetryOut])
def telemetry(
    well_id: str,
    limit: int = Query(200, ge=1, le=2000),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    rows = (
        db.query(DrillingParameter)
        .filter(DrillingParameter.well_id == well_id)
        .order_by(DrillingParameter.timestamp.desc())
        .limit(limit)
        .all()
    )
    return list(reversed(rows))


@router.get("/{well_id}/timeline")
def timeline(well_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    events = db.query(OperationalEvent).filter(OperationalEvent.well_id == well_id).order_by(OperationalEvent.occurred_at).all()
    return [
        {
            "at": e.occurred_at,
            "md_m": e.md_m,
            "kind": e.event_type,
            "title": e.title,
            "severity": e.severity,
        }
        for e in events
    ]
