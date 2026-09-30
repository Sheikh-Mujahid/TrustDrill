from __future__ import annotations

import io
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Optional


# Regex Patterns for Entity Extraction
WELL_RE = re.compile(r"\b(?:WELL(?:\s*NAME|\s*NO\.?|\s*UID)?\s*[:=]\s*)([A-Za-z0-9_-]+)\b|\b(SYN-WELL-[A-Z]\d{2})\b", re.I)
SYN_WELL_STRICT_RE = re.compile(r"\b(SYN-WELL-[A-Z]\d{2})\b", re.I)
DATE_RE = re.compile(r"\b(20\d{2}[-/]\d{2}[-/]\d{2}|\d{2}[-/]\d{2}[-/]20\d{2})\b")
SPUD_DATE_RE = re.compile(r"\b(?:spud(?:ded)?(?:\s*date)?|commenced|started)\s*[:=]?\s*([0-9]{4}[-/][0-9]{2}[-/][0-9]{2}|[0-9]{2}[-/][0-9]{2}[-/][0-9]{4})\b", re.I)
COMPLETION_DATE_RE = re.compile(r"\b(?:completion(?:\s*date)?|completed|rig\s*release(?:d)?)\s*[:=]?\s*([0-9]{4}[-/][0-9]{2}[-/][0-9]{2}|[0-9]{2}[-/][0-9]{2}[-/][0-9]{4})\b", re.I)

MD_RE = re.compile(r"\b(?:MD|measured\s*depth|total\s*depth|TD)\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?)\s*(m|ft|meters|feet)?\b", re.I)
TVD_RE = re.compile(r"\b(?:TVD|true\s*vertical\s*depth)\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?)\s*(m|ft|meters|feet)?\b", re.I)
KB_RE = re.compile(r"\b(?:KB|kelly\s*bushing|elevation|datum)\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?)\s*(m|ft)?\b", re.I)

LAT_LON_RE = re.compile(r"\b(?:lat(?:itude)?)\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:N|S)?(?:\s*[,;]\s*|\s+)(?:lon(?:gitude)?)\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:E|W)?\b", re.I)
OPERATOR_RE = re.compile(r"\b(?:operator)\s*[:=]\s*([A-Za-z0-9\s.,&-]+?)(?:\r?\n|;|,|\bfield\b|\bwell\b)", re.I)
FIELD_RE = re.compile(r"\b(?:field(?:\s*name)?|block|area)\s*[:=]\s*([A-Za-z0-9\s.,&-]+?)(?:\r?\n|;|,|\boperator\b|\bbasin\b)", re.I)
BASIN_RE = re.compile(r"\b(?:basin)\s*[:=]\s*([A-Za-z0-9\s.,&-]+?)(?:\r?\n|;|,|\bstate\b|\bblock\b)", re.I)
STATE_RE = re.compile(r"\b(?:state)\s*[:=]\s*([A-Za-z\s]+?)(?:\r?\n|;|,|\bdistrict\b|\bcountry\b)", re.I)
DISTRICT_RE = re.compile(r"\b(?:district)\s*[:=]\s*([A-Za-z\s]+?)(?:\r?\n|;|,|\bstate\b)", re.I)

FM_RE = re.compile(r"\b(SYN-FM-(?:ALPHA|BRAVO|CHARLIE|DELTA|ECHO)|[A-Z][a-zA-Z0-9]+(?:\s+Formation|\s+Sandstone|\s+Shale|\s+Limestone))\b", re.I)
NPT_RE = re.compile(r"\b(?:NPT|non[\s_-]?productive[\s_-]*time|downtime)\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?)\s*(h|hr|hrs|hours)?\b", re.I)
MW_RE = re.compile(r"\b(?:mud\s*weight|MW|density)\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?)\s*(sg|ppg|g/cc|specific\s*gravity)?\b", re.I)
MUD_TYPE_RE = re.compile(r"\b(?:mud\s*type|fluid\s*type|system)\s*[:=]?\s*([A-Za-z0-9\s\-_/]+?)(?:\r?\n|;|,|\bmud\s*weight\b|\bviscosity\b)", re.I)
BIT_SIZE_RE = re.compile(r"\b(?:bit\s*size|hole\s*size)\s*[:=]?\s*([0-9]+(?:\s*[-/]\s*[0-9]+)?(?:/[0-9]+)?)\s*(?:\"|in|inch|mm)?\b", re.I)
CASING_RE = re.compile(r"\b(?:casing(?:\s*size)?)\s*[:=]?\s*([0-9]+(?:\s*[-/]\s*[0-9]+)?(?:/[0-9]+)?)\s*(?:\"|in|inch)?(?:\s*(?:@|at|depth\s*[:=]?)\s*([0-9]+(?:\.[0-9]+)?)\s*(?:m|ft)?)?", re.I)

EVENT_PATTERNS = [
    ("mud_loss", re.compile(r"\b(mud[\s_-]*loss|lost[\s_-]*circulation|seepage[\s_-]*loss|complete[\s_-]*loss)\b", re.I)),
    ("kick", re.compile(r"\b(kick|gas[\s_-]*kick|influx|gain[\s_-]*in[\s_-]*pit|well[\s_-]*control|pit[\s_-]*gain)\b", re.I)),
    ("stuck_pipe", re.compile(r"\b(stuck[\s_-]*pipe|pack[\s_-]?off|overpull|differential[\s_-]*sticking|pipe[\s_-]*stuck)\b", re.I)),
    ("torque_spike", re.compile(r"\b(torque[\s_-]*spike|high[\s_-]*torque|erratic[\s_-]*torque|torque[\s_-]*drag|stick[\s_-]*slip)\b", re.I)),
    ("cementing", re.compile(r"\b(cement(?:ing)?[\s_-]*(?:issue|loss|channel|channeling|poor[\s_-]*bond)|no[\s_-]*returns?[\s_-]*during[\s_-]*cement|channeling|gas[\s_-]*cut[\s_-]*cement)\b", re.I)),
    ("tight_hole", re.compile(r"\b(tight[\s_-]*hole|tight[\s_-]*spot|reaming|drag[\s_-]*on[\s_-]*trips?)\b", re.I)),
    ("npt", re.compile(r"\b(non[\s_-]?productive[\s_-]*time|NPT|rig[\s_-]*repair|waiting[\s_-]*on[\s_-]*weather)\b", re.I)),
]

DOC_TYPE_KEYWORDS = {
    "WCR": ["well completion report", "completion report", "wcr", "end of well report", "eowr", "abandonment report", "final well report"],
    "DDR": ["daily drilling report", "ddr", "daily report", "morning report", "24 hr summary", "24 hour report", "daily operations"],
    "GEOLOGICAL_REPORT": ["geological report", "geology report", "lithological", "biostratigraphy", "petrophysical", "cuttings description", "core analysis", "wireline log"],
    "DRILLING_REPORT": ["drilling report", "drilling summary", "bit record", "bha report", "drilling program", "casing report"],
    "MUD_REPORT": ["mud report", "mud log", "drilling fluid report", "rheology", "mud properties", "viscosity", "filtrate", "mud engineer"],
    "CEMENTING_REPORT": ["cementing report", "cement job", "cement report", "slurry report", "cbl", "casing cement log", "top of cement"],
    "FORMATION_REPORT": ["formation evaluation", "formation tops", "stratigraphic report", "reservoir report", "formation pressure"],
}


@dataclass
class ExtractedField:
    field_name: str
    value: Optional[str]
    unit: Optional[str]
    category: str
    confidence: Optional[float]
    page_number: Optional[int]
    snippet: Optional[str]
    start_char: Optional[int]
    end_char: Optional[int]


def _to_meters(value: float, unit: Optional[str]) -> float:
    if unit and unit.lower() in {"ft", "feet"}:
        return round(value * 0.3048, 2)
    return round(value, 2)


def classify_document(text: str, filename: str, user_type: Optional[str] = None) -> tuple[str, float]:
    """Classify drilling document type from filename and text content."""
    if user_type and user_type.upper() in DOC_TYPE_KEYWORDS:
        return user_type.upper(), 1.0

    lower_fn = filename.lower()
    lower_text = text[:3000].lower()

    scores: dict[str, float] = {k: 0.0 for k in DOC_TYPE_KEYWORDS}

    for dtype, kw_list in DOC_TYPE_KEYWORDS.items():
        for kw in kw_list:
            if kw in lower_fn:
                scores[dtype] += 0.5
            if kw in lower_text:
                scores[dtype] += 0.3

    best_type = max(scores, key=scores.get)
    best_score = scores[best_type]

    if best_score >= 0.3:
        confidence = min(0.95, 0.65 + (best_score * 0.1))
        return best_type, round(confidence, 2)

    return "OTHER", 0.5


def extract_text_from_file(path: Path, content_type: str, enable_ocr: bool = True) -> tuple[str, bool, int]:
    """Extract page-preserving text from PDF, TXT, or CSV with optional local OCR fallback."""
    suffix = path.suffix.lower()
    if suffix in {".txt", ".csv"} or content_type.startswith("text/"):
        raw = path.read_text(encoding="utf-8", errors="replace")
        return f"\n--- PAGE 1 ---\n{raw}", False, 1

    if suffix == ".pdf" or content_type == "application/pdf":
        return _extract_pdf_with_pages(path, enable_ocr=enable_ocr)

    raise ValueError(f"Unsupported file type: {suffix}")


def _extract_pdf_with_pages(path: Path, enable_ocr: bool = True) -> tuple[str, bool, int]:
    text_pages: list[str] = []
    ocr_used = False
    page_count = 0

    try:
        import fitz  # PyMuPDF

        doc = fitz.open(path)
        page_count = len(doc)
        for i, page in enumerate(doc):
            t = page.get_text("text") or ""
            # If page text is very sparse, attempt OCR if enabled
            if len(t.strip()) < 30 and enable_ocr:
                try:
                    import pytesseract
                    from PIL import Image

                    pix = page.get_pixmap(dpi=200)
                    img = Image.open(io.BytesIO(pix.tobytes("png")))
                    ocr_t = pytesseract.image_to_string(img)
                    if len(ocr_t.strip()) > len(t.strip()):
                        t = ocr_t
                        ocr_used = True
                except Exception:
                    pass
            text_pages.append(f"\n--- PAGE {i+1} ---\n{t}")
        doc.close()
    except Exception:
        # Fallback to pdfplumber
        try:
            import pdfplumber

            with pdfplumber.open(path) as pdf:
                page_count = len(pdf.pages)
                for i, page in enumerate(pdf.pages):
                    t = page.extract_text() or ""
                    text_pages.append(f"\n--- PAGE {i+1} ---\n{t}")
        except Exception as e:
            raise ValueError(f"Failed to read PDF document: {e}")

    full_text = "\n".join(text_pages)
    return full_text, ocr_used, max(1, page_count)


def _page_of(text: str, index: int) -> int:
    prefix = text[:index]
    pages = re.findall(r"--- PAGE (\d+)", prefix)
    return int(pages[-1]) if pages else 1


def parse_fields(text: str, doc_type: str = "OTHER") -> list[ExtractedField]:
    """Extract structured facts across Well, Drilling, Formation, and Event schemas with exact evidence snippets."""
    fields: list[ExtractedField] = []

    def add(
        name: str,
        category: str,
        match: Optional[re.Match],
        value: Optional[str],
        unit: Optional[str] = None,
        conf: float = 0.85,
    ):
        if not match or value is None or not str(value).strip():
            fields.append(ExtractedField(name, None, unit, category, None, None, None, None, None))
            return
        start, end = match.span()
        snippet = text[max(0, start - 90) : min(len(text), end + 90)].replace("\n", " ").strip()
        fields.append(
            ExtractedField(
                field_name=name,
                value=str(value).strip(),
                unit=unit,
                category=category,
                confidence=round(conf, 2),
                page_number=_page_of(text, start),
                snippet=snippet,
                start_char=start,
                end_char=end,
            )
        )

    # 1. WELL INFORMATION
    # Strict well uid check first
    wm = SYN_WELL_STRICT_RE.search(text) or WELL_RE.search(text)
    well_val = wm.group(1).upper() if wm else None
    add("well_uid", "well_info", wm, well_val, conf=0.92 if wm else 0)

    wm_name = re.search(r"\b(?:well\s*name)\s*[:=]\s*([A-Za-z0-9\s_-]+?)(?:\r?\n|;|,)", text, re.I)
    add("well_name", "well_info", wm_name, wm_name.group(1) if wm_name else well_val, conf=0.88)

    op = OPERATOR_RE.search(text) or re.search(r"\b(Oil India Limited|OIL|ONGC)\b", text, re.I)
    add("operator", "well_info", op, op.group(1) if op else None, conf=0.85)

    fld = FIELD_RE.search(text)
    add("field", "well_info", fld, fld.group(1) if fld else None, conf=0.82)

    bsn = BASIN_RE.search(text) or re.search(r"\b(Upper Assam|Assam-Arakan|Rajasthan|Cambay)\s*Basin\b", text, re.I)
    add("basin", "well_info", bsn, bsn.group(1) if bsn else None, conf=0.84)

    st = STATE_RE.search(text) or re.search(r"\b(Assam|Arunachal Pradesh|Tripura|Gujarat|Rajasthan)\b", text, re.I)
    add("state", "well_info", st, st.group(1) if st else None, conf=0.85)

    dst = DISTRICT_RE.search(text) or re.search(r"\b(Dibrugarh|Tinsukia|Sivasagar|Jorhat)\b", text, re.I)
    add("district", "well_info", dst, dst.group(1) if dst else None, conf=0.85)

    lat_lon = LAT_LON_RE.search(text)
    if lat_lon:
        add("latitude", "well_info", lat_lon, lat_lon.group(1), unit="deg", conf=0.90)
        add("longitude", "well_info", lat_lon, lat_lon.group(2), unit="deg", conf=0.90)
    else:
        add("latitude", "well_info", None, None)
        add("longitude", "well_info", None, None)

    dm = DATE_RE.search(text)
    add("date", "well_info", dm, dm.group(1) if dm else None, conf=0.85)

    spud = SPUD_DATE_RE.search(text)
    add("spud_date", "well_info", spud, spud.group(1) if spud else (dm.group(1) if dm else None), conf=0.88)

    comp = COMPLETION_DATE_RE.search(text)
    add("completion_date", "well_info", comp, comp.group(1) if comp else None, conf=0.88)

    md = MD_RE.search(text)
    if md:
        unit_str = md.group(2) or "m"
        meters = _to_meters(float(md.group(1)), unit_str)
        add("md_m", "well_info", md, f"{meters:.2f}", unit="m", conf=0.90)
        add("total_depth_md_m", "well_info", md, f"{meters:.2f}", unit="m", conf=0.90)
    else:
        add("md_m", "well_info", None, None)
        add("total_depth_md_m", "well_info", None, None)

    tvd = TVD_RE.search(text)
    if tvd:
        unit_str = tvd.group(2) or "m"
        meters = _to_meters(float(tvd.group(1)), unit_str)
        add("tvd_m", "well_info", tvd, f"{meters:.2f}", unit="m", conf=0.86)
        add("total_depth_tvd_m", "well_info", tvd, f"{meters:.2f}", unit="m", conf=0.86)
    else:
        add("tvd_m", "well_info", None, None)
        add("total_depth_tvd_m", "well_info", None, None)

    kb = KB_RE.search(text)
    if kb:
        unit_str = kb.group(2) or "m"
        meters = _to_meters(float(kb.group(1)), unit_str)
        add("kelly_bushing_m", "well_info", kb, f"{meters:.2f}", unit="m", conf=0.84)
    else:
        add("kelly_bushing_m", "well_info", None, None)

    # 2. DRILLING INFORMATION
    mw = MW_RE.search(text)
    if mw:
        add("mud_weight", "drilling_info", mw, mw.group(1), unit=mw.group(2) or "sg", conf=0.85)
    else:
        add("mud_weight", "drilling_info", None, None)

    mtype = MUD_TYPE_RE.search(text)
    add("mud_type", "drilling_info", mtype, mtype.group(1) if mtype else None, conf=0.80)

    bsize = BIT_SIZE_RE.search(text)
    add("bit_size", "drilling_info", bsize, bsize.group(1) if bsize else None, unit="in", conf=0.82)

    csg = CASING_RE.search(text)
    if csg:
        add("casing_size", "drilling_info", csg, csg.group(1), unit="in", conf=0.85)
        if csg.group(2):
            add("casing_depth_m", "drilling_info", csg, csg.group(2), unit="m", conf=0.82)
        else:
            add("casing_depth_m", "drilling_info", None, None)
    else:
        add("casing_size", "drilling_info", None, None)
        add("casing_depth_m", "drilling_info", None, None)

    # 3. FORMATION & OPERATIONAL EVENTS
    fm = FM_RE.search(text)
    add("formation", "operational_events", fm, fm.group(1).upper() if fm else None, conf=0.87)

    event_type = None
    event_match = None
    for name, cre in EVENT_PATTERNS:
        m = cre.search(text)
        if m:
            event_type = name
            event_match = m
            break
    add("event_type", "operational_events", event_match, event_type, conf=0.88 if event_match else 0)

    sev = re.search(r"\b(?:severity|risk\s*level)\s*[:=]?\s*(critical|high|medium|low)\b", text, re.I)
    add("severity", "operational_events", sev, sev.group(1).lower() if sev else "medium", conf=0.80)

    npt = NPT_RE.search(text)
    add("npt_hours", "operational_events", npt, npt.group(1) if npt else None, unit="hours", conf=0.80)

    mit = re.search(r"\b(?:mitigation|action\s*taken|remedy)\s*[:\-]\s*(.+)", text, re.I)
    add("mitigation", "operational_events", mit, mit.group(1).strip()[:350] if mit else None, conf=0.75)

    out = re.search(r"\b(?:outcome|result|current\s*status)\s*[:\-]\s*(.+)", text, re.I)
    add("outcome", "operational_events", out, out.group(1).strip()[:350] if out else None, conf=0.75)

    les = re.search(r"\b(?:lesson(?:s)?\s*learned|recommendation)\s*[:\-]\s*(.+)", text, re.I)
    add("lesson_learned", "operational_events", les, les.group(1).strip()[:350] if les else None, conf=0.75)

    return fields
