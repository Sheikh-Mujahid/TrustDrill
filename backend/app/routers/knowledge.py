from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.models import User
from app.schemas import ComparableWell
from app.security import get_current_user
from app.services.knowledge import (
    compare_wells,
    correlate,
    get_comparable_wells,
    get_correlation_trends,
    keyword_search,
    natural_language_query,
    optional_semantic_rerank,
)

router = APIRouter(tags=["knowledge"])


@router.get("/knowledge/search")
def search(
    q: str = Query("", min_length=0),
    event_type: str | None = None,
    semantic: bool = False,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    hits = keyword_search(db, q)
    if event_type:
        hits = [h for h in hits if h.get("event_type") == event_type or h["kind"] != "event"]
    settings = get_settings()
    if semantic and settings.enable_embeddings:
        hits = optional_semantic_rerank(q, hits, True)
    return {
        "query": q,
        "semantic_applied": bool(semantic and settings.enable_embeddings),
        "hits": hits,
        "note": "Every hit includes a source excerpt where available. Semantic search is optional.",
    }


@router.get("/knowledge/query")
def nl_query(
    q: str = Query(..., min_length=2),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Natural language query engine for drilling problems and historical evidence."""
    return natural_language_query(db, q)


@router.post("/correlation")
def correlation(body: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return correlate(
        db,
        well_id=body["well_id"],
        md_m=float(body["md_m"]),
        radius_km=float(body.get("radius_km", 8)),
        formation_id=body.get("formation_id"),
        event_type=body.get("event_type"),
        depth_window_m=float(body.get("depth_window_m", 50)),
    )


@router.get("/correlation/comparable", response_model=list[ComparableWell])
def list_comparable_wells(
    well_id: str,
    radius_km: float = Query(25.0, ge=0.5, le=100.0),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        return get_comparable_wells(db, well_id, radius_km)
    except ValueError as exc:
        raise HTTPException(404, str(exc)) from exc


@router.get("/correlation/trends")
def correlation_trends(
    well_id: str,
    radius_km: float = Query(25.0, ge=0.5, le=100.0),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        return get_correlation_trends(db, well_id, radius_km)
    except ValueError as exc:
        raise HTTPException(404, str(exc)) from exc


@router.get("/correlation/compare")
def compare_wells_endpoint(
    target_well_id: str,
    compare_well_ids: str = Query(..., description="Comma-separated IDs of offset wells"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    id_list = [i.strip() for i in compare_well_ids.split(",") if i.strip()]
    try:
        return compare_wells(db, target_well_id, id_list)
    except ValueError as exc:
        raise HTTPException(404, str(exc)) from exc
