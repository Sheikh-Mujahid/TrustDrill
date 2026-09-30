import asyncio

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session

from app.database import get_db, SessionLocal
from app.models import DrillingParameter, User, Well
from app.schemas import SimulatorControl
from app.security import ENGINEER_ROLES, decode_token, get_current_user, require_roles
from app.services.simulator import generate_sample, simulator, start_background_loop

router = APIRouter(tags=["simulator"])


@router.get("/simulator/status")
def status(user: User = Depends(get_current_user)):
    return {
        "running": simulator.running,
        "scenario": simulator.scenario,
        "well_id": simulator.well_id,
        "md_m": simulator.md_m,
        "last_sample": simulator.last_sample,
        "label": "SIMULATED TELEMETRY",
        "integration": "LiveDataAdapter stub only — not connected to eRTMAC/SCADA.",
    }


@router.post("/simulator/control")
def control(
    body: SimulatorControl,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*ENGINEER_ROLES)),
):
    start_background_loop()
    well = None
    if body.well_id:
        well = db.get(Well, body.well_id)
        if not well:
            raise HTTPException(404, "Well not found")
        simulator.well_id = well.id
        last = (
            db.query(DrillingParameter)
            .filter(DrillingParameter.well_id == well.id)
            .order_by(DrillingParameter.md_m.desc())
            .first()
        )
        if body.action == "reset":
            simulator.md_m = 800.0
            simulator.tick = 0
            simulator.last_sample = None
        elif last:
            simulator.md_m = last.md_m
    if body.action == "start":
        if not simulator.well_id:
            active = db.query(Well).filter(Well.is_active_demo.is_(True)).first()
            if not active:
                raise HTTPException(400, "No active demo well")
            simulator.well_id = active.id
            last = (
                db.query(DrillingParameter)
                .filter(DrillingParameter.well_id == active.id)
                .order_by(DrillingParameter.md_m.desc())
                .first()
            )
            simulator.md_m = last.md_m if last else 800.0
        simulator.running = True
        simulator.scenario = body.scenario
        simulator.rate = body.depth_rate_m_per_min
    elif body.action == "pause":
        simulator.running = False
    elif body.action == "reset":
        simulator.running = False
        simulator.tick = 0
        if not body.well_id:
            simulator.md_m = 800.0
    return status(user)


@router.websocket("/ws/telemetry")
async def ws_telemetry(ws: WebSocket, token: str = Query(...)):
    await ws.accept()
    try:
        payload = decode_token(token)
        if not payload.get("sub"):
            await ws.close(code=4401)
            return
    except Exception:
        await ws.close(code=4401)
        return
    start_background_loop()
    q: asyncio.Queue = asyncio.Queue(maxsize=20)
    simulator.subscribers.append(q)
    try:
        if simulator.last_sample:
            await ws.send_json(simulator.last_sample)
        while True:
            sample = await q.get()
            await ws.send_json(sample)
    except WebSocketDisconnect:
        pass
    finally:
        if q in simulator.subscribers:
            simulator.subscribers.remove(q)
