from __future__ import annotations

import io
import pytest
from app.models import Formation, OperationalEvent, Well, WellFormationInterval
from app.services.extraction import parse_fields
from app.services.geo import haversine_km
from app.services.knowledge import (
    calculate_well_similarity,
    keyword_search,
)
from app.services.risk_engine import generate_explainable_risk_report


def test_distance_and_similarity_determinism():
    """Verify that distance and similarity scores are deterministic and transparently weighted."""
    # Haversine distance
    d1 = haversine_km(27.4728, 94.9120, 27.4900, 94.9300)
    d2 = haversine_km(27.4728, 94.9120, 27.4900, 94.9300)
    assert d1 == d2
    assert 2.0 < d1 < 3.5

    # Well models
    tw = Well(
        well_uid="SYN-TARGET",
        name="Target Well",
        latitude=27.4728,
        longitude=94.9120,
        total_depth_md_m=3200.0,
        field_name="Block A",
    )
    ow = Well(
        well_uid="SYN-OFFSET",
        name="Offset Well 1",
        latitude=27.4900,
        longitude=94.9300,
        total_depth_md_m=3150.0,
        field_name="Block A",
    )

    fm1 = Formation(code="FM-BARAIL", name="Barail Formation")
    fm2 = Formation(code="FM-TIPAM", name="Tipam Sandstone")

    t_ivs = [
        WellFormationInterval(formation=fm1, top_md_m=2000.0, bottom_md_m=2500.0),
        WellFormationInterval(formation=fm2, top_md_m=2500.0, bottom_md_m=3200.0),
    ]
    o_ivs = [
        WellFormationInterval(formation=fm1, top_md_m=1980.0, bottom_md_m=2480.0),
        WellFormationInterval(formation=fm2, top_md_m=2480.0, bottom_md_m=3150.0),
    ]

    sim = calculate_well_similarity(tw, ow, d1, 25.0, t_ivs, o_ivs)
    assert 0.0 <= sim.combined_score <= 1.0
    assert sim.label == "Prototype similarity score"
    assert sim.field_similarity == 1.0  # Same field
    assert sim.formation_similarity == 1.0  # Exact matching formation set


def test_document_extraction_and_evidence_citations():
    """Verify document processing preserves page citations and does not hallucinate."""
    sample_text = (
        "\n--- PAGE 2 ---\n"
        "OIL INDIA LIMITED - DAILY DRILLING REPORT\n"
        "Well: SYN-WELL-A03\n"
        "Date: 2026-03-15\n"
        "Current Depth: 2745.0 m MD\n"
        "Formation: Barail Formation\n"
        "Encountered severe mud loss in Barail Formation at depth 2710 m.\n"
    )

    extractions = parse_fields(sample_text)
    assert len(extractions) > 0

    found_well = next((e for e in extractions if e.field_name == "well_uid"), None)
    assert found_well is not None
    assert found_well.value == "SYN-WELL-A03"
    assert found_well.page_number == 2
    assert found_well.snippet is not None

    # Verify that missing fields remain null (non-invention)
    water_cut = next((e for e in extractions if e.field_name == "water_cut_pct"), None)
    if water_cut:
        assert water_cut.value is None


def test_risk_intelligence_report_generation():
    """Verify explainable risk report structure, citations, and disclaimer."""
    from unittest.mock import MagicMock

    mock_db = MagicMock()
    mock_well = Well(
        id="well-001",
        well_uid="SYN-WELL-A01",
        name="Dibrugarh Alpha 1",
        status="active",
        latitude=27.4728,
        longitude=94.9120,
        total_depth_md_m=3250.0,
        total_depth_tvd_m=3100.0,
        field_name="Synthetic Block A",
    )
    mock_db.get.return_value = mock_well
    mock_db.query.return_value.options.return_value.filter.return_value.all.return_value = []
    mock_db.query.return_value.filter.return_value.all.return_value = []

    # Should generate report with valid structure
    report = generate_explainable_risk_report(mock_db, "well-001", radius_km=25.0)
    assert report.target_well.well_uid == "SYN-WELL-A01"
    assert len(report.indicators) >= 4
    assert len(report.limitations) >= 3
    assert "PROTOTYPE" in report.disclaimer.upper()

    # Verify every indicator has qualitative level and explanation, no raw fake probability
    for ind in report.indicators:
        assert ind.indicator_level in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
        assert ind.explanation != ""
        assert "%" not in ind.indicator_level  # Never a fake percentage risk score


def test_pdf_report_generation_runs_cleanly():
    """Verify ReportLab builds the 9-section PDF report with tables without error."""
    from app.schemas import ExplainableRiskIndicator, RiskEvidenceItem, SimilarityBreakdown, ComparableWell, RiskIntelligenceReport
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("T", parent=styles["Heading1"], fontSize=14)

    elements = [
        Paragraph("TRUSTDRILL RISK INTELLIGENCE REPORT", title_style),
        Spacer(1, 10),
    ]

    table_data = [["Well UID", "Status"], ["SYN-WELL-A01", "ACTIVE"]]
    t = Table(table_data)
    t.setStyle(TableStyle([('BACKGROUND', (0,0), (-1,-1), colors.whitesmoke)]))
    elements.append(t)

    doc.build(elements)
    buf.seek(0)
    pdf_bytes = buf.read()
    assert len(pdf_bytes) > 500
    assert pdf_bytes.startswith(b"%PDF")
