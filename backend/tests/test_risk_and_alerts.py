from datetime import datetime, timezone, timedelta
from app.models import DrillingParameter, OperationalEvent, RiskAssessment, Well, WellFormationInterval, Formation
from app.services.risk_engine import evaluate_rules, RuleHit
from app.services.alerts import fingerprint, md_bin
from app.services.simulator import generate_sample, _scenario_modifiers
from app.services.knowledge import calculate_well_similarity, natural_language_query


class MockWell:
    id = "mock-well-001"
    well_uid = "SYN-WELL-TEST"
    name = "Test Well A"
    field_name = "NWIS Synthetic Block A"
    total_depth_md_m = 3000.0


def make_param(md_m=1200.0, flow_in=1800.0, flow_out=1800.0, pit=28.0, torque=12.0, spp=12000.0, rop=10.0, wob=90.0):
    return DrillingParameter(
        well_id="mock-well-001",
        timestamp=datetime.now(timezone.utc),
        md_m=md_m,
        bit_depth_m=md_m - 0.5,
        rop_m_per_hr=rop,
        wob_kn=wob,
        torque_knm=torque,
        rpm=110.0,
        spp_kpa=spp,
        flow_in_lpm=flow_in,
        flow_out_lpm=flow_out,
        mud_weight_sg=1.20,
        pit_volume_m3=pit,
    )


DEFAULT_THRESHOLDS = {
    "flow_imbalance_lpm": 80.0,
    "pit_gain_m3": 1.5,
    "torque_factor": 1.45,
    "spp_rise_kpa": 1200.0,
    "flow_stable_lpm": 40.0,
    "wob_min_kn": 80.0,
    "event_proximity_m": 40.0,
}


def test_kick_flow_imbalance_and_pit_gain():
    history = [make_param(md_m=1000, pit=28.0), make_param(md_m=1001, pit=28.1)]
    current = make_param(md_m=1002, flow_in=1800, flow_out=1950, pit=30.0)
    hits = evaluate_rules(current, history, [], "SYN-FM-BRAVO", DEFAULT_THRESHOLDS)
    categories = {h.category for h in hits}
    rule_ids = {h.rule_id for h in hits}
    assert "kick" in categories
    assert "flow_imbalance" in rule_ids
    assert "pit_gain" in rule_ids


def test_mud_loss_detection():
    history = [make_param(md_m=1000, pit=28.0), make_param(md_m=1001, pit=28.0)]
    current = make_param(md_m=1002, flow_in=1850, flow_out=1700, pit=25.5)
    hits = evaluate_rules(current, history, [], "SYN-FM-BRAVO", DEFAULT_THRESHOLDS)
    categories = {h.category for h in hits}
    assert "mud_loss" in categories


def test_torque_spike_stuck_pipe_risk():
    history = [make_param(md_m=1000 + i, torque=12.0) for i in range(12)]
    current = make_param(md_m=1012, torque=24.0)
    hits = evaluate_rules(current, history, [], "SYN-FM-CHARLIE", DEFAULT_THRESHOLDS)
    assert any(h.rule_id == "torque_spike" and h.category == "stuck_pipe" for h in hits)


def test_pressure_trend_anomaly():
    history = [make_param(md_m=1000 + i, spp=12000 + i * 250, flow_in=1800) for i in range(6)]
    current = make_param(md_m=1006, spp=13600, flow_in=1800)
    hits = evaluate_rules(current, history, [], "SYN-FM-DELTA", DEFAULT_THRESHOLDS)
    assert any(h.rule_id == "pressure_trend" and h.category == "overpressure" for h in hits)


def test_historical_event_proximity_with_depth_basis():
    mock_event = OperationalEvent(
        id="ev-123",
        well_id="offset-well-002",
        event_type="mud_loss",
        severity="high",
        md_m=1425.0,
        tvd_m=1390.0,
        title="Severe lost circulation in Bravo",
    )
    current = make_param(md_m=1420.0)
    hits = evaluate_rules(
        current,
        [current],
        [(mock_event, 2.4, "SYN-WELL-A03")],
        "SYN-FM-BRAVO",
        DEFAULT_THRESHOLDS,
    )
    prox_hits = [h for h in hits if h.rule_id == "historical_proximity"]
    assert len(prox_hits) == 1
    assert "SYN-WELL-A03" in prox_hits[0].reason
    assert "MD is not TVD" in prox_hits[0].reason


def test_simulator_scenarios():
    well = MockWell()
    loss_sample = generate_sample(well, md_m=1400.0, scenario="losses", tick=5, surveys=[])
    assert loss_sample["is_simulated"] is True
    assert loss_sample["flow_out_lpm"] < loss_sample["flow_in_lpm"]
    assert loss_sample["pit_volume_m3"] < 28.0

    kick_sample = generate_sample(well, md_m=1400.0, scenario="flow_imbalance", tick=5, surveys=[])
    assert kick_sample["flow_out_lpm"] > kick_sample["flow_in_lpm"]
    assert kick_sample["pit_volume_m3"] > 28.0

    torque_sample = generate_sample(well, md_m=1400.0, scenario="torque_spike", tick=5, surveys=[])
    normal_sample = generate_sample(well, md_m=1400.0, scenario="normal", tick=5, surveys=[])
    assert torque_sample["torque_knm"] > normal_sample["torque_knm"]


def test_alert_fingerprint_and_depth_binning():
    bin_1420 = md_bin(1420.0, size=20.0)
    bin_1425 = md_bin(1425.0, size=20.0)
    bin_1450 = md_bin(1450.0, size=20.0)

    assert bin_1420 == bin_1425 == 71
    assert bin_1450 == 72

    fp1 = fingerprint("well-01", "mud_loss", bin_1420)
    fp2 = fingerprint("well-01", "mud_loss", bin_1425)
    fp3 = fingerprint("well-01", "mud_loss", bin_1450)
    fp_other = fingerprint("well-01", "kick", bin_1420)

    assert fp1 == fp2, "Fingerprints in the same 20m depth bin must match for deduplication"
    assert fp1 != fp3, "Fingerprints across different depth bins must differ"
    assert fp1 != fp_other, "Fingerprints for different risk categories must differ"


def test_transparent_well_similarity_calculation():
    target = Well(
        id="target-01",
        well_uid="SYN-WELL-A01",
        field_name="Block A",
        total_depth_md_m=3200.0,
    )
    offset_close = Well(
        id="offset-01",
        well_uid="SYN-WELL-A02",
        field_name="Block A",
        total_depth_md_m=3150.0,
    )
    offset_far = Well(
        id="offset-02",
        well_uid="SYN-WELL-A09",
        field_name="Block B",
        total_depth_md_m=1800.0,
    )

    fm_alpha = Formation(id="fm-1", code="SYN-FM-ALPHA")
    fm_bravo = Formation(id="fm-2", code="SYN-FM-BRAVO")

    target_ivs = [
        WellFormationInterval(formation=fm_alpha, top_md_m=500, bottom_md_m=1500),
        WellFormationInterval(formation=fm_bravo, top_md_m=1500, bottom_md_m=2800),
    ]
    offset_ivs_same = [
        WellFormationInterval(formation=fm_alpha, top_md_m=480, bottom_md_m=1490),
        WellFormationInterval(formation=fm_bravo, top_md_m=1490, bottom_md_m=2750),
    ]

    sim_close = calculate_well_similarity(target, offset_close, dist_km=3.2, radius_km=25.0, target_ivs=target_ivs, offset_ivs=offset_ivs_same)
    sim_far = calculate_well_similarity(target, offset_far, dist_km=24.0, radius_km=25.0, target_ivs=target_ivs, offset_ivs=[])

    assert sim_close.combined_score > sim_far.combined_score
    assert sim_close.distance_similarity > sim_far.distance_similarity
    assert sim_close.formation_similarity >= 0.9
    assert sim_close.label == "Prototype similarity score"
