from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4


from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    JSON,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID

from app.database import Base, engine

is_sqlite = engine.name == "sqlite"

if is_sqlite:
    def Geography(*args, **kwargs):
        return String()
    JSONB = JSON
else:
    from geoalchemy2 import Geography
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255))
    hashed_password: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(32), index=True)  # admin, drilling_engineer, geologist, viewer
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    audit_logs: Mapped[list["AuditLog"]] = relationship(back_populates="user")


class Well(Base):
    __tablename__ = "wells"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    well_uid: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(32), index=True)
    operator: Mapped[str] = mapped_column(String(255), default="SYNTHETIC DEMO OPERATOR")
    field_name: Mapped[str] = mapped_column(String(255), default="NWIS Synthetic Block A")
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    location = mapped_column(Geography(geometry_type="POINT", srid=4326), nullable=True)
    kelly_bushing_m: Mapped[float] = mapped_column(Float, default=0.0)
    total_depth_md_m: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    total_depth_tvd_m: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    spud_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active_demo: Mapped[bool] = mapped_column(Boolean, default=False)
    data_provenance: Mapped[str] = mapped_column(Text, default="SYNTHETIC DEMO DATA — not operational survey")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    surveys: Mapped[list["WellSurvey"]] = relationship(back_populates="well", cascade="all, delete-orphan")
    formation_intervals: Mapped[list["WellFormationInterval"]] = relationship(
        back_populates="well", cascade="all, delete-orphan"
    )
    drilling_parameters: Mapped[list["DrillingParameter"]] = relationship(
        back_populates="well", cascade="all, delete-orphan"
    )
    events: Mapped[list["OperationalEvent"]] = relationship(back_populates="well", cascade="all, delete-orphan")
    casing_records: Mapped[list["CasingRecord"]] = relationship(back_populates="well", cascade="all, delete-orphan")
    mud_programs: Mapped[list["MudProgram"]] = relationship(back_populates="well", cascade="all, delete-orphan")
    cementing_records: Mapped[list["CementingRecord"]] = relationship(
        back_populates="well", cascade="all, delete-orphan"
    )
    documents: Mapped[list["Document"]] = relationship(back_populates="well")


class WellSurvey(Base):
    __tablename__ = "well_surveys"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    well_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("wells.id"), index=True)
    md_m: Mapped[float] = mapped_column(Float)
    tvd_m: Mapped[float] = mapped_column(Float)
    inclination_deg: Mapped[float] = mapped_column(Float)
    azimuth_deg: Mapped[float] = mapped_column(Float)
    northing_m: Mapped[float] = mapped_column(Float, default=0.0)
    easting_m: Mapped[float] = mapped_column(Float, default=0.0)

    well: Mapped[Well] = relationship(back_populates="surveys")


class Formation(Base):
    __tablename__ = "formations"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    code: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    lithology: Mapped[str] = mapped_column(String(128))
    notes: Mapped[str] = mapped_column(Text, default="Synthetic formation catalog for demo only.")

    intervals: Mapped[list["WellFormationInterval"]] = relationship(back_populates="formation")


class WellFormationInterval(Base):
    __tablename__ = "well_formation_intervals"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    well_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("wells.id"), index=True)
    formation_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("formations.id"), index=True)
    top_md_m: Mapped[float] = mapped_column(Float)
    bottom_md_m: Mapped[float] = mapped_column(Float)
    top_tvd_m: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    bottom_tvd_m: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    well: Mapped[Well] = relationship(back_populates="formation_intervals")
    formation: Mapped[Formation] = relationship(back_populates="intervals")

    __table_args__ = (Index("ix_wfi_well_md", "well_id", "top_md_m", "bottom_md_m"),)


class DrillingParameter(Base):
    __tablename__ = "drilling_parameters"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    well_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("wells.id"), index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    md_m: Mapped[float] = mapped_column(Float)
    tvd_m: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    bit_depth_m: Mapped[float] = mapped_column(Float)
    rop_m_per_hr: Mapped[float] = mapped_column(Float)
    wob_kn: Mapped[float] = mapped_column(Float)
    torque_knm: Mapped[float] = mapped_column(Float)
    rpm: Mapped[float] = mapped_column(Float)
    spp_kpa: Mapped[float] = mapped_column(Float)
    flow_in_lpm: Mapped[float] = mapped_column(Float)
    flow_out_lpm: Mapped[float] = mapped_column(Float)
    mud_weight_sg: Mapped[float] = mapped_column(Float)
    pit_volume_m3: Mapped[float] = mapped_column(Float)
    is_simulated: Mapped[bool] = mapped_column(Boolean, default=True)
    source: Mapped[str] = mapped_column(String(64), default="synthetic_seed")

    well: Mapped[Well] = relationship(back_populates="drilling_parameters")

    __table_args__ = (Index("ix_dp_well_ts", "well_id", "timestamp"), Index("ix_dp_well_md", "well_id", "md_m"))


class OperationalEvent(Base):
    __tablename__ = "operational_events"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    well_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("wells.id"), index=True)
    event_type: Mapped[str] = mapped_column(String(64), index=True)
    severity: Mapped[str] = mapped_column(String(16), index=True)
    md_m: Mapped[float] = mapped_column(Float)
    tvd_m: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    formation_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False), ForeignKey("formations.id"), nullable=True, index=True
    )
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    npt_hours: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    lesson_learned: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    outcome: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    document_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False), ForeignKey("documents.id"), nullable=True
    )
    evidence_snippet_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False), ForeignKey("evidence_snippets.id"), nullable=True
    )
    published: Mapped[bool] = mapped_column(Boolean, default=True)
    data_provenance: Mapped[str] = mapped_column(Text, default="SYNTHETIC DEMO DATA")

    well: Mapped[Well] = relationship(back_populates="events")
    formation: Mapped[Optional[Formation]] = relationship()
    mitigations: Mapped[list["MitigationAction"]] = relationship(
        back_populates="event", cascade="all, delete-orphan"
    )


class MitigationAction(Base):
    __tablename__ = "mitigation_actions"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    event_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("operational_events.id"), index=True)
    action: Mapped[str] = mapped_column(Text)
    result: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    sequence: Mapped[int] = mapped_column(Integer, default=1)

    event: Mapped[OperationalEvent] = relationship(back_populates="mitigations")


class CasingRecord(Base):
    __tablename__ = "casing_records"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    well_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("wells.id"), index=True)
    string_name: Mapped[str] = mapped_column(String(64))
    od_in: Mapped[float] = mapped_column(Float)
    setting_depth_md_m: Mapped[float] = mapped_column(Float)
    setting_depth_tvd_m: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    grade: Mapped[str] = mapped_column(String(32), default="SYN-J55")
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    well: Mapped[Well] = relationship(back_populates="casing_records")


class MudProgram(Base):
    __tablename__ = "mud_programs"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    well_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("wells.id"), index=True)
    interval_top_md_m: Mapped[float] = mapped_column(Float)
    interval_bottom_md_m: Mapped[float] = mapped_column(Float)
    mud_type: Mapped[str] = mapped_column(String(64))
    mud_weight_sg: Mapped[float] = mapped_column(Float)
    pv_cp: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    yp_pa: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    well: Mapped[Well] = relationship(back_populates="mud_programs")


class CementingRecord(Base):
    __tablename__ = "cementing_records"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    well_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("wells.id"), index=True)
    job_name: Mapped[str] = mapped_column(String(128))
    md_m: Mapped[float] = mapped_column(Float)
    slurry_density_sg: Mapped[float] = mapped_column(Float)
    volume_m3: Mapped[float] = mapped_column(Float)
    result: Mapped[str] = mapped_column(Text)
    issues: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    well: Mapped[Well] = relationship(back_populates="cementing_records")


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    well_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False), ForeignKey("wells.id"), nullable=True, index=True
    )
    original_filename: Mapped[str] = mapped_column(String(512))
    stored_filename: Mapped[str] = mapped_column(String(512))
    content_type: Mapped[str] = mapped_column(String(128))
    size_bytes: Mapped[int] = mapped_column(Integer)
    document_type: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, default="OTHER")
    classification_confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    file_hash: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    page_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=1)
    status: Mapped[str] = mapped_column(String(32), index=True, default="uploaded")
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    extracted_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ocr_used: Mapped[bool] = mapped_column(Boolean, default=False)
    uploaded_by: Mapped[Optional[str]] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    well: Mapped[Optional[Well]] = relationship(back_populates="documents")
    extractions: Mapped[list["DocumentExtraction"]] = relationship(
        back_populates="document", cascade="all, delete-orphan"
    )
    evidence: Mapped[list["EvidenceSnippet"]] = relationship(
        back_populates="document", cascade="all, delete-orphan"
    )


class DocumentExtraction(Base):
    __tablename__ = "document_extractions"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    document_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("documents.id"), index=True)
    category: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, default="general")
    field_name: Mapped[str] = mapped_column(String(128), index=True)
    value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    unit: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    page_number: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    evidence_snippet_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False), ForeignKey("evidence_snippets.id"), nullable=True
    )
    reviewer_value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="pending_review")
    invented: Mapped[bool] = mapped_column(Boolean, default=False)

    document: Mapped[Document] = relationship(back_populates="extractions")


class EvidenceSnippet(Base):
    __tablename__ = "evidence_snippets"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    document_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("documents.id"), index=True)
    page_number: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    snippet: Mapped[str] = mapped_column(Text)
    start_char: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    end_char: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    document: Mapped[Document] = relationship(back_populates="evidence")


class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    well_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("wells.id"), index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)
    md_m: Mapped[float] = mapped_column(Float)
    category: Mapped[str] = mapped_column(String(64), index=True)
    score: Mapped[float] = mapped_column(Float)
    severity: Mapped[str] = mapped_column(String(16))
    contributing_factors: Mapped[dict] = mapped_column(JSONB, default=dict)
    matched_event_ids: Mapped[list] = mapped_column(JSONB, default=list)
    evidence: Mapped[str] = mapped_column(Text)
    confidence: Mapped[float] = mapped_column(Float)
    limitations: Mapped[str] = mapped_column(Text)
    suggested_actions: Mapped[list] = mapped_column(JSONB, default=list)
    engine: Mapped[str] = mapped_column(String(32), default="rules")
    model_version: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    disclaimer: Mapped[str] = mapped_column(
        Text,
        default="PROTOTYPE DECISION SUPPORT ONLY — not validated operational advice. Does not control equipment.",
    )


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    well_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("wells.id"), index=True)
    risk_assessment_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False), ForeignKey("risk_assessments.id"), nullable=True
    )
    event_type: Mapped[str] = mapped_column(String(64), index=True)
    severity: Mapped[str] = mapped_column(String(16), index=True)
    title: Mapped[str] = mapped_column(String(255))
    message: Mapped[str] = mapped_column(Text)
    md_m: Mapped[float] = mapped_column(Float)
    matched_well_ids: Mapped[list] = mapped_column(JSONB, default=list)
    matched_event_ids: Mapped[list] = mapped_column(JSONB, default=list)
    distance_km: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    evidence: Mapped[str] = mapped_column(Text)
    recommendation: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(32), default="open", index=True)
    fingerprint: Mapped[str] = mapped_column(String(128), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    cooldown_until: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    actions: Mapped[list["AlertAction"]] = relationship(back_populates="alert", cascade="all, delete-orphan")


class AlertAction(Base):
    __tablename__ = "alert_actions"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    alert_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("alerts.id"), index=True)
    user_id: Mapped[Optional[str]] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=True)
    action: Mapped[str] = mapped_column(String(32))
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    alert: Mapped[Alert] = relationship(back_populates="actions")


class DataSource(Base):
    __tablename__ = "data_sources"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    code: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    kind: Mapped[str] = mapped_column(String(64))
    status: Mapped[str] = mapped_column(String(32), default="synthetic")
    details: Mapped[str] = mapped_column(Text)
    last_heartbeat: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[Optional[str]] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=True)
    action: Mapped[str] = mapped_column(String(128), index=True)
    entity_type: Mapped[str] = mapped_column(String(64), index=True)
    entity_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    user: Mapped[Optional[User]] = relationship(back_populates="audit_logs")


class AppSetting(Base):
    __tablename__ = "app_settings"
    __table_args__ = (UniqueConstraint("key"),)

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    key: Mapped[str] = mapped_column(String(128), index=True)
    value: Mapped[str] = mapped_column(Text)
    description: Mapped[str] = mapped_column(Text, default="")
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
