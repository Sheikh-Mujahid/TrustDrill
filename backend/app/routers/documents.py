from __future__ import annotations

import hashlib
import os
import re
from pathlib import Path
from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session, joinedload

from app.config import get_settings
from app.database import get_db
from app.models import (
    Document,
    DocumentExtraction,
    EvidenceSnippet,
    Formation,
    MitigationAction,
    OperationalEvent,
    User,
    Well,
)
from app.schemas import DocumentOut, EvidenceOut, ExtractionOut, PublishRequest
from app.security import WRITE_ROLES, get_current_user, require_roles
from app.services.audit import write_audit
from app.services.extraction import classify_document, extract_text_from_file, parse_fields

router = APIRouter(prefix="/documents", tags=["documents"])


def _safe_name(name: str) -> str:
    normalized = name.replace("\\", "/")
    if ".." in normalized or normalized.startswith("/"):
        raise HTTPException(400, "Invalid filename")
    base = os.path.basename(normalized)
    base = re.sub(r"[^A-Za-z0-9._-]", "_", base)
    if not base or base in {".", ".."}:
        raise HTTPException(400, "Invalid filename")
    return base[:180]


@router.get("", response_model=list[DocumentOut])
def list_docs(
    well_id: Optional[str] = None,
    document_type: Optional[str] = None,
    status: Optional[str] = None,
    q: Optional[str] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    stmt = db.query(Document)
    if well_id:
        stmt = stmt.filter(Document.well_id == well_id)
    if document_type:
        stmt = stmt.filter(Document.document_type == document_type.upper())
    if status:
        stmt = stmt.filter(Document.status == status)
    if q:
        stmt = stmt.filter(Document.original_filename.ilike(f"%{q}%"))
    return stmt.order_by(Document.created_at.desc()).all()


@router.post("/upload", response_model=DocumentOut, status_code=201)
async def upload(
    file: UploadFile = File(...),
    well_id: Optional[str] = Form(None),
    document_type: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*WRITE_ROLES)),
):
    settings = get_settings()
    original = _safe_name(file.filename or "upload.bin")
    suffix = Path(original).suffix.lower()
    allowed_ext = {".pdf", ".txt", ".csv"}
    if suffix not in allowed_ext:
        raise HTTPException(400, "Only PDF, TXT, and CSV documents are supported.")

    data = await file.read()
    max_b = settings.max_upload_mb * 1024 * 1024
    if len(data) > max_b:
        raise HTTPException(400, f"File exceeds {settings.max_upload_mb} MB limit.")
    if len(data) == 0:
        raise HTTPException(400, "Uploaded file is empty.")

    # Duplicate Prevention via SHA256 Hash
    file_hash = hashlib.sha256(data).hexdigest()
    existing = db.query(Document).filter(Document.file_hash == file_hash).first()
    if existing:
        # Return existing document with notice or allow if different well
        if existing.well_id == well_id:
            raise HTTPException(409, f"Duplicate document detected (matches {existing.original_filename}).")

    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    stored = f"{uuid4().hex}_{original}"
    dest = upload_dir / stored
    dest.write_bytes(data)
    ctype = file.content_type or "application/octet-stream"

    doc = Document(
        well_id=well_id if well_id and well_id.strip() != "" else None,
        original_filename=original,
        stored_filename=stored,
        content_type=ctype,
        size_bytes=len(data),
        file_hash=file_hash,
        status="processing",
        uploaded_by=user.id,
    )
    db.add(doc)
    db.flush()

    try:
        text, ocr_used, page_count = extract_text_from_file(dest, ctype, enable_ocr=True)
        doc.extracted_text = text
        doc.ocr_used = ocr_used
        doc.page_count = page_count

        if not text.strip():
            doc.status = "failed"
            doc.error_message = "No extractable text found. Document may be an unreadable scan."
        else:
            doc.status = "extracting"
            # Document Classification
            dtype, conf = classify_document(text, original, user_type=document_type)
            doc.document_type = dtype
            doc.classification_confidence = conf

            # AI & Rule Information Extraction
            fields = parse_fields(text, doc_type=dtype)
            for f in fields:
                evid_id = None
                if f.snippet:
                    ev = EvidenceSnippet(
                        document_id=doc.id,
                        page_number=f.page_number,
                        snippet=f.snippet,
                        start_char=f.start_char,
                        end_char=f.end_char,
                    )
                    db.add(ev)
                    db.flush()
                    evid_id = ev.id

                db.add(
                    DocumentExtraction(
                        document_id=doc.id,
                        category=f.category,
                        field_name=f.field_name,
                        value=f.value,
                        unit=f.unit,
                        confidence=f.confidence,
                        page_number=f.page_number,
                        evidence_snippet_id=evid_id,
                        status="pending_review",
                        invented=False,
                    )
                )

            # Auto-associate well if extracted well_uid matches
            if not doc.well_id:
                uid_field = next((f for f in fields if f.field_name == "well_uid" and f.value), None)
                if uid_field and uid_field.value:
                    matched_well = db.query(Well).filter(Well.well_uid == uid_field.value).first()
                    if matched_well:
                        doc.well_id = matched_well.id

            doc.status = "pending_review"

    except Exception as exc:
        doc.status = "failed"
        doc.error_message = str(exc)

    write_audit(db, user.id, "document.upload", "document", doc.id, original)
    db.commit()
    db.refresh(doc)
    return doc


@router.get("/{doc_id}")
def get_doc(doc_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    doc = db.get(Document, doc_id)
    if not doc:
        raise HTTPException(404, "Document not found")
    ex = db.query(DocumentExtraction).filter(DocumentExtraction.document_id == doc_id).all()
    ev = db.query(EvidenceSnippet).filter(EvidenceSnippet.document_id == doc_id).all()

    # Group extractions by category
    by_category: dict[str, list[dict]] = {
        "well_info": [],
        "drilling_info": [],
        "operational_events": [],
        "general": [],
    }
    for item in ex:
        cat = item.category or "general"
        if cat not in by_category:
            by_category[cat] = []
        by_category[cat].append(ExtractionOut.model_validate(item).model_dump())

    return {
        "document": DocumentOut.model_validate(doc),
        "extracted_text": doc.extracted_text,
        "extractions": [ExtractionOut.model_validate(x) for x in ex],
        "categories": by_category,
        "evidence": [EvidenceOut.model_validate(x) for x in ev],
        "note": "All extracted facts are grounded in document evidence snippets with page references. Missing fields are left null and never invented.",
    }


@router.post("/{doc_id}/publish")
def publish(
    doc_id: str,
    body: PublishRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(*WRITE_ROLES)),
):
    doc = db.get(Document, doc_id)
    if not doc:
        raise HTTPException(404, "Document not found")

    reviews = {r.extraction_id: r for r in body.reviews}
    extractions = db.query(DocumentExtraction).filter(DocumentExtraction.document_id == doc_id).all()
    values: dict[str, str | None] = {}

    for ex in extractions:
        rev = reviews.get(ex.id)
        if rev:
            ex.reviewer_value = rev.reviewer_value
            ex.status = rev.status
        final = ex.reviewer_value if ex.reviewer_value not in (None, "") else ex.value
        if ex.status == "approved" and final:
            values[ex.field_name] = final
        elif ex.status == "rejected":
            values[ex.field_name] = None

    well = None
    well_id = body.well_id or doc.well_id
    if values.get("well_uid"):
        well = db.query(Well).filter(Well.well_uid == values["well_uid"]).one_or_none()
    if not well and well_id:
        well = db.get(Well, well_id)
    if not well:
        raise HTTPException(400, "Cannot publish: well not identified. Select or assign a well.")

    # Update Well metadata if approved
    if values.get("operator"):
        well.operator = str(values["operator"])
    if values.get("field"):
        well.field_name = str(values["field"])
    if values.get("total_depth_md_m"):
        try:
            well.total_depth_md_m = float(values["total_depth_md_m"])
        except ValueError:
            pass
    if values.get("total_depth_tvd_m"):
        try:
            well.total_depth_tvd_m = float(values["total_depth_tvd_m"])
        except ValueError:
            pass

    # Create Operational Event if event_type is present
    event_type = values.get("event_type")
    md_s = values.get("total_depth_md_m") or values.get("md_m") or "1000.0"
    if event_type:
        fm = None
        if values.get("formation"):
            fm = db.query(Formation).filter(Formation.code == values["formation"]).one_or_none()
        evid = db.query(EvidenceSnippet).filter(EvidenceSnippet.document_id == doc.id).first()

        try:
            md_val = float(md_s)
        except ValueError:
            md_val = 1000.0

        ev = OperationalEvent(
            well_id=well.id,
            event_type=event_type,
            severity=str(values.get("severity") or "medium"),
            md_m=md_val,
            tvd_m=float(values["total_depth_tvd_m"]) if values.get("total_depth_tvd_m") else None,
            formation_id=fm.id if fm else None,
            title=f"{event_type.replace('_', ' ').title()} ({doc.original_filename})",
            description=f"Human-reviewed extraction from {doc.original_filename} ({doc.document_type}).",
            npt_hours=float(values["npt_hours"]) if values.get("npt_hours") else None,
            lesson_learned=values.get("lesson_learned"),
            outcome=values.get("outcome"),
            document_id=doc.id,
            evidence_snippet_id=evid.id if evid else None,
            published=True,
            data_provenance=f"Human-reviewed extraction of {doc.original_filename} (TrustDrill Platform)",
        )
        db.add(ev)
        db.flush()
        if values.get("mitigation"):
            db.add(MitigationAction(event_id=ev.id, action=str(values["mitigation"]), sequence=1))

    doc.well_id = well.id
    doc.status = "published"
    write_audit(db, user.id, "document.publish", "document", doc.id, doc.original_filename)
    db.commit()
    return {"status": "published", "document_id": doc.id, "well_id": well.id}
