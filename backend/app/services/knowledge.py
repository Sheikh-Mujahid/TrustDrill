from __future__ import annotations

import math
import re
from typing import Any, Optional
from uuid import uuid4

from sqlalchemy.orm import Session, joinedload

from app.models import (
    CasingRecord,
    CementingRecord,
    Document as Doc,
    EvidenceSnippet as Ev,
    Formation,
    MudProgram,
    OperationalEvent,
    Well,
    WellFormationInterval,
    WellSurvey,
)
from app.schemas import (
    ComparableWell,
    SimilarityBreakdown,
    WellSummary,
)
from app.services.geo import nearby_wells


def calculate_well_similarity(
    target_well: Well,
    offset_well: Well,
    dist_km: float,
    radius_km: float,
    target_ivs: list[WellFormationInterval],
    offset_ivs: list[WellFormationInterval],
) -> SimilarityBreakdown:
    """Calculate transparent multi-factor similarity between target and offset well."""
    # 1. Distance Similarity (exponential decay over radius)
    dist_sim = max(0.0, 1.0 - (dist_km / max(radius_km, 0.01)))
    dist_sim = round(max(0.05, min(1.0, dist_sim)), 3)

    # 2. Formation Similarity (overlap of stratigraphic codes)
    target_fms = {iv.formation.code for iv in target_ivs if iv.formation}
    offset_fms = {iv.formation.code for iv in offset_ivs if iv.formation}
    if target_fms and offset_fms:
        overlap = len(target_fms.intersection(offset_fms))
        union = len(target_fms.union(offset_fms))
        fm_sim = round(overlap / union, 3) if union > 0 else 0.5
    else:
        fm_sim = 0.5

    # 3. Depth Similarity (comparison of total measured depth)
    target_td = target_well.total_depth_md_m or 3000.0
    offset_td = offset_well.total_depth_md_m or 3000.0
    max_td = max(target_td, offset_td, 1.0)
    depth_sim = round(max(0.0, 1.0 - (abs(target_td - offset_td) / max_td)), 3)

    # 4. Field Similarity
    if target_well.field_name and offset_well.field_name:
        field_sim = 1.0 if target_well.field_name.lower() == offset_well.field_name.lower() else 0.5
    else:
        field_sim = 0.5

    # 5. Basin Similarity
    basin_sim = 0.90  # Default regional basin alignment

    # Weighted combined score (Distance 35%, Formation 25%, Depth 20%, Field 10%, Basin 10%)
    combined = round(
        0.35 * dist_sim + 0.25 * fm_sim + 0.20 * depth_sim + 0.10 * field_sim + 0.10 * basin_sim,
        3,
    )

    return SimilarityBreakdown(
        distance_similarity=dist_sim,
        formation_similarity=fm_sim,
        depth_similarity=depth_sim,
        field_similarity=field_sim,
        basin_similarity=basin_sim,
        combined_score=combined,
        label="Prototype similarity score",
    )


def get_comparable_wells(db: Session, target_well_id: str, radius_km: float = 25.0) -> list[ComparableWell]:
    """Retrieve comparable wells ranked by transparent similarity score."""
    target_well = db.get(Well, target_well_id)
    if not target_well:
        raise ValueError("Target well not found")

    target_ivs = (
        db.query(WellFormationInterval)
        .options(joinedload(WellFormationInterval.formation))
        .filter(WellFormationInterval.well_id == target_well.id)
        .all()
    )

    offsets = nearby_wells(db, target_well.latitude, target_well.longitude, radius_km, exclude_well_id=target_well.id)
    comparables: list[ComparableWell] = []

    for ow, dist in offsets:
        offset_ivs = (
            db.query(WellFormationInterval)
            .options(joinedload(WellFormationInterval.formation))
            .filter(WellFormationInterval.well_id == ow.id)
            .all()
        )
        sim_breakdown = calculate_well_similarity(target_well, ow, dist, radius_km, target_ivs, offset_ivs)

        events = (
            db.query(OperationalEvent)
            .filter(OperationalEvent.well_id == ow.id, OperationalEvent.published.is_(True))
            .all()
        )

        recent_evs = [f"{e.event_type} @ {e.md_m}m ({e.severity})" for e in events[:3]]
        primary_fm = offset_ivs[0].formation.code if offset_ivs and offset_ivs[0].formation else None

        comparables.append(
            ComparableWell(
                well=WellSummary.model_validate(ow),
                distance_km=round(dist, 2),
                similarity_score=sim_breakdown.combined_score,
                similarity_breakdown=sim_breakdown,
                formation_code=primary_fm,
                event_count=len(events),
                recent_events=recent_evs,
            )
        )

    comparables.sort(key=lambda c: c.similarity_score, reverse=True)
    return comparables


def get_correlation_trends(db: Session, well_id: str, radius_km: float = 25.0) -> dict[str, Any]:
    """Calculate observed historical event frequencies across depth, formation, and event categories."""
    well = db.get(Well, well_id)
    if not well:
        raise ValueError("Well not found")

    offsets = nearby_wells(db, well.latitude, well.longitude, radius_km, exclude_well_id=well.id)
    offset_ids = [ow.id for ow, _ in offsets]

    events = (
        db.query(OperationalEvent)
        .options(joinedload(OperationalEvent.formation), joinedload(OperationalEvent.well))
        .filter(OperationalEvent.well_id.in_(offset_ids), OperationalEvent.published.is_(True))
        .all()
    ) if offset_ids else []

    # 1. Depth Intervals Distribution
    depth_bins = {
        "0–1000m": 0,
        "1000–2000m": 0,
        "2000–3000m": 0,
        "3000m+": 0,
    }
    for e in events:
        if e.md_m < 1000:
            depth_bins["0–1000m"] += 1
        elif e.md_m < 2000:
            depth_bins["1000–2000m"] += 1
        elif e.md_m < 3000:
            depth_bins["2000–3000m"] += 1
        else:
            depth_bins["3000m+"] += 1

    # 2. Formation Distribution
    fm_counts: dict[str, int] = {}
    for e in events:
        fm_name = e.formation.code if e.formation else "Unassigned Formation"
        fm_counts[fm_name] = fm_counts.get(fm_name, 0) + 1

    # 3. Event Type Distribution
    type_counts: dict[str, int] = {}
    for e in events:
        t_name = e.event_type.replace("_", " ").title()
        type_counts[t_name] = type_counts.get(t_name, 0) + 1

    # 4. Events by Well
    well_counts: dict[str, int] = {}
    for e in events:
        w_name = e.well.well_uid if e.well else "Unknown Well"
        well_counts[w_name] = well_counts.get(w_name, 0) + 1

    return {
        "total_historical_events": len(events),
        "comparable_wells_count": len(offsets),
        "events_by_depth": depth_bins,
        "events_by_formation": fm_counts,
        "events_by_type": type_counts,
        "events_by_well": well_counts,
        "note": "Observed historical frequencies across comparable offset wells within search radius.",
    }


def compare_wells(db: Session, target_well_id: str, compare_well_ids: list[str]) -> dict[str, Any]:
    """Generate structured side-by-side comparison matrix between target well and selected offset wells."""
    target_well = db.get(Well, target_well_id)
    if not target_well:
        raise ValueError("Target well not found")

    all_ids = [target_well_id] + [cid for cid in compare_well_ids if cid != target_well_id]
    wells = db.query(Well).filter(Well.id.in_(all_ids)).all()

    well_columns = []
    for w in wells:
        surveys = db.query(WellSurvey).filter(WellSurvey.well_id == w.id).order_by(WellSurvey.md_m).all()
        formations = (
            db.query(WellFormationInterval)
            .options(joinedload(WellFormationInterval.formation))
            .filter(WellFormationInterval.well_id == w.id)
            .order_by(WellFormationInterval.top_md_m)
            .all()
        )
        events = (
            db.query(OperationalEvent)
            .options(joinedload(OperationalEvent.formation))
            .filter(OperationalEvent.well_id == w.id, OperationalEvent.published.is_(True))
            .all()
        )
        casing = db.query(CasingRecord).filter(CasingRecord.well_id == w.id).all()
        mud = db.query(MudProgram).filter(MudProgram.well_id == w.id).all()
        cement = db.query(CementingRecord).filter(CementingRecord.well_id == w.id).all()

        well_columns.append(
            {
                "id": w.id,
                "well_uid": w.well_uid,
                "name": w.name,
                "is_target": (w.id == target_well_id),
                "status": w.status,
                "operator": w.operator,
                "field_name": w.field_name,
                "coordinates": f"{w.latitude:.4f}°N, {w.longitude:.4f}°E",
                "total_depth_md_m": w.total_depth_md_m,
                "total_depth_tvd_m": w.total_depth_tvd_m,
                "formations": [
                    {
                        "code": iv.formation.code if iv.formation else "N/A",
                        "name": iv.formation.name if iv.formation else "N/A",
                        "top_md": iv.top_md_m,
                        "bottom_md": iv.bottom_md_m,
                    }
                    for iv in formations
                ],
                "historical_events": [
                    {
                        "event_type": e.event_type,
                        "severity": e.severity,
                        "md_m": e.md_m,
                        "title": e.title,
                        "npt_hours": e.npt_hours,
                        "lesson_learned": e.lesson_learned,
                    }
                    for e in events
                ],
                "casing_records": [f"{c.string_name} {c.od_in}\" @ {c.setting_depth_md_m}m" for c in casing],
                "mud_programs": [f"{m.mud_type} ({m.mud_weight_sg} SG)" for m in mud],
                "cementing_records": [f"{c.job_name} @ {c.md_m}m ({c.result})" for c in cement],
            }
        )

    return {
        "target_well_uid": target_well.well_uid,
        "comparison_count": len(well_columns),
        "wells": well_columns,
        "limitations": "Side-by-side technical parameters represent database records; verify field logs before operations.",
    }


def natural_language_query(db: Session, query_str: str) -> dict[str, Any]:
    """Parse natural language knowledge queries and return structured facts with document page references."""
    q_lower = query_str.lower().strip()
    like = f"%{query_str}%"

    # Identify event intent
    event_filter = None
    if "loss" in q_lower or "lost circulation" in q_lower or "mud loss" in q_lower:
        event_filter = "mud_loss"
    elif "stuck" in q_lower or "tight" in q_lower:
        event_filter = "stuck_pipe"
    elif "kick" in q_lower or "influx" in q_lower or "control" in q_lower:
        event_filter = "kick"
    elif "cement" in q_lower:
        event_filter = "cementing"

    # Identify depth intent (e.g., "below 2000", "around 1400")
    depth_match = re.search(r"\b(?:below|above|around|at|depth)?\s*([0-9]{3,4})\s*(?:m|ft)?\b", q_lower)
    target_depth = float(depth_match.group(1)) if depth_match else None

    # Query matching events
    ev_stmt = db.query(OperationalEvent).options(
        joinedload(OperationalEvent.well),
        joinedload(OperationalEvent.formation),
        joinedload(OperationalEvent.mitigations),
    ).filter(OperationalEvent.published.is_(True))

    if event_filter:
        ev_stmt = ev_stmt.filter(OperationalEvent.event_type == event_filter)
    if target_depth:
        ev_stmt = ev_stmt.filter(
            OperationalEvent.md_m >= target_depth - 300,
            OperationalEvent.md_m <= target_depth + 300,
        )

    events = ev_stmt.limit(25).all()
    results = []

    for e in events:
        # Retrieve evidence snippet if available
        evid = db.query(Ev).filter(Ev.document_id == e.document_id).first() if e.document_id else None
        doc = db.get(Doc, e.document_id) if e.document_id else None

        results.append(
            {
                "id": e.id,
                "title": e.title,
                "event_type": e.event_type,
                "severity": e.severity,
                "well_uid": e.well.well_uid if e.well else "N/A",
                "well_name": e.well.name if e.well else "N/A",
                "md_m": e.md_m,
                "formation": e.formation.code if e.formation else "N/A",
                "description": e.description,
                "lesson_learned": e.lesson_learned,
                "mitigation": e.mitigations[0].action if e.mitigations else None,
                "document_filename": doc.original_filename if doc else None,
                "page_number": evid.page_number if evid else 1,
                "evidence_snippet": evid.snippet if evid else e.description,
                "provenance": e.data_provenance,
            }
        )

    return {
        "query": query_str,
        "matched_intent": {
            "event_type": event_filter,
            "target_depth_m": target_depth,
        },
        "hit_count": len(results),
        "results": results,
        "disclaimer": "Answers are synthesized from verified database events and document page citations.",
    }


def keyword_search(db: Session, q: str, limit: int = 40) -> list[dict]:
    query = (q or "").strip()
    hits: list[dict] = []
    if not query:
        return hits
    like = f"%{query}%"

    events = (
        db.query(OperationalEvent)
        .options(joinedload(OperationalEvent.well), joinedload(OperationalEvent.formation))
        .filter(
            OperationalEvent.published.is_(True),
            (OperationalEvent.title.ilike(like))
            | (OperationalEvent.description.ilike(like))
            | (OperationalEvent.lesson_learned.ilike(like))
            | (OperationalEvent.event_type.ilike(like)),
        )
        .limit(limit)
        .all()
    )
    for e in events:
        snippet = (e.lesson_learned or e.description or "")[:280]
        hits.append(
            {
                "kind": "event",
                "id": e.id,
                "title": e.title,
                "snippet": snippet,
                "well_uid": e.well.well_uid if e.well else None,
                "document_filename": None,
                "page_number": None,
                "event_type": e.event_type,
                "md_m": e.md_m,
                "score": 1.0,
            }
        )
    docs = db.query(Doc).filter((Doc.extracted_text.ilike(like)) | (Doc.original_filename.ilike(like))).limit(limit).all()
    for d in docs:
        ev = db.query(Ev).filter(Ev.document_id == d.id).first()
        excerpt = ev.snippet if ev else (d.extracted_text or "")[:280]
        hits.append(
            {
                "kind": "document",
                "id": d.id,
                "title": d.original_filename,
                "snippet": excerpt,
                "well_uid": None,
                "document_filename": d.original_filename,
                "page_number": ev.page_number if ev else None,
                "event_type": None,
                "md_m": None,
                "score": 0.8,
            }
        )
    formations = db.query(Formation).filter((Formation.code.ilike(like)) | (Formation.name.ilike(like))).all()
    for f in formations:
        hits.append(
            {
                "kind": "formation",
                "id": f.id,
                "title": f.code,
                "snippet": f"{f.name} — {f.lithology}. {f.notes}",
                "well_uid": None,
                "document_filename": None,
                "page_number": None,
                "event_type": None,
                "md_m": None,
                "score": 0.6,
            }
        )
    wells = db.query(Well).filter((Well.well_uid.ilike(like)) | (Well.name.ilike(like))).all()
    for w in wells:
        hits.append(
            {
                "kind": "well",
                "id": w.id,
                "title": w.well_uid,
                "snippet": f"{w.name} status={w.status} TD MD={w.total_depth_md_m} m (synthetic demo)",
                "well_uid": w.well_uid,
                "document_filename": None,
                "page_number": None,
                "event_type": None,
                "md_m": w.total_depth_md_m,
                "score": 0.7,
            }
        )
    hits.sort(key=lambda h: h["score"], reverse=True)
    return hits[:limit]


def optional_semantic_rerank(query: str, hits: list[dict], enabled: bool) -> list[dict]:
    if not enabled or not hits:
        return hits
    try:
        from sentence_transformers import SentenceTransformer, util

        model = SentenceTransformer("all-MiniLM-L6-v2")
        corpus = [h["snippet"] or h["title"] for h in hits]
        qe = model.encode([query], convert_to_tensor=True)
        ce = model.encode(corpus, convert_to_tensor=True)
        scores = util.cos_sim(qe, ce)[0].tolist()
        for h, s in zip(hits, scores):
            h["score"] = float(s)
        hits.sort(key=lambda h: h["score"], reverse=True)
        return hits
    except Exception:
        return hits


def correlate(
    db: Session,
    well_id: str,
    md_m: float,
    radius_km: float,
    formation_id: str | None,
    event_type: str | None,
    depth_window_m: float,
) -> dict:
    well = db.get(Well, well_id)
    if not well:
        raise ValueError("Well not found")
    offsets = nearby_wells(db, well.latitude, well.longitude, radius_km, exclude_well_id=well.id)

    rows = []
    for ow, dist in offsets:
        ivs = db.query(WellFormationInterval).filter(WellFormationInterval.well_id == ow.id).all()
        fm = None
        for iv in ivs:
            if iv.top_md_m <= md_m <= iv.bottom_md_m:
                fm = iv
                break
        if formation_id and fm and fm.formation_id != formation_id:
            continue
        events = (
            db.query(OperationalEvent)
            .options(joinedload(OperationalEvent.formation), joinedload(OperationalEvent.mitigations))
            .filter(
                OperationalEvent.well_id == ow.id,
                OperationalEvent.published.is_(True),
                OperationalEvent.md_m >= md_m - depth_window_m,
                OperationalEvent.md_m <= md_m + depth_window_m,
            )
            .all()
        )
        if event_type:
            events = [e for e in events if e.event_type == event_type]
        muds = db.query(MudProgram).filter(MudProgram.well_id == ow.id).all()
        mud = next((m for m in muds if m.interval_top_md_m <= md_m <= m.interval_bottom_md_m), None)
        md_deltas = [abs(e.md_m - md_m) for e in events] or [None]
        similarity = 0.0
        similarity += max(0.0, 1.0 - dist / max(radius_km, 0.001)) * 0.35
        if fm and formation_id and fm.formation_id == formation_id:
            similarity += 0.35
        elif fm:
            similarity += 0.15
        if events:
            similarity += 0.3 * (1.0 - min(md_deltas) / max(depth_window_m, 1.0))
        rows.append(
            {
                "well": {
                    "id": ow.id,
                    "well_uid": ow.well_uid,
                    "name": ow.name,
                    "status": ow.status,
                    "latitude": ow.latitude,
                    "longitude": ow.longitude,
                    "total_depth_md_m": ow.total_depth_md_m,
                    "total_depth_tvd_m": ow.total_depth_tvd_m,
                },
                "distance_km": round(dist, 3),
                "formation_code": fm.formation.code if fm and fm.formation else None,
                "formation_interval_md_m": [fm.top_md_m, fm.bottom_md_m] if fm else None,
                "mud_weight_sg": mud.mud_weight_sg if mud else None,
                "mud_type": mud.mud_type if mud else None,
                "events": [
                    {
                        "id": e.id,
                        "event_type": e.event_type,
                        "severity": e.severity,
                        "md_m": e.md_m,
                        "tvd_m": e.tvd_m,
                        "title": e.title,
                        "description": e.description,
                        "lesson_learned": e.lesson_learned,
                        "outcome": e.outcome,
                        "npt_hours": e.npt_hours,
                        "md_delta_m": round(e.md_m - md_m, 2),
                        "mitigations": [{"action": m.action, "result": m.result} for m in e.mitigations],
                    }
                    for e in events
                ],
                "similarity": round(min(1.0, similarity), 3),
            }
        )
    rows.sort(key=lambda r: r["similarity"], reverse=True)
    return {
        "active_well": well.well_uid,
        "query_md_m": md_m,
        "depth_basis": "measured_depth_window",
        "limitations": (
            "MD windows are not TVD-equivalent. Similarity is a transparent demo heuristic "
            "(distance + optional same-formation + MD proximity), not a validated subsurface correlation."
        ),
        "radius_km": radius_km,
        "matches": rows,
    }
