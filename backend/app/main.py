from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import Base, engine, ensure_postgis
from app.routers import (
    alerts,
    auth,
    dashboard,
    documents,
    health,
    knowledge,
    reports,
    risk,
    settings as settings_router,
    simulator,
    wells,
)
from app.seed import seed
from app.database import SessionLocal
from app.services.simulator import start_background_loop

app_settings = get_settings()

app = FastAPI(
    title="eRTMAC-NWIS API",
    version="0.1.0",
    description=(
        "Nearby Wells Intelligence System prototype for SIH 26121. "
        "Synthetic demo data only. Not connected to Oil India Limited systems. "
        "Prototype decision support — not validated operational advice."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=app_settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include standard routes
for r in [
    health.router,
    auth.router,
    dashboard.router,
    wells.router,
    documents.router,
    knowledge.router,
    risk.router,
    alerts.router,
    simulator.router,
    reports.router,
    settings_router.router,
]:
    app.include_router(r)
    app.include_router(r, prefix="/api")


@app.on_event("startup")
def startup():
    ensure_postgis()
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed(db, reseed=False)
    finally:
        db.close()
    start_background_loop()
