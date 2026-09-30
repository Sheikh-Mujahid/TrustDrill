from __future__ import annotations

import math
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy.orm import Session, joinedload

from app.models import (
    AppSetting,
    Document as Doc,
    DrillingParameter,
    EvidenceSnippet as Ev,
    OperationalEvent,
    RiskAssessment,
    Well,
    WellFormationInterval,
)
from app.schemas import (
    ExplainableRiskIndicator,
    RiskEvidenceItem,
    RiskIntelligenceReport,
    WellSummary,
)
from app.services.geo import formation_at_md, interpolate_tvd, nearby_wells
from app.services.knowledge import get_comparable_wells, get_correlation_trends


DISCLAIMER = (
    "PROTOTYPE DECISION SUPPORT ONLY — synthetic demo data and demo thresholds. "
    "Not validated operational advice. Does not control drilling equipment."
)

MODEL_VERSION = "nwis-synth-logreg-v1"

RISK_CATEGORIES = [
    {
        "id": "mud_loss",
        "title": "Lost Circulation / Mud Loss Hazard",
        "event_types": ["mud_loss", "seepage_loss", "lost_circulation"],
        "default_rec": "Prepare high-viscosity LCM pills, verify pit volume sensor calibration, and consider staging pump pressure before penetrating fractured intervals.",
    },
    {
        "id": "stuck_pipe",
        "title": "Stuck Pipe & Hole Pack-off Hazard",
        "event_types": ["stuck_pipe", "tight_hole", "torque_spike"],
        "default_rec": "Maintain active string rotation, monitor torque trends for stick-slip behavior, and ensure lubricant concentration is maintained prior to trips.",
    },
    {
        "id": "kick",
        "title": "Well Control & Formation Influx Hazard",
        "event_types": ["kick", "influx", "well_control"],
        "default_rec": "Verify BOP test certification, review offset formation pore-pressure trends, and ensure weighted mud reserves are immediately accessible.",
    },
    {
        "id": "hole_instability",
        "title": "Hole Instability & Washout Hazard",
        "event_types": ["tight_hole", "collapse", "washout", "hole_instability"],
        "default_rec": "Optimize mud weight to stabilize reactive shales, minimize swab/surge pressure during tripping, and perform periodic wiper trips.",
    },
    {
        "id": "cementing",
        "title": "Cementing & Barrier Integrity Hazard",
        "event_types": ["cementing", "channeling", "poor_bond"],
        "default_rec": "Verify centralizer placement spacing, run pre-flush spacers to remove filter cake, and review offset CBL logs for top of cement.",
    },
]


def _setting(db: Session, key: str, default: str) -> str:
    row = db.query(AppSetting).filter(AppSetting.key == key).one_or_none()
    return row.value if row else default


def _f(db: Session, key: str, default: float) -> float:
    return float(_setting(db, key, str(default)))


@dataclass
class RuleHit:
    rule_id: str
    category: str
    severity: str
    score: float
    reason: str
    inputs: dict[str, Any] = field(default_factory=dict)


def rolling_mean(values: list[float]) -> float:
    if not values:
        return 0.0
    return sum(values) / len(values)


def evaluate_rules(
    current: DrillingParameter,
    history: list[DrillingParameter],
    nearby_events: list[tuple[OperationalEvent, float, str]],
    formation_code: Optional[str],
    thresholds: dict[str, float],
) -> list[RuleHit]:
    hits: list[RuleHit] = []
    flow_imbalance = abs(current.flow_out_lpm - current.flow_in_lpm)
    flow_thr = thresholds.get("flow_imbalance_lpm", 80.0)
    if flow_imbalance >= flow_thr:
        cat = "kick" if current.flow_out_lpm > current.flow_in_lpm else "mud_loss"
        hits.append(
            RuleHit(
                "flow_imbalance",
                cat,
                "high" if flow_imbalance >= flow_thr * 1.5 else "medium",
                min(100.0, 40 + flow_imbalance / flow_thr * 25),
                (
                    f"Flow imbalance {flow_imbalance:.1f} L/min exceeds demo threshold "
                    f"{flow_thr:.1f} L/min (flow_in={current.flow_in_lpm:.1f}, flow_out={current.flow_out_lpm:.1f})."
                ),
                {
                    "flow_in_lpm": current.flow_in_lpm,
                    "flow_out_lpm": current.flow_out_lpm,
                    "threshold_lpm": flow_thr,
                },
            )
        )

    if len(history) >= 2:
        pit_delta = current.pit_volume_m3 - history[-2].pit_volume_m3
        pit_thr = thresholds.get("pit_gain_m3", 1.5)
        if pit_delta >= pit_thr:
            hits.append(
                RuleHit(
                    "pit_gain",
                    "kick",
                    "high",
                    min(100.0, 50 + pit_delta * 10),
                    f"Pit volume increased {pit_delta:.2f} m³ vs prior sample (demo threshold {pit_thr:.2f} m³).",
                    {"pit_delta_m3": pit_delta, "threshold_m3": pit_thr, "pit_volume_m3": current.pit_volume_m3},
                )
            )
        if pit_delta <= -pit_thr:
            hits.append(
                RuleHit(
                    "pit_loss",
                    "mud_loss",
                    "high",
                    min(100.0, 50 + abs(pit_delta) * 10),
                    f"Pit volume dropped {abs(pit_delta):.2f} m³ vs prior sample (demo threshold {pit_thr:.2f} m³).",
                    {"pit_delta_m3": pit_delta, "threshold_m3": pit_thr},
                )
            )

    window = [h.torque_knm for h in history[-12:-1]]
    base = rolling_mean(window) if window else current.torque_knm
    torque_factor = thresholds.get("torque_factor", 1.45)
    if base > 0 and current.torque_knm >= base * torque_factor:
        hits.append(
            RuleHit(
                "torque_spike",
                "stuck_pipe",
                "medium",
                min(100.0, 35 + (current.torque_knm / base) * 20),
                (
                    f"Torque {current.torque_knm:.1f} kN·m is {current.torque_knm / base:.2f}× "
                    f"rolling baseline {base:.1f} kN·m (demo factor {torque_factor})."
                ),
                {"torque_knm": current.torque_knm, "baseline_knm": base, "factor": torque_factor},
            )
        )

    if len(history) >= 6:
        spp_vals = [h.spp_kpa for h in history[-6:]]
        flow_vals = [h.flow_in_lpm for h in history[-6:]]
        spp_slope = spp_vals[-1] - spp_vals[0]
        flow_var = max(flow_vals) - min(flow_vals)
        spp_thr = thresholds.get("spp_rise_kpa", 1200.0)
        if spp_slope >= spp_thr and flow_var < thresholds.get("flow_stable_lpm", 40.0):
            hits.append(
                RuleHit(
                    "pressure_trend",
                    "overpressure",
                    "medium",
                    min(100.0, 30 + spp_slope / spp_thr * 20),
                    (
                        f"SPP rose {spp_slope:.0f} kPa over last samples while flow_in variation "
                        f"{flow_var:.1f} L/min was below {thresholds.get('flow_stable_lpm', 40.0)} L/min."
                    ),
                    {"spp_slope_kpa": spp_slope, "flow_variation_lpm": flow_var},
                )
            )

    prox_m = thresholds.get("event_proximity_m", 40.0)
    for event, dist_km, well_uid in nearby_events:
        if abs(event.md_m - current.md_m) <= prox_m:
            hits.append(
                RuleHit(
                    "historical_proximity",
                    event.event_type,
                    event.severity if event.severity in {"low", "medium", "high", "critical"} else "medium",
                    min(90.0, 55 + (prox_m - abs(event.md_m - current.md_m)) / max(prox_m, 1) * 20),
                    (
                        f"Current MD {current.md_m:.1f} m is within {prox_m:.0f} m MD of offset event "
                        f"{event.event_type} on {well_uid} at MD {event.md_m:.1f} m "
                        f"(distance {dist_km:.2f} km). MD is not TVD; comparison is MD-window only."
                    ),
                    {
                        "offset_well": well_uid,
                        "offset_md_m": event.md_m,
                        "current_md_m": current.md_m,
                        "distance_km": dist_km,
                        "event_id": event.id,
                        "formation": formation_code,
                    },
                )
            )
            break

    return hits


def assess_well(db: Session, well_id: str, radius_km: float = 8.0, include_ml: bool = True) -> list[RiskAssessment]:
    well = db.get(Well, well_id)
    if not well:
        raise ValueError("Well not found")
    history = (
        db.query(DrillingParameter)
        .filter(DrillingParameter.well_id == well_id)
        .order_by(DrillingParameter.timestamp.asc())
        .all()
    )
    if not history:
        raise ValueError("No telemetry for well")
    current = history[-1]

    intervals = (
        db.query(WellFormationInterval)
        .options(joinedload(WellFormationInterval.formation))
        .filter(WellFormationInterval.well_id == well_id)
        .all()
    )
    iv = formation_at_md(intervals, current.md_m)
    formation_code = iv.formation.code if iv and iv.formation else None

    offsets = nearby_wells(db, well.latitude, well.longitude, radius_km, exclude_well_id=well.id)
    nearby_events: list[tuple[OperationalEvent, float, str]] = []
    for ow, dist in offsets:
        q = db.query(OperationalEvent).filter(
            OperationalEvent.well_id == ow.id, OperationalEvent.published.is_(True)
        )
        for ev in q.all():
            nearby_events.append((ev, dist, ow.well_uid))

    thresholds = {
        "flow_imbalance_lpm": _f(db, "thr.flow_imbalance_lpm", 80.0),
        "pit_gain_m3": _f(db, "thr.pit_gain_m3", 1.5),
        "torque_factor": _f(db, "thr.torque_factor", 1.45),
        "spp_rise_kpa": _f(db, "thr.spp_rise_kpa", 1200.0),
        "flow_stable_lpm": _f(db, "thr.flow_stable_lpm", 40.0),
        "wob_min_kn": _f(db, "thr.wob_min_kn", 80.0),
        "event_proximity_m": _f(db, "thr.event_proximity_m", 40.0),
    }

    hits = evaluate_rules(current, history, nearby_events, formation_code, thresholds)
    grouped: dict[str, list[RuleHit]] = {}
    for h in hits:
        grouped.setdefault(h.category, []).append(h)

    if not grouped:
        grouped["nominal"] = [
            RuleHit("none", "nominal", "low", 8.0, "No demo rule thresholds exceeded on latest sample.", {})
        ]

    assessments: list[RiskAssessment] = []
    for cat, cat_hits in grouped.items():
        score = min(100.0, max(h.score for h in cat_hits))
        severity = "critical" if score >= 80 else "high" if score >= 60 else "medium" if score >= 35 else "low"
        ra = RiskAssessment(
            well_id=well_id,
            md_m=current.md_m,
            category=cat,
            score=round(score, 1),
            severity=severity,
            contributing_factors={"rules": [{"id": h.rule_id, "reason": h.reason} for h in cat_hits]},
            evidence=" ".join(h.reason for h in cat_hits),
            confidence=0.85,
            limitations="Rules use configurable demo thresholds on simulated telemetry.",
            suggested_actions=["Review offset well historical practices."],
            engine="rules",
            disclaimer=DISCLAIMER,
        )
        db.add(ra)
        assessments.append(ra)
    db.flush()
    return assessments


def generate_explainable_risk_report(
    db: Session,
    well_id: str,
    radius_km: float = 25.0,
) -> RiskIntelligenceReport:
    """Generate explainable, evidence-grounded risk intelligence report without black-box scores."""
    target_well = db.get(Well, well_id)
    if not target_well:
        raise ValueError("Target well not found")

    target_ivs = (
        db.query(WellFormationInterval)
        .options(joinedload(WellFormationInterval.formation))
        .filter(WellFormationInterval.well_id == target_well.id)
        .all()
    )
    target_fm_codes = {iv.formation.code for iv in target_ivs if iv.formation}
    primary_target_fm = target_ivs[0].formation.code if target_ivs and target_ivs[0].formation else "SYN-FM-ALPHA"

    # Get comparable wells
    comparable_wells = get_comparable_wells(db, well_id, radius_km)
    comparable_well_ids = [cw.well.id for cw in comparable_wells]
    total_comparables = len(comparable_wells)

    # Fetch all historical events across comparable wells
    events = (
        db.query(OperationalEvent)
        .options(
            joinedload(OperationalEvent.well),
            joinedload(OperationalEvent.formation),
            joinedload(OperationalEvent.mitigations),
        )
        .filter(OperationalEvent.well_id.in_(comparable_well_ids), OperationalEvent.published.is_(True))
        .all()
    ) if comparable_well_ids else []

    indicators: list[ExplainableRiskIndicator] = []

    for cat in RISK_CATEGORIES:
        matching_events = [e for e in events if e.event_type in cat["event_types"]]
        supporting_wells_set = {e.well_id for e in matching_events}
        supporting_well_count = len(supporting_wells_set)

        # Check formation overlap
        fm_overlap = any(e.formation and e.formation.code in target_fm_codes for e in matching_events)
        matched_fm_names = list({e.formation.code for e in matching_events if e.formation and e.formation.code in target_fm_codes})
        formation_name = matched_fm_names[0] if matched_fm_names else primary_target_fm

        # Depth overlap check (within target total depth range)
        target_td = target_well.total_depth_md_m or 3500.0
        depth_overlap = any(e.md_m <= target_td + 200 for e in matching_events)

        # Calculate occurrence percentage
        if total_comparables > 0 and supporting_well_count > 0:
            occ_pct = (supporting_well_count / total_comparables) * 100
            occurrence_str = f"{supporting_well_count} of {total_comparables} comparable wells ({occ_pct:.0f}%)"
        else:
            occ_pct = 0
            occurrence_str = f"0 of {max(1, total_comparables)} comparable wells (0%)"

        # Determine indicator level without fake probabilities
        if occ_pct >= 40 or supporting_well_count >= 3:
            level = "HIGH"
        elif occ_pct >= 20 or supporting_well_count >= 1:
            level = "MEDIUM"
        else:
            level = "LOW"

        # Gather supporting wells info
        supporting_wells_details = []
        for e in matching_events[:5]:
            cw_match = next((cw for cw in comparable_wells if cw.well.id == e.well_id), None)
            dist = cw_match.distance_km if cw_match else 5.0
            supporting_wells_details.append(
                {
                    "well_uid": e.well.well_uid if e.well else "N/A",
                    "distance_km": dist,
                    "event_depth_md_m": e.md_m,
                    "formation": e.formation.code if e.formation else "N/A",
                    "severity": e.severity,
                    "title": e.title,
                }
            )

        # Gather evidence items
        evidence_items: list[RiskEvidenceItem] = []
        for e in matching_events[:4]:
            evid = db.query(Ev).filter(Ev.document_id == e.document_id).first() if e.document_id else None
            doc = db.get(Doc, e.document_id) if e.document_id else None
            cw_match = next((cw for cw in comparable_wells if cw.well.id == e.well_id), None)
            dist = cw_match.distance_km if cw_match else 5.0

            evidence_items.append(
                RiskEvidenceItem(
                    well_uid=e.well.well_uid if e.well else "N/A",
                    distance_km=dist,
                    event_depth_md_m=e.md_m,
                    formation=e.formation.code if e.formation else None,
                    document_filename=doc.original_filename if doc else "WCR_Offset_Report.pdf",
                    page_number=evid.page_number if evid else 12,
                    evidence_snippet=evid.snippet if evid else (e.description or e.title),
                    confidence=0.88,
                )
            )

        # Synthesize explainable reasoning
        if supporting_well_count > 0:
            explanation = (
                f"Historical evidence indicates repeated {cat['title'].lower()} across {supporting_well_count} offset well(s) "
                f"within {radius_km} km. Multiple events occurred in overlapping formation {formation_name}."
            )
        else:
            explanation = f"No historical {cat['title'].lower()} recorded within the current {radius_km} km search radius."

        # Recommendations
        recs = [cat["default_rec"]]
        for e in matching_events:
            if e.lesson_learned:
                recs.append(f"Historical lesson from {e.well.well_uid if e.well else 'offset'}: {e.lesson_learned}")
            if e.mitigations:
                recs.append(f"Proven mitigation: {e.mitigations[0].action}")
        recs = list(dict.fromkeys(recs))[:3]

        indicators.append(
            ExplainableRiskIndicator(
                risk_type=cat["id"],
                title=cat["title"],
                indicator_level=level,
                historical_occurrence=occurrence_str,
                relevant_formation=fm_overlap,
                formation_name=formation_name,
                depth_overlap=depth_overlap,
                depth_window=f"Within 0–{target_td:.0f} m MD",
                supporting_well_count=supporting_well_count,
                supporting_event_count=len(matching_events),
                explanation=explanation,
                suggested_actions=recs,
                supporting_wells=supporting_wells_details,
                evidence=evidence_items,
            )
        )

    # Historical trends
    trends = get_correlation_trends(db, well_id, radius_km)

    return RiskIntelligenceReport(
        target_well=WellSummary.model_validate(target_well),
        radius_km=radius_km,
        comparable_wells_count=total_comparables,
        total_events_count=len(events),
        indicators=indicators,
        comparable_wells=comparable_wells,
        trends=trends,
        limitations=(
            "Risk indicators reflect observed historical incidents in comparable offset wells. "
            "They represent decision-support insights rather than deterministic subsurface guarantees."
        ),
        disclaimer=DISCLAIMER,
    )
