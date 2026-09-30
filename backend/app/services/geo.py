import math
from typing import Optional

from geoalchemy2.functions import ST_DWithin, ST_Distance, ST_GeogFromText
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models import Well


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlmb / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def wkt_point(lon: float, lat: float) -> str:
    return f"SRID=4326;POINT({lon} {lat})"


def nearby_wells(
    db: Session,
    latitude: float,
    longitude: float,
    radius_km: float,
    status: Optional[str] = None,
    exclude_well_id: Optional[str] = None,
) -> list[tuple[Well, float]]:
    """PostGIS ST_DWithin on geography (meters). Distance returned in km."""
    try:
        geog = ST_GeogFromText(wkt_point(longitude, latitude))
        radius_m = radius_km * 1000.0
        dist_m = ST_Distance(Well.location, geog)
        stmt = select(Well, dist_m.label("dist_m")).where(ST_DWithin(Well.location, geog, radius_m))
        if status:
            stmt = stmt.where(Well.status == status)
        if exclude_well_id:
            stmt = stmt.where(Well.id != exclude_well_id)
        stmt = stmt.order_by(dist_m)
        rows = db.execute(stmt).all()
        return [(row[0], float(row[1]) / 1000.0) for row in rows]
    except Exception:
        query = db.query(Well)
        if status:
            query = query.filter(Well.status == status)
        if exclude_well_id:
            query = query.filter(Well.id != exclude_well_id)
        all_wells = query.all()
        results: list[tuple[Well, float]] = []
        for w in all_wells:
            d = haversine_km(latitude, longitude, w.latitude, w.longitude)
            if d <= radius_km:
                results.append((w, d))
        results.sort(key=lambda x: x[1])
        return results


def interpolate_tvd(surveys: list, md_m: float) -> Optional[float]:
    """Linear interpolation of TVD vs MD from survey stations. Not a directional survey model."""
    if not surveys:
        return None
    pts = sorted(((s.md_m, s.tvd_m) for s in surveys), key=lambda x: x[0])
    if md_m <= pts[0][0]:
        return pts[0][1]
    if md_m >= pts[-1][0]:
        return pts[-1][1]
    for (m0, t0), (m1, t1) in zip(pts, pts[1:]):
        if m0 <= md_m <= m1:
            if m1 == m0:
                return t0
            frac = (md_m - m0) / (m1 - m0)
            return t0 + frac * (t1 - t0)
    return None


def formation_at_md(intervals: list, md_m: float):
    for iv in intervals:
        if iv.top_md_m <= md_m <= iv.bottom_md_m:
            return iv
    return None


def convert_length(value: float, from_unit: str, to_unit: str) -> float:
    table = {"m": 1.0, "ft": 0.3048, "km": 1000.0}
    if from_unit not in table or to_unit not in table:
        raise ValueError(f"Unsupported length units: {from_unit}->{to_unit}")
    meters = value * table[from_unit]
    return meters / table[to_unit]
