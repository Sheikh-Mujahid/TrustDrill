from __future__ import annotations

import math
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path
from uuid import uuid5, NAMESPACE_URL

from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import SessionLocal, engine, ensure_postgis, Base
from app.models import (
    AppSetting,
    CasingRecord,
    CementingRecord,
    DataSource,
    Document,
    DocumentExtraction,
    DrillingParameter,
    EvidenceSnippet,
    Formation,
    MitigationAction,
    MudProgram,
    OperationalEvent,
    User,
    Well,
    WellFormationInterval,
    WellSurvey,
)
from app.security import hash_password
from app.services.geo import wkt_point
from geoalchemy2.elements import WKTElement


NS = NAMESPACE_URL
DEMO_START = datetime(2024, 3, 1, tzinfo=timezone.utc)

EVENT_DEFS = [
    ("mud_loss", "high", "Lost circulation while drilling SYN-FM-BRAVO"),
    ("kick", "critical", "Pit gain and flow-out increase — well control drill"),
    ("stuck_pipe", "high", "Pack-off and overpull after connection"),
    ("torque_spike", "medium", "Erratic high torque through interbedded sandstone"),
    ("cementing", "medium", "No full returns during cement placement"),
    ("npt", "low", "NPT waiting on weather / equipment"),
]


def uid(name: str) -> str:
    return str(uuid5(NS, f"nwis-demo:{name}"))


def offset_coord(lat: float, lon: float, east_km: float, north_km: float) -> tuple[float, float]:
    dlat = north_km / 110.574
    dlon = east_km / (111.320 * math.cos(math.radians(lat)))
    return lat + dlat, lon + dlon


def train_ml_model() -> None:
    settings_ok = True
    try:
        import joblib
        import numpy as np
        from sklearn.linear_model import LogisticRegression

        rng = np.random.default_rng(42)
        n = 400
        X = rng.normal(size=(n, 6))
        # synthetic labels from a known rule on feature 0 (flow imbalance) — no leakage from test wells
        y = (X[:, 0] > 0.8).astype(int)
        clf = LogisticRegression(max_iter=200)
        clf.fit(X, y)
        path = Path(__file__).resolve().parent / "ml"
        path.mkdir(exist_ok=True)
        joblib.dump(
            {
                "model": clf,
                "version": "nwis-synth-logreg-v1",
                "trained_on": "synthetic_gaussian_features_only",
                "limitation": "Not real-world validated. Labels generated from synthetic feature rule.",
            },
            path / "risk_model.joblib",
        )
    except Exception:
        settings_ok = False
    return settings_ok


def write_sample_docs(base: Path) -> list[Path]:
    base.mkdir(parents=True, exist_ok=True)
    files = []
    txt = base / "SYN-WELL-A03_loss_event.txt"
    txt.write_text(
        """SYNTHETIC DEMO DOCUMENT — not an Oil India Limited record.
Well: SYN-WELL-A03
Date: 2024-05-12
MD: 1420.0 m
TVD: 1390.0 m
Formation: SYN-FM-BRAVO
Event: mud loss / lost circulation of approximately 12 m3.
Mud weight: 1.16 sg
NPT: 6.5 hours
Mitigation: pumped LCM pills in two stages and reduced flow rate.
Outcome: circulation regained; drilling resumed with reduced ROP.
Lesson learned: SYN-FM-BRAVO in this demo block shows loss-prone sandstone; stage LCM before entering the interval.
""",
        encoding="utf-8",
    )
    files.append(txt)
    csv = base / "SYN-WELL-A07_kick_summary.csv"
    csv.write_text(
        "well_uid,date,md_m,tvd_m,formation,event_type,npt_hours,notes\n"
        "SYN-WELL-A07,2024-06-02,1680.0,1648.0,SYN-FM-CHARLIE,kick,9.0,"
        "SYNTHETIC DEMO pit gain; shut-in drill; not operational data\n",
        encoding="utf-8",
    )
    files.append(csv)
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.pdfgen import canvas

        pdf_path = base / "SYN-WELL-A05_stuck_pipe.pdf"
        c = canvas.Canvas(str(pdf_path), pagesize=A4)
        width, height = A4
        lines = [
            "SYNTHETIC DEMO PDF — NWIS sample document",
            "Well: SYN-WELL-A05",
            "Date: 2024-04-18",
            "MD: 1210 m  TVD: 1188 m",
            "Formation: SYN-FM-ALPHA",
            "stuck pipe / pack-off after connection. High torque observed.",
            "NPT: 11 hours",
            "Mitigation: worked pipe, reduced WOB, spotted lubricant.",
            "Outcome: string freed; no fish left in hole.",
            "Lesson learned: avoid remaining stationary across SYN-FM-ALPHA claystone in this demo catalog.",
        ]
        y = height - 72
        for line in lines:
            c.drawString(48, y, line)
            y -= 18
        c.save()
        files.append(pdf_path)
    except Exception:
        pass
    return files


def seed(db: Session, reseed: bool = False) -> None:
    settings = get_settings()
    if reseed:
        for table in reversed(Base.metadata.sorted_tables):
            db.execute(table.delete())
        db.commit()
    if db.query(User).first():
        return

    users = [
        ("admin@nwis.demo", "Demo Admin", "admin", "demo-admin"),
        ("engineer@nwis.demo", "Demo Drilling Engineer", "drilling_engineer", "demo-engineer"),
        ("geologist@nwis.demo", "Demo Geologist", "geologist", "demo-geologist"),
        ("viewer@nwis.demo", "Demo Viewer", "viewer", "demo-viewer"),
    ]
    for email, name, role, pw in users:
        db.add(
            User(
                id=uid(f"user:{email}"),
                email=email,
                full_name=name,
                hashed_password=hash_password(pw),
                role=role,
            )
        )

    formations_spec = [
        ("SYN-FM-ALPHA", "Synthetic Alpha", "claystone"),
        ("SYN-FM-BRAVO", "Synthetic Bravo", "sandstone"),
        ("SYN-FM-CHARLIE", "Synthetic Charlie", "limestone"),
        ("SYN-FM-DELTA", "Synthetic Delta", "sandstone"),
        ("SYN-FM-ECHO", "Synthetic Echo", "shale"),
    ]
    formations: dict[str, Formation] = {}
    for code, name, lith in formations_spec:
        f = Formation(id=uid(f"fm:{code}"), code=code, name=name, lithology=lith)
        db.add(f)
        formations[code] = f

    lat0, lon0 = settings.demo_region_lat, settings.demo_region_lon
    layout = [
        (0.0, 0.0, True, "drilling", "SYN-WELL-A01"),
        (1.2, 0.4, False, "drilled", "SYN-WELL-A02"),
        (-0.8, 1.6, False, "drilled", "SYN-WELL-A03"),
        (2.4, -0.6, False, "drilled", "SYN-WELL-A04"),
        (-1.9, -1.1, False, "drilled", "SYN-WELL-A05"),
        (3.1, 1.8, False, "abandoned", "SYN-WELL-A06"),
        (0.5, 3.2, False, "drilled", "SYN-WELL-A07"),
        (-3.0, 0.7, False, "drilled", "SYN-WELL-A08"),
        (4.2, -2.0, False, "sidetracked", "SYN-WELL-A09"),
        (-2.2, 3.8, False, "drilled", "SYN-WELL-A10"),
        (5.5, 2.2, False, "drilled", "SYN-WELL-A11"),
        (-4.4, -2.8, False, "suspended", "SYN-WELL-A12"),
    ]

    fm_order = ["SYN-FM-ALPHA", "SYN-FM-BRAVO", "SYN-FM-CHARLIE", "SYN-FM-DELTA", "SYN-FM-ECHO"]
    wells: list[Well] = []
    for i, (e, n, active, status, wuid) in enumerate(layout):
        lat, lon = offset_coord(lat0, lon0, e, n)
        td_md = 2100 + i * 40
        td_tvd = td_md - 25 - i * 2
        well = Well(
            id=uid(f"well:{wuid}"),
            well_uid=wuid,
            name=f"Synthetic Offset {wuid}",
            status=status,
            latitude=round(lat, 6),
            longitude=round(lon, 6),
            location=f"POINT({lon} {lat})" if db.bind.name == "sqlite" else WKTElement(f"POINT({lon} {lat})", srid=4326),
            kelly_bushing_m=4.5,
            total_depth_md_m=float(td_md),
            total_depth_tvd_m=float(td_tvd),
            spud_date=DEMO_START + timedelta(days=i * 12),
            is_active_demo=active,
        )
        db.add(well)
        wells.append(well)

        for s in range(0, 8):
            md = s * (td_md / 7)
            tvd = md * 0.985
            db.add(
                WellSurvey(
                    id=uid(f"sv:{wuid}:{s}"),
                    well_id=well.id,
                    md_m=round(md, 2),
                    tvd_m=round(tvd, 2),
                    inclination_deg=round(min(18.0, s * 2.2), 2),
                    azimuth_deg=round(40 + i * 8, 1),
                    northing_m=round(s * 12.0, 1),
                    easting_m=round(s * 9.0, 1),
                )
            )

        tops = [0, 450, 900, 1400, 1800, td_md]
        for j, code in enumerate(fm_order):
            db.add(
                WellFormationInterval(
                    id=uid(f"wfi:{wuid}:{code}"),
                    well_id=well.id,
                    formation_id=formations[code].id,
                    top_md_m=float(tops[j]),
                    bottom_md_m=float(tops[j + 1]),
                    top_tvd_m=float(tops[j]) * 0.985,
                    bottom_tvd_m=float(tops[j + 1]) * 0.985,
                )
            )

        db.add_all(
            [
                CasingRecord(
                    id=uid(f"csg:{wuid}:surf"),
                    well_id=well.id,
                    string_name="surface",
                    od_in=13.375,
                    setting_depth_md_m=450,
                    setting_depth_tvd_m=443,
                    notes="Synthetic casing program",
                ),
                CasingRecord(
                    id=uid(f"csg:{wuid}:int"),
                    well_id=well.id,
                    string_name="intermediate",
                    od_in=9.625,
                    setting_depth_md_m=1400,
                    setting_depth_tvd_m=1378,
                ),
            ]
        )
        db.add(
            MudProgram(
                id=uid(f"mud:{wuid}:1"),
                well_id=well.id,
                interval_top_md_m=0,
                interval_bottom_md_m=1400,
                mud_type="WBM-demo",
                mud_weight_sg=1.12 + i * 0.005,
                pv_cp=18,
                yp_pa=8,
            )
        )
        db.add(
            MudProgram(
                id=uid(f"mud:{wuid}:2"),
                well_id=well.id,
                interval_top_md_m=1400,
                interval_bottom_md_m=td_md,
                mud_type="WBM-demo-weighted",
                mud_weight_sg=1.22 + i * 0.004,
                pv_cp=22,
                yp_pa=10,
            )
        )
        db.add(
            CementingRecord(
                id=uid(f"cem:{wuid}:int"),
                well_id=well.id,
                job_name="intermediate cement (synthetic)",
                md_m=1400,
                slurry_density_sg=1.85,
                volume_m3=18 + i,
                result="synthetic returns recorded",
                issues="partial losses during placement" if i % 4 == 0 else None,
            )
        )

    # 36 operational events across wells, depths aligned to formations
    event_plan = []
    types_cycle = ["mud_loss", "kick", "stuck_pipe", "torque_spike", "cementing", "npt"]
    depths = [480, 920, 1180, 1210, 1420, 1460, 1680, 1720, 1850, 1920]
    idx = 0
    for well in wells:
        n_ev = 3 if well.well_uid != "SYN-WELL-A01" else 2
        for k in range(n_ev):
            et = types_cycle[(idx + k) % len(types_cycle)]
            md = depths[(idx + k) % len(depths)] + (hash(well.well_uid) % 15)
            event_plan.append((well, et, float(md)))
        idx += 1

    lessons = {
        "mud_loss": "Stage LCM before SYN-FM-BRAVO sandstone in this synthetic catalog.",
        "kick": "Increase vigilance on flow-out vs flow-in through SYN-FM-CHARLIE limestone (demo).",
        "stuck_pipe": "Minimize stationary time across SYN-FM-ALPHA claystone (demo).",
        "torque_spike": "Reduce RPM/WOB through interbedded SYN-FM-DELTA (demo).",
        "cementing": "Plan excess slurry where losses were recorded on offsets (demo).",
        "npt": "Pre-stage critical spares to reduce wait time (demo).",
    }
    mitigations = {
        "mud_loss": ("Pumped LCM pill", "Circulation improved"),
        "kick": ("Shut in on drill; recorded SIDPP/SICP (synthetic)", "Influx controlled in drill"),
        "stuck_pipe": ("Worked pipe and spotted lubricant", "String freed"),
        "torque_spike": ("Reduced RPM and WOB", "Torque stabilized"),
        "cementing": ("Increased excess slurry on subsequent job", "Better returns"),
        "npt": ("Resumed after wait", "Operations continued"),
    }

    for n, (well, et, md) in enumerate(event_plan):
        fm_code = fm_order[min(len(fm_order) - 1, int(md // 450))]
        sev = "critical" if et == "kick" else "high" if et in {"mud_loss", "stuck_pipe"} else "medium"
        ev = OperationalEvent(
            id=uid(f"ev:{n}:{well.well_uid}:{et}:{int(md)}"),
            well_id=well.id,
            event_type=et,
            severity=sev,
            md_m=md,
            tvd_m=round(md * 0.985, 2),
            formation_id=formations[fm_code].id,
            title=f"{et.replace('_', ' ').title()} at {md:.0f} m MD ({well.well_uid})",
            description=(
                f"SYNTHETIC DEMO event {et} on {well.well_uid} at MD {md:.1f} m "
                f"(TVD ~{md * 0.985:.1f} m) in {fm_code}. Not operational data."
            ),
            npt_hours=round(2.5 + (n % 7) * 1.25, 2),
            lesson_learned=lessons[et],
            outcome=mitigations[et][1],
            occurred_at=DEMO_START + timedelta(days=20 + n),
            published=True,
        )
        db.add(ev)
        db.flush()
        db.add(
            MitigationAction(
                id=uid(f"mit:{ev.id}"),
                event_id=ev.id,
                action=mitigations[et][0],
                result=mitigations[et][1],
                sequence=1,
            )
        )

    # Daily-ish drilling measurements for active well and two offsets
    rng = random.Random(7)
    target_wells = [w for w in wells if w.well_uid in {"SYN-WELL-A01", "SYN-WELL-A02", "SYN-WELL-A03"}]
    for well in target_wells:
        md = 800.0
        pit = 27.5
        for t in range(180):
            md += 6.5
            if md > (well.total_depth_md_m or 2200) - 50:
                break
            noise = rng.uniform(-1, 1)
            flow_in = 1840 + noise * 15
            flow_out = flow_in + rng.uniform(-12, 12)
            db.add(
                DrillingParameter(
                    id=uid(f"dp:{well.well_uid}:{t}"),
                    well_id=well.id,
                    timestamp=DEMO_START + timedelta(minutes=t * 20),
                    md_m=round(md, 2),
                    tvd_m=round(md * 0.985, 2),
                    bit_depth_m=round(md - 0.5, 2),
                    rop_m_per_hr=round(16 + noise * 3 - md / 800, 2),
                    wob_kn=round(95 + noise * 8, 2),
                    torque_knm=round(14 + md / 400 + noise * 0.4, 2),
                    rpm=round(112 + noise * 4, 1),
                    spp_kpa=round(12000 + md * 1.1 + noise * 40, 1),
                    flow_in_lpm=round(flow_in, 1),
                    flow_out_lpm=round(flow_out, 1),
                    mud_weight_sg=round(1.16 + md / 25000, 3),
                    pit_volume_m3=round(pit + noise * 0.15, 2),
                    is_simulated=True,
                    source="synthetic_seed",
                )
            )

    for key, val, desc in [
        ("units.length", "m", "Display length unit"),
        ("units.mud_weight", "sg", "Display mud weight unit"),
        ("default.radius_km", str(settings.default_radius_km), "Default map/correlation radius"),
        ("thr.flow_imbalance_lpm", "80", "DEMO threshold, not field-safe"),
        ("thr.pit_gain_m3", "1.5", "DEMO threshold, not field-safe"),
        ("thr.torque_factor", "1.45", "DEMO threshold, not field-safe"),
        ("thr.spp_rise_kpa", "1200", "DEMO threshold, not field-safe"),
        ("thr.flow_stable_lpm", "40", "DEMO threshold, not field-safe"),
        ("thr.wob_min_kn", "80", "DEMO threshold, not field-safe"),
        ("thr.event_proximity_m", "40", "DEMO MD window, not TVD equivalent"),
        ("model.version", "nwis-synth-logreg-v1", "Optional sklearn model trained on synthetic labels only"),
    ]:
        db.add(AppSetting(id=uid(f"set:{key}"), key=key, value=val, description=desc))

    now = datetime.now(timezone.utc)
    db.add_all(
        [
            DataSource(
                id=uid("ds:seed"),
                code="synthetic_seed",
                name="Synthetic seed database",
                kind="database",
                status="healthy",
                details="Deterministic fictional wells/events for SIH 26121 demo.",
                last_heartbeat=now,
            ),
            DataSource(
                id=uid("ds:sim"),
                code="synthetic_simulator",
                name="Live data simulator",
                kind="telemetry_adapter",
                status="idle",
                details="Synthetic WebSocket/polling stream. Not connected to eRTMAC or SCADA.",
                last_heartbeat=now,
            ),
            DataSource(
                id=uid("ds:docs"),
                code="document_store",
                name="Local document store",
                kind="files",
                status="healthy",
                details="Local uploads directory. Production would add malware scanning.",
                last_heartbeat=now,
            ),
            DataSource(
                id=uid("ds:ertmac"),
                code="ertmac_adapter",
                name="eRTMAC adapter (future)",
                kind="integration_stub",
                status="not_connected",
                details="Placeholder adapter interface only. No OIL/eRTMAC credentials or live link.",
                last_heartbeat=None,
            ),
        ]
    )

    sample_dir = Path(__file__).resolve().parent.parent / "sample_docs"
    files = write_sample_docs(sample_dir)
    admin = db.query(User).filter(User.email == "admin@nwis.demo").one()
    for p in files:
        well = db.query(Well).filter(Well.well_uid == "SYN-WELL-A03").one()
        if "A05" in p.name:
            well = db.query(Well).filter(Well.well_uid == "SYN-WELL-A05").one()
        if "A07" in p.name:
            well = db.query(Well).filter(Well.well_uid == "SYN-WELL-A07").one()
        text = p.read_text(encoding="utf-8", errors="ignore") if p.suffix != ".pdf" else ""
        if p.suffix == ".pdf":
            try:
                from app.services.extraction import extract_text_from_file

                text, _ = extract_text_from_file(p, "application/pdf", False)
            except Exception:
                text = "SYN-WELL-A05 stuck pipe MD 1210 m"
        doc = Document(
            id=uid(f"doc:{p.name}"),
            well_id=well.id,
            original_filename=p.name,
            stored_filename=p.name,
            content_type="application/pdf" if p.suffix == ".pdf" else "text/plain",
            size_bytes=p.stat().st_size,
            status="published",
            extracted_text=text,
            uploaded_by=admin.id,
        )
        db.add(doc)
        db.flush()
        evs = EvidenceSnippet(
            id=uid(f"evd:{p.name}"),
            document_id=doc.id,
            page_number=1,
            snippet=text[:400],
            start_char=0,
            end_char=min(400, len(text)),
        )
        db.add(evs)

    train_ml_model()
    db.commit()


def main() -> None:
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--reseed", action="store_true")
    args = parser.parse_args()
    ensure_postgis()
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed(db, reseed=args.reseed)
        print("Seed complete (synthetic demo data).")
    finally:
        db.close()


if __name__ == "__main__":
    main()
