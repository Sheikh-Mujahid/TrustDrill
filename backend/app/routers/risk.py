from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.models import RiskAssessment, User, Well
from app.schemas import RiskIntelligenceReport, RiskRequest
from app.security import get_current_user
from app.services.audit import write_audit
from app.services.alerts import alerts_from_assessments
from app.services.risk_engine import assess_well, generate_explainable_risk_report

router = APIRouter(prefix="/risk", tags=["risk"])


@router.get("/report", response_model=RiskIntelligenceReport)
def get_risk_report(
    well_id: str,
    radius_km: float = Query(25.0, ge=0.5, le=100.0),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        return generate_explainable_risk_report(db, well_id, radius_km)
    except ValueError as exc:
        raise HTTPException(404, str(exc)) from exc


@router.post("/assess")
def assess(body: RiskRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    well = db.get(Well, body.well_id)
    if not well:
        raise HTTPException(404, "Well not found")
    try:
        report = generate_explainable_risk_report(db, body.well_id, body.radius_km)
        assessments = assess_well(db, body.well_id, body.radius_km, include_ml=body.include_ml)
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc

    write_audit(db, user.id, "risk.assess", "well", well.id, well.well_uid)
    return {
        "disclaimer": report.disclaimer,
        "report": report,
        "indicators": report.indicators,
        "assessments": [
            {
                "id": a.id,
                "category": a.category,
                "score": a.score,
                "severity": a.severity,
                "md_m": a.md_m,
                "confidence": a.confidence,
                "engine": a.engine,
            }
            for a in assessments
        ],
    }


@router.get("/history")
def history(well_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = (
        db.query(RiskAssessment)
        .filter(RiskAssessment.well_id == well_id)
        .order_by(RiskAssessment.timestamp.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "id": r.id,
            "timestamp": r.timestamp,
            "md_m": r.md_m,
            "category": r.category,
            "score": r.score,
            "severity": r.severity,
            "engine": r.engine,
        }
        for r in rows
    ]
