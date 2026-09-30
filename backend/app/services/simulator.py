from __future__ import annotations

import asyncio
import math
import random
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import DrillingParameter, Well
from app.services.alerts import alerts_from_assessments
from app.services.geo import interpolate_tvd
from app.services.risk_engine import assess_well


class LiveDataAdapter:
    """Interface for future authorized eRTMAC/SCADA integration. Not connected to any operator system."""

    def read_sample(self) -> Optional[dict]:
        raise NotImplementedError


class SyntheticSimulatorAdapter(LiveDataAdapter):
    def __init__(self) -> None:
        self.running = False
        self.scenario = "normal"
        self.well_id: Optional[str] = None
        self.md_m = 800.0
        self.rate = 4.0
        self.tick = 0
        self.last_sample: Optional[dict] = None
        self.subscribers: list[asyncio.Queue] = []
        self._task: Optional[asyncio.Task] = None

    def read_sample(self) -> Optional[dict]:
        return self.last_sample


simulator = SyntheticSimulatorAdapter()


def _scenario_modifiers(scenario: str, tick: int) -> dict:
    if scenario == "losses":
        return {"flow_out_delta": -110, "pit_delta": -2.2}
    if scenario == "flow_imbalance":
        return {"flow_out_delta": 130, "pit_delta": 2.4}
    if scenario == "torque_spike":
        return {"torque_factor": 1.8, "rop_factor": 0.4}
    if scenario == "pressure_anomaly":
        return {"spp_delta": 1800}
    return {}


def generate_sample(well: Well, md_m: float, scenario: str, tick: int, surveys: list) -> dict:
    base = 0.15 * math.sin(md_m / 40.0) + 0.05 * math.sin(tick / 7.0)
    mods = _scenario_modifiers(scenario, tick)
    flow_in = 1850 + 40 * base
    flow_out = flow_in + mods.get("flow_out_delta", 8 * base)
    pit = 28.0 + 0.2 * base + mods.get("pit_delta", 0.0)
    torque = (12 + md_m / 350) * mods.get("torque_factor", 1.0) + 0.6 * base
    rop = max(1.5, (18 - md_m / 400) * mods.get("rop_factor", 1.0) + 2 * base)
    spp = 12500 + md_m * 1.2 + mods.get("spp_delta", 0.0) + 80 * base
    tvd = interpolate_tvd(surveys, md_m)
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "well_id": well.id,
        "well_uid": well.well_uid,
        "md_m": round(md_m, 2),
        "tvd_m": round(tvd, 2) if tvd is not None else None,
        "bit_depth_m": round(md_m - 0.4, 2),
        "rop_m_per_hr": round(rop, 2),
        "wob_kn": round(90 + 20 * base, 2),
        "torque_knm": round(torque, 2),
        "rpm": round(110 + 8 * base, 1),
        "spp_kpa": round(spp, 1),
        "flow_in_lpm": round(flow_in, 1),
        "flow_out_lpm": round(flow_out, 1),
        "mud_weight_sg": round(1.18 + md_m / 20000, 3),
        "pit_volume_m3": round(pit, 2),
        "is_simulated": True,
        "source": "synthetic_simulator",
        "scenario": scenario,
        "disclaimer": "SIMULATED TELEMETRY — not live rig data. Adapter only; no eRTMAC/SCADA connection.",
    }


async def _loop():
    while True:
        await asyncio.sleep(2.0)
        if not simulator.running or not simulator.well_id:
            continue
        db = SessionLocal()
        try:
            well = db.get(Well, simulator.well_id)
            if not well:
                continue
            surveys = list(well.surveys)
            simulator.md_m = min((well.total_depth_md_m or 2500.0) - 5.0, simulator.md_m + simulator.rate * (2.0 / 60.0))
            simulator.tick += 1
            sample = generate_sample(well, simulator.md_m, simulator.scenario, simulator.tick, surveys)
            simulator.last_sample = sample
            row = DrillingParameter(
                well_id=well.id,
                timestamp=datetime.now(timezone.utc),
                md_m=sample["md_m"],
                tvd_m=sample["tvd_m"],
                bit_depth_m=sample["bit_depth_m"],
                rop_m_per_hr=sample["rop_m_per_hr"],
                wob_kn=sample["wob_kn"],
                torque_knm=sample["torque_knm"],
                rpm=sample["rpm"],
                spp_kpa=sample["spp_kpa"],
                flow_in_lpm=sample["flow_in_lpm"],
                flow_out_lpm=sample["flow_out_lpm"],
                mud_weight_sg=sample["mud_weight_sg"],
                pit_volume_m3=sample["pit_volume_m3"],
                is_simulated=True,
                source="synthetic_simulator",
            )
            db.add(row)
            db.commit()
            try:
                ras = assess_well(db, well.id, radius_km=8.0, include_ml=True)
                alerts_from_assessments(db, well, ras, 8.0)
                db.commit()
            except Exception:
                db.rollback()
            for q in list(simulator.subscribers):
                if q.full():
                    try:
                        q.get_nowait()
                    except Exception:
                        pass
                await q.put(sample)
        finally:
            db.close()


def start_background_loop() -> None:
    if simulator._task is None or simulator._task.done():
        simulator._task = asyncio.create_task(_loop())
