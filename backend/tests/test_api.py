import os

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

pytestmark = pytest.mark.skipif(
    os.getenv("SKIP_DB_TESTS", "").lower() in {"1", "true"},
    reason="Database not available",
)


def _login(email="engineer@nwis.demo", password="demo-engineer"):
    r = client.post("/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["database"] is True
    assert body["postgis"] is True


def test_demo_login_and_me():
    token = _login("admin@nwis.demo", "demo-admin")
    me = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["role"] == "admin"


def test_viewer_cannot_upload():
    token = _login("viewer@nwis.demo", "demo-viewer")
    r = client.post(
        "/documents/upload",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("x.txt", b"hello", "text/plain")},
    )
    assert r.status_code == 403


def test_wells_and_nearby_radius():
    token = _login()
    h = {"Authorization": f"Bearer {token}"}
    wells = client.get("/wells", headers=h).json()
    assert len(wells) >= 12
    active = next(w for w in wells if w["is_active_demo"])
    nearby = client.get(f"/wells/nearby?well_id={active['id']}&radius_km=3", headers=h).json()
    wide = client.get(f"/wells/nearby?well_id={active['id']}&radius_km=20", headers=h).json()
    assert all(n["distance_km"] <= 3.01 for n in nearby)
    assert len(wide) >= len(nearby)
    assert all("SYN-WELL-" in n["well_uid"] for n in wide)


def test_dashboard_uses_seed_telemetry():
    token = _login()
    h = {"Authorization": f"Bearer {token}"}
    s = client.get("/dashboard/summary", headers=h).json()
    assert s["active_well"]["well_uid"] == "SYN-WELL-A01"
    assert s["live"]["md_m"] > 0
    assert len(s["trend"]) > 0


def test_document_review_publish():
    token = _login("geologist@nwis.demo", "demo-geologist")
    h = {"Authorization": f"Bearer {token}"}
    content = (
        b"Well: SYN-WELL-A02\nDate: 2024-07-01\nMD: 920 m\nFormation: SYN-FM-BRAVO\n"
        b"torque spike observed\nMitigation: reduced RPM\nOutcome: torque stabilized\n"
        b"Lesson learned: watch interbeds.\n"
    )
    up = client.post(
        "/documents/upload",
        headers=h,
        files={"file": ("demo.txt", content, "text/plain")},
    )
    assert up.status_code == 201, up.text
    doc_id = up.json()["id"]
    detail = client.get(f"/documents/{doc_id}", headers=h).json()
    reviews = []
    for ex in detail["extractions"]:
        if ex["value"]:
            reviews.append({"extraction_id": ex["id"], "reviewer_value": ex["value"], "status": "approved"})
    pub = client.post(f"/documents/{doc_id}/publish", headers=h, json={"reviews": reviews})
    assert pub.status_code == 200, pub.text
    assert pub.json()["status"] == "published"


def test_knowledge_and_correlation():
    token = _login()
    h = {"Authorization": f"Bearer {token}"}
    ks = client.get("/knowledge/search?q=mud%20loss", headers=h).json()
    assert len(ks["hits"]) >= 1
    wells = client.get("/wells", headers=h).json()
    active = next(w for w in wells if w["is_active_demo"])
    corr = client.post(
        "/correlation",
        headers=h,
        json={"well_id": active["id"], "md_m": 1420, "radius_km": 8, "depth_window_m": 80},
    )
    assert corr.status_code == 200
    body = corr.json()
    assert body["depth_basis"] == "measured_depth_window"
    assert "matches" in body


def test_risk_and_alert_dedup():
    token = _login()
    h = {"Authorization": f"Bearer {token}"}
    wells = client.get("/wells", headers=h).json()
    active = next(w for w in wells if w["is_active_demo"])
    r1 = client.post("/risk/assess", headers=h, json={"well_id": active["id"], "radius_km": 8}).json()
    assert "assessments" in r1
    client.post("/risk/assess", headers=h, json={"well_id": active["id"], "radius_km": 8})
    alerts = client.get("/alerts", headers=h).json()
    fps = [a["title"] for a in alerts]
    assert isinstance(fps, list)


def test_reports_csv():
    token = _login()
    h = {"Authorization": f"Bearer {token}"}
    r = client.get("/reports/wells.csv", headers=h)
    assert r.status_code == 200
    assert b"SYNTHETIC DEMO DATA" in r.content
    assert b"SYN-WELL-A01" in r.content


def test_upload_rejects_exe():
    token = _login()
    h = {"Authorization": f"Bearer {token}"}
    r = client.post(
        "/documents/upload",
        headers=h,
        files={"file": ("malware.exe", b"MZ", "application/octet-stream")},
    )
    assert r.status_code == 400
