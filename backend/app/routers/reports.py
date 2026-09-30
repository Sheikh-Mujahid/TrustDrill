import csv
import io
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import OperationalEvent, RiskAssessment, User, Well
from app.security import get_current_user

router = APIRouter(prefix="/reports", tags=["reports"])

DISCLAIMER = (
    "SYNTHETIC DEMO DATA. Prototype decision support only. "
    "Not Oil India Limited operational data. Not validated drilling predictions."
)


@router.get("/wells.csv")
def wells_csv(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    output = io.StringIO()
    w = csv.writer(output)
    w.writerow(["disclaimer", DISCLAIMER])
    w.writerow(["well_uid", "name", "status", "lat", "lon", "td_md_m", "td_tvd_m", "provenance"])
    for well in db.query(Well).order_by(Well.well_uid):
        w.writerow(
            [
                well.well_uid,
                well.name,
                well.status,
                well.latitude,
                well.longitude,
                well.total_depth_md_m,
                well.total_depth_tvd_m,
                well.data_provenance,
            ]
        )
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=nwis_wells_demo.csv"},
    )


@router.get("/events.csv")
def events_csv(well_id: str | None = None, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    q = db.query(OperationalEvent).options(joinedload(OperationalEvent.well), joinedload(OperationalEvent.formation))
    if well_id:
        q = q.filter(OperationalEvent.well_id == well_id)
    output = io.StringIO()
    w = csv.writer(output)
    w.writerow(["disclaimer", DISCLAIMER])
    w.writerow(["well_uid", "event_type", "severity", "md_m", "tvd_m", "formation", "title", "npt_hours", "lesson"])
    for e in q.order_by(OperationalEvent.md_m):
        w.writerow(
            [
                e.well.well_uid if e.well else "",
                e.event_type,
                e.severity,
                e.md_m,
                e.tvd_m,
                e.formation.code if e.formation else "",
                e.title,
                e.npt_hours,
                e.lesson_learned,
            ]
        )
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=nwis_events_demo.csv"},
    )


@router.get("/risk.pdf")
@router.get("/risk_intelligence.pdf")
def risk_pdf(
    well_id: str,
    radius_km: float = Query(25.0, ge=1.0, le=100.0),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    well = db.get(Well, well_id)
    if not well:
        raise HTTPException(404, "Target well not found")

    from app.services.risk_engine import generate_explainable_risk_report

    try:
        report = generate_explainable_risk_report(db, well_id, radius_km)
    except Exception as e:
        raise HTTPException(500, f"Failed to generate risk report: {str(e)}")

    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether, PageBreak
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("RepTitle", parent=styles["Heading1"], fontSize=18, leading=22, textColor=colors.HexColor("#0f172a"))
    h2_style = ParagraphStyle("RepH2", parent=styles["Heading2"], fontSize=12, leading=15, textColor=colors.HexColor("#0f766e"), spaceBefore=10, spaceAfter=4)
    body_style = ParagraphStyle("RepBody", parent=styles["Normal"], fontSize=8.5, leading=11, textColor=colors.HexColor("#334155"))
    meta_style = ParagraphStyle("RepMeta", parent=styles["Normal"], fontSize=8, leading=10, textColor=colors.HexColor("#64748b"))
    disclaimer_style = ParagraphStyle(
        "RepDisc",
        parent=styles["Normal"],
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor("#b45309"),
        backColor=colors.HexColor("#fef3c7"),
        borderColor=colors.HexColor("#f59e0b"),
        borderWidth=0.5,
        borderPadding=4,
        spaceBefore=4,
        spaceAfter=8,
    )
    table_hdr_style = ParagraphStyle("TH", parent=styles["Normal"], fontSize=8, leading=9.5, fontName="Helvetica-Bold", textColor=colors.HexColor("#ffffff"))
    table_cell_style = ParagraphStyle("TC", parent=styles["Normal"], fontSize=7.5, leading=9, textColor=colors.HexColor("#1e293b"))

    elements = []

    # Title & Header
    elements.append(Paragraph("TRUSTDRILL RISK INTELLIGENCE REPORT", title_style))
    elements.append(Paragraph("Automated Offset Well Correlation & Explainable Hazard Assessment", meta_style))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph(
        "<b>PROTOTYPE DECISION-SUPPORT SYSTEM:</b> All data, wells, and drilling parameters shown are synthetic demo records for SIH 26121. "
        "Historical frequency does not guarantee future occurrence. System does not predict drilling events with absolute certainty.",
        disclaimer_style,
    ))
    elements.append(Spacer(1, 4))

    # 1. Target Well Section
    elements.append(Paragraph("1. Target Well Technical Profile", h2_style))
    tw = report.target_well
    target_data = [
        [Paragraph("<b>Well UID</b>", table_cell_style), Paragraph(tw.well_uid or "", table_cell_style),
         Paragraph("<b>Well Name</b>", table_cell_style), Paragraph(tw.name or "", table_cell_style)],
        [Paragraph("<b>Status</b>", table_cell_style), Paragraph(str(tw.status or "").upper(), table_cell_style),
         Paragraph("<b>Field / Basin</b>", table_cell_style), Paragraph(tw.field_name or "Synthetic Block", table_cell_style)],
        [Paragraph("<b>Total Depth MD</b>", table_cell_style), Paragraph(f"{tw.total_depth_md_m or 'N/A'} m", table_cell_style),
         Paragraph("<b>Surface Coordinates</b>", table_cell_style), Paragraph(f"{tw.latitude:.4f}°N, {tw.longitude:.4f}°E", table_cell_style)],
        [Paragraph("<b>Data Provenance</b>", table_cell_style), Paragraph(tw.data_provenance or "SYNTHETIC DEMO", table_cell_style),
         Paragraph("<b>Search Radius</b>", table_cell_style), Paragraph(f"{report.radius_km} km", table_cell_style)],
    ]
    t_target = Table(target_data, colWidths=[90, 175, 90, 185])
    t_target.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    elements.append(t_target)
    elements.append(Spacer(1, 6))

    # 2 & 3. Nearby & Comparable Wells
    elements.append(Paragraph("2. Nearby & Comparable Wells Summary", h2_style))
    elements.append(Paragraph(
        f"Identified <b>{len(report.comparable_wells)}</b> comparable offset wells within {report.radius_km} km radius. "
        "Ranking methodology incorporates distance (35%), formation similarity (25%), depth proximity (20%), field (10%), and basin (10%).",
        body_style,
    ))
    elements.append(Spacer(1, 3))

    comp_rows = [[
        Paragraph("Well UID", table_hdr_style),
        Paragraph("Distance", table_hdr_style),
        Paragraph("TD (m)", table_hdr_style),
        Paragraph("Sim Score", table_hdr_style),
        Paragraph("Events", table_hdr_style),
        Paragraph("Primary Formations", table_hdr_style),
    ]]
    for cw in report.comparable_wells[:6]:
        comp_rows.append([
            Paragraph(cw.well.well_uid if cw.well else "N/A", table_cell_style),
            Paragraph(f"{cw.distance_km:.1f} km", table_cell_style),
            Paragraph(str(cw.well.total_depth_md_m if cw.well else "N/A"), table_cell_style),
            Paragraph(f"{cw.similarity_score:.2f}", table_cell_style),
            Paragraph(str(cw.event_count), table_cell_style),
            Paragraph(cw.formation_code or "Regional", table_cell_style),
        ])
    t_comp = Table(comp_rows, colWidths=[80, 60, 60, 65, 50, 225])
    t_comp.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f766e')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#ffffff'), colors.HexColor('#f1f5f9')]),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
    ]))
    elements.append(t_comp)
    elements.append(Spacer(1, 6))

    # 4 & 5. Explainable Risk Indicators
    elements.append(Paragraph("3. Explainable Risk Indicators & Historical Evidence", h2_style))
    for ind in report.indicators:
        risk_color = "#dc2626" if ind.indicator_level == "HIGH" else ("#d97706" if ind.indicator_level == "MEDIUM" else "#16a34a")
        supporting_wells_str = ", ".join(w.get("well_uid", "") for w in ind.supporting_wells) if ind.supporting_wells else "None"
        ind_data = [
            [
                Paragraph(f"<b>{ind.title.upper()}</b>", table_hdr_style),
                Paragraph(f"<b>LEVEL: {ind.indicator_level}</b>", table_hdr_style),
                Paragraph(f"<b>Occurrence: {ind.historical_occurrence}</b>", table_hdr_style),
            ],
            [
                Paragraph(
                    f"<b>Reasoning:</b> {ind.explanation}<br/>"
                    f"<b>Depth Overlap:</b> {'Yes (within interval)' if ind.depth_overlap else 'No'} | "
                    f"<b>Formation:</b> {ind.formation_name or 'Regional interval'} | "
                    f"<b>Supporting Wells:</b> {supporting_wells_str}",
                    table_cell_style,
                ),
                "",
                "",
            ],
        ]
        t_ind = Table(ind_data, colWidths=[200, 140, 200])
        t_ind.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor(risk_color)),
            ('SPAN', (0,1), (2,1)),
            ('BACKGROUND', (0,1), (-1,1), colors.HexColor('#f8fafc')),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
            ('TOPPADDING', (0,0), (-1,-1), 2.5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ]))
        elements.append(t_ind)
        elements.append(Spacer(1, 3))

        # Citations under indicator
        if ind.evidence:
            cit_rows = [[
                Paragraph("Well", table_hdr_style),
                Paragraph("Event / MD", table_hdr_style),
                Paragraph("Document & Page Citation", table_hdr_style),
            ]]
            for c_item in ind.evidence[:4]:
                cit_rows.append([
                    Paragraph(c_item.well_uid, table_cell_style),
                    Paragraph(f"MD {c_item.event_depth_md_m}m", table_cell_style),
                    Paragraph(f"<b>{c_item.document_filename}</b> (p.{c_item.page_number}): \"{(c_item.evidence_snippet or '')[:90]}...\"", table_cell_style),
                ])
            t_cit = Table(cit_rows, colWidths=[75, 125, 340])
            t_cit.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#334155')),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
                ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#ffffff'), colors.HexColor('#f8fafc')]),
                ('TOPPADDING', (0,0), (-1,-1), 2),
                ('BOTTOMPADDING', (0,0), (-1,-1), 2),
            ]))
            elements.append(t_cit)
        elements.append(Spacer(1, 4))

    # 6. Methodology & Limitations
    elements.append(Paragraph("4. Methodology & Engineering Limitations", h2_style))
    elements.append(Paragraph(
        "<b>Similarity Formula:</b> Score = 0.35·Distance + 0.25·Formation + 0.20·Depth + 0.10·Field + 0.10·Basin.<br/>"
        "<b>Explainability Guarantee:</b> Indicators reflect strictly observed historical occurrences from published drilling logs. "
        "No ungrounded generative probability numbers are manufactured.",
        body_style,
    ))
    elements.append(Spacer(1, 3))
    for lim in report.limitations:
        elements.append(Paragraph(f"• {lim}", meta_style))

    doc.build(elements)
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=trustdrill_risk_report_{well.well_uid}.pdf"},
    )


@router.get("/risk_intelligence.json")
def risk_json(
    well_id: str,
    radius_km: float = Query(25.0, ge=1.0, le=100.0),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    well = db.get(Well, well_id)
    if not well:
        raise HTTPException(404, "Target well not found")

    from app.services.risk_engine import generate_explainable_risk_report

    try:
        report = generate_explainable_risk_report(db, well_id, radius_km)
        return report
    except Exception as e:
        raise HTTPException(500, f"Failed to generate risk report JSON: {str(e)}")
