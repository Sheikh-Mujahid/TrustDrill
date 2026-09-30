from datetime import datetime, timezone

from app.models import DrillingParameter
from app.services.extraction import parse_fields
from app.services.geo import convert_length, haversine_km, interpolate_tvd
from app.services.alerts import fingerprint, md_bin
from app.services.risk_engine import evaluate_rules


class S:
    def __init__(self, **kwargs):
        self.__dict__.update(kwargs)


def test_haversine_zero():
    assert haversine_km(27.47, 95.32, 27.47, 95.32) < 0.001


def test_haversine_known_offset():
    # ~1 km north
    d = haversine_km(27.47, 95.32, 27.47 + (1 / 110.574), 95.32)
    assert 0.9 < d < 1.1


def test_convert_length():
    assert abs(convert_length(100, "ft", "m") - 30.48) < 0.01
    assert abs(convert_length(1, "km", "m") - 1000) < 0.001


def test_interpolate_tvd():
    surveys = [S(md_m=0, tvd_m=0), S(md_m=100, tvd_m=98)]
    assert interpolate_tvd(surveys, 50) == 49
    assert interpolate_tvd([], 10) is None


def test_extract_does_not_invent():
    fields = {f.field_name: f for f in parse_fields("random notes with no well identifiers")}
    assert fields["well_uid"].value is None
    assert fields["md_m"].value is None
    assert fields["event_type"].value is None


def test_extract_fields():
    text = """
    Well: SYN-WELL-A03
    Date: 2024-05-12
    MD: 1420.0 m
    TVD: 1390.0 m
    Formation: SYN-FM-BRAVO
    Event: mud loss / lost circulation
    NPT: 6.5 hours
    Mitigation: pumped LCM pills
    Outcome: circulation regained
    Lesson learned: stage LCM before Bravo.
    """
    fields = {f.field_name: f for f in parse_fields(text)}
    assert fields["well_uid"].value == "SYN-WELL-A03"
    assert fields["md_m"].value == "1420.00"
    assert fields["formation"].value == "SYN-FM-BRAVO"
    assert fields["event_type"].value == "mud_loss"
    assert fields["md_m"].snippet


def test_extract_md_feet_converted():
    fields = {f.field_name: f for f in parse_fields("MD: 100 ft SYN-WELL-A01")}
    assert abs(float(fields["md_m"].value) - 30.48) < 0.02


def test_flow_imbalance_rule():
    now = datetime.now(timezone.utc)
    current = DrillingParameter(
        well_id="x",
        timestamp=now,
        md_m=1000,
        bit_depth_m=999,
        rop_m_per_hr=10,
        wob_kn=90,
        torque_knm=12,
        rpm=110,
        spp_kpa=12000,
        flow_in_lpm=1800,
        flow_out_lpm=1950,
        mud_weight_sg=1.2,
        pit_volume_m3=28,
    )
    hits = evaluate_rules(
        current,
        [current],
        [],
        "SYN-FM-BRAVO",
        {
            "flow_imbalance_lpm": 80.0,
            "pit_gain_m3": 1.5,
            "torque_factor": 1.45,
            "spp_rise_kpa": 1200.0,
            "flow_stable_lpm": 40.0,
            "wob_min_kn": 80.0,
            "event_proximity_m": 40.0,
        },
    )
    assert any(h.rule_id == "flow_imbalance" and h.category == "kick" for h in hits)


def test_mud_loss_rule():
    now = datetime.now(timezone.utc)
    current = DrillingParameter(
        well_id="x",
        timestamp=now,
        md_m=1000,
        bit_depth_m=999,
        rop_m_per_hr=10,
        wob_kn=90,
        torque_knm=12,
        rpm=110,
        spp_kpa=12000,
        flow_in_lpm=1800,
        flow_out_lpm=1650,
        mud_weight_sg=1.2,
        pit_volume_m3=28,
    )
    hits = evaluate_rules(
        current,
        [current],
        [],
        None,
        {
            "flow_imbalance_lpm": 80.0,
            "pit_gain_m3": 1.5,
            "torque_factor": 1.45,
            "spp_rise_kpa": 1200.0,
            "flow_stable_lpm": 40.0,
            "wob_min_kn": 80.0,
            "event_proximity_m": 40.0,
        },
    )
    assert any(h.category == "mud_loss" for h in hits)


def test_alert_fingerprint_stable():
    assert fingerprint("w1", "kick", md_bin(1420)) == fingerprint("w1", "kick", md_bin(1425))
    assert fingerprint("w1", "kick", md_bin(1420)) != fingerprint("w1", "kick", md_bin(1450))


def test_safe_filename_logic():
    from app.routers.documents import _safe_name
    import pytest
    from fastapi import HTTPException

    assert _safe_name("report.pdf") == "report.pdf"
    with pytest.raises(HTTPException):
        _safe_name("../etc/passwd")
