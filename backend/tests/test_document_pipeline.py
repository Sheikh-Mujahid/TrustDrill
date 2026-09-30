from pathlib import Path
from datetime import datetime, timezone
import io

from app.services.extraction import classify_document, extract_text_from_file, parse_fields
from app.services.knowledge import keyword_search


def test_extraction_provenance_and_non_invention():
    raw_text = """
    Well: SYN-WELL-A03
    Operator: Oil India Limited
    Field: NWIS Synthetic Block A
    Basin: Upper Assam Basin
    State: Assam
    District: Dibrugarh
    Latitude: 27.4720 Longitude: 95.3180
    Spud Date: 2024-03-01
    Completion Date: 2024-05-15
    MD: 1420.0 m
    TVD: 1390.0 m
    KB: 112.5 m
    Mud Weight: 1.18 sg
    Mud Type: KCL-Polymer
    Bit Size: 8-1/2"
    Casing: 9-5/8" @ 1200 m
    Formation: SYN-FM-BRAVO
    Event: mud loss / lost circulation
    NPT: 6.5 hours
    Mitigation: Pumped 8 m3 high-viscosity LCM pill
    Outcome: Partial circulation regained
    Lesson learned: Stage LCM before penetrating Bravo formation
    """
    fields = parse_fields(raw_text)
    field_map = {f.field_name: f for f in fields}

    # Assert accurate Well Information extraction
    assert field_map["well_uid"].value == "SYN-WELL-A03"
    assert field_map["operator"].value == "Oil India Limited"
    assert "Block A" in (field_map["field"].value or "")
    assert "Upper Assam" in (field_map["basin"].value or "")
    assert field_map["state"].value == "Assam"
    assert field_map["district"].value == "Dibrugarh"
    assert field_map["latitude"].value == "27.4720"
    assert field_map["longitude"].value == "95.3180"
    assert field_map["spud_date"].value == "2024-03-01"
    assert field_map["completion_date"].value == "2024-05-15"
    assert field_map["total_depth_md_m"].value == "1420.00"
    assert field_map["total_depth_tvd_m"].value == "1390.00"
    assert field_map["kelly_bushing_m"].value == "112.50"

    # Assert accurate Drilling Information extraction
    assert field_map["mud_weight"].value == "1.18"
    assert "KCL-Polymer" in (field_map["mud_type"].value or "")
    assert "8-1/2" in (field_map["bit_size"].value or "")
    assert "9-5/8" in (field_map["casing_size"].value or "")
    assert "1200" in (field_map["casing_depth_m"].value or "")

    # Assert accurate Event Information extraction
    assert field_map["formation"].value == "SYN-FM-BRAVO"
    assert field_map["event_type"].value == "mud_loss"
    assert field_map["npt_hours"].value == "6.5"
    assert "LCM pill" in (field_map["mitigation"].value or "")
    assert "regained" in (field_map["outcome"].value or "")
    assert "Bravo" in (field_map["lesson_learned"].value or "")

    # Assert snippet and character positions are captured
    assert field_map["well_uid"].snippet is not None
    assert field_map["well_uid"].start_char is not None
    assert field_map["well_uid"].end_char is not None

    # Assert missing fields are NEVER invented (None)
    sparse_text = "Some generic daily notes without well or depth markers."
    sparse_fields = parse_fields(sparse_text)
    sparse_map = {f.field_name: f for f in sparse_fields}
    assert sparse_map["well_uid"].value is None
    assert sparse_map["total_depth_md_m"].value is None
    assert sparse_map["total_depth_tvd_m"].value is None
    assert sparse_map["event_type"].value is None
    assert sparse_map["formation"].value is None


def test_document_classification():
    wcr_text = "WELL COMPLETION REPORT (WCR) for exploration well SYN-WELL-A01. Final geological and drilling summary."
    dtype, conf = classify_document(wcr_text, "WCR_SYN-WELL-A01.pdf")
    assert dtype == "WCR"
    assert conf >= 0.7

    ddr_text = "DAILY DRILLING REPORT No. 14. 24 hour summary of rig operations and mud logging."
    dtype2, conf2 = classify_document(ddr_text, "DDR_report_day14.pdf")
    assert dtype2 == "DDR"
    assert conf2 >= 0.7

    mud_text = "MUD REPORT: Drilling fluid properties, rheology, viscosity, and filtrate analysis."
    dtype3, conf3 = classify_document(mud_text, "mud_properties_log.pdf")
    assert dtype3 == "MUD_REPORT"
    assert conf3 >= 0.7


def test_pdf_text_and_fields_extraction():
    pdf_path = Path("sample_docs/SYN-WELL-A04_cementing_log.pdf")
    assert pdf_path.exists(), "Sample PDF must exist"
    
    text, ocr_used, page_count = extract_text_from_file(pdf_path, "application/pdf")
    assert len(text) > 50
    assert page_count >= 1
    assert "SYN-WELL-A04" in text

    fields = parse_fields(text)
    field_map = {f.field_name: f for f in fields if f.value is not None}

    assert field_map["well_uid"].value == "SYN-WELL-A04"
    assert field_map["formation"].value == "SYN-FM-BRAVO"
    assert field_map["total_depth_md_m"].value == "1850.00"
    assert field_map["total_depth_tvd_m"].value == "1820.00"
    assert field_map["event_type"].value in {"cementing", "npt"}
