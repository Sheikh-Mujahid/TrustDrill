from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    demo_auth: bool = True
    disclaimer: str = "DEMO AUTHENTICATION — not production-grade identity."
    user: "UserOut"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(ORMModel):
    id: str
    email: EmailStr
    full_name: str
    role: str
    is_active: bool


class Paginated(BaseModel):
    items: list[Any]
    total: int
    page: int
    page_size: int


class WellSummary(ORMModel):
    id: str
    well_uid: str
    name: str
    status: str
    operator: Optional[str] = "Oil India Limited (Synthetic)"
    field_name: Optional[str] = "Synthetic Block"
    latitude: float
    longitude: float
    total_depth_md_m: Optional[float] = None
    total_depth_tvd_m: Optional[float] = None
    is_active_demo: Optional[bool] = False
    data_provenance: Optional[str] = "SYNTHETIC DEMO"
    event_count: int = 0
    formation_count: int = 0


class WellCreate(BaseModel):
    well_uid: str = Field(min_length=3, max_length=64)
    name: str
    status: str = "drilled"
    latitude: float
    longitude: float
    total_depth_md_m: Optional[float] = None
    total_depth_tvd_m: Optional[float] = None


class NearbyWell(WellSummary):
    distance_km: float
    formations: list[str] = Field(default_factory=list)
    recent_events: list[str] = Field(default_factory=list)
    highest_severity: Optional[str] = None


class SurveyOut(ORMModel):
    id: str
    md_m: float
    tvd_m: float
    inclination_deg: float
    azimuth_deg: float
    northing_m: float
    easting_m: float


class FormationOut(ORMModel):
    id: str
    code: str
    name: str
    lithology: str


class FormationIntervalOut(ORMModel):
    id: str
    top_md_m: float
    bottom_md_m: float
    top_tvd_m: Optional[float]
    bottom_tvd_m: Optional[float]
    formation: FormationOut


class EventOut(ORMModel):
    id: str
    well_id: str
    event_type: str
    severity: str
    md_m: float
    tvd_m: Optional[float]
    title: str
    description: str
    npt_hours: Optional[float]
    lesson_learned: Optional[str]
    outcome: Optional[str]
    occurred_at: datetime
    published: bool
    data_provenance: str
    formation: Optional[FormationOut] = None


class MitigationOut(ORMModel):
    id: str
    action: str
    result: Optional[str]
    sequence: int


class CasingOut(ORMModel):
    id: str
    string_name: str
    od_in: float
    setting_depth_md_m: float
    setting_depth_tvd_m: Optional[float]
    grade: str
    notes: Optional[str]


class MudOut(ORMModel):
    id: str
    interval_top_md_m: float
    interval_bottom_md_m: float
    mud_type: str
    mud_weight_sg: float
    pv_cp: Optional[float]
    yp_pa: Optional[float]
    notes: Optional[str]


class CementOut(ORMModel):
    id: str
    job_name: str
    md_m: float
    slurry_density_sg: float
    volume_m3: float
    result: str
    issues: Optional[str]


class TelemetryOut(ORMModel):
    id: str
    timestamp: datetime
    md_m: float
    tvd_m: Optional[float]
    bit_depth_m: float
    rop_m_per_hr: float
    wob_kn: float
    torque_knm: float
    rpm: float
    spp_kpa: float
    flow_in_lpm: float
    flow_out_lpm: float
    mud_weight_sg: float
    pit_volume_m3: float
    is_simulated: bool
    source: str


class DocumentOut(ORMModel):
    id: str
    well_id: Optional[str] = None
    original_filename: str
    content_type: str
    size_bytes: int
    document_type: Optional[str] = "OTHER"
    classification_confidence: Optional[float] = None
    file_hash: Optional[str] = None
    page_count: Optional[int] = 1
    status: str
    error_message: Optional[str] = None
    ocr_used: bool = False
    created_at: datetime


class ExtractionOut(ORMModel):
    id: str
    category: Optional[str] = "general"
    field_name: str
    value: Optional[str] = None
    unit: Optional[str] = None
    confidence: Optional[float] = None
    page_number: Optional[int] = None
    snippet: Optional[str] = None
    start_char: Optional[int] = None
    end_char: Optional[int] = None
    reviewer_value: Optional[str] = None
    status: str = "pending_review"
    invented: bool = False


class EvidenceOut(ORMModel):
    id: str
    page_number: Optional[int]
    snippet: str
    start_char: Optional[int] = None
    end_char: Optional[int] = None


class ExtractionReviewItem(BaseModel):
    extraction_id: str
    reviewer_value: Optional[str] = None
    status: str = "approved"


class PublishRequest(BaseModel):
    well_id: Optional[str] = None
    reviews: list[ExtractionReviewItem] = Field(default_factory=list)


class KnowledgeHit(BaseModel):
    kind: str
    id: str
    title: str
    snippet: str
    well_uid: Optional[str] = None
    document_filename: Optional[str] = None
    page_number: Optional[int] = None
    event_type: Optional[str] = None
    md_m: Optional[float] = None
    score: float = 0.0


class CorrelationRequest(BaseModel):
    well_id: str
    md_m: float
    radius_km: float = 8.0
    formation_id: Optional[str] = None
    event_type: Optional[str] = None
    depth_window_m: float = 50.0


class SimilarityBreakdown(BaseModel):
    distance_similarity: float
    formation_similarity: float
    depth_similarity: float
    field_similarity: float
    basin_similarity: float
    combined_score: float
    label: str = "Prototype similarity score"


class ComparableWell(BaseModel):
    well: WellSummary
    distance_km: float
    similarity_score: float
    similarity_breakdown: SimilarityBreakdown
    formation_code: Optional[str] = None
    event_count: int = 0
    recent_events: list[str] = Field(default_factory=list)


class RiskEvidenceItem(BaseModel):
    well_uid: str
    distance_km: float
    event_depth_md_m: float
    formation: Optional[str] = None
    document_filename: Optional[str] = None
    page_number: Optional[int] = None
    evidence_snippet: str
    confidence: float = 0.85


class ExplainableRiskIndicator(BaseModel):
    risk_type: str
    title: str
    indicator_level: str  # LOW, MEDIUM, HIGH, CRITICAL
    historical_occurrence: str
    relevant_formation: bool
    formation_name: Optional[str] = None
    depth_overlap: bool
    depth_window: Optional[str] = None
    supporting_well_count: int
    supporting_event_count: int
    explanation: str
    suggested_actions: list[str] = Field(default_factory=list)
    supporting_wells: list[dict] = Field(default_factory=list)
    evidence: list[RiskEvidenceItem] = Field(default_factory=list)


class RiskIntelligenceReport(BaseModel):
    target_well: WellSummary
    radius_km: float
    comparable_wells_count: int
    total_events_count: int
    indicators: list[ExplainableRiskIndicator]
    comparable_wells: list[ComparableWell]
    trends: dict[str, Any] = Field(default_factory=dict)
    limitations: str
    disclaimer: str


class RiskRequest(BaseModel):
    well_id: str
    radius_km: float = 8.0
    include_ml: bool = True


class AlertActionRequest(BaseModel):
    note: Optional[str] = None


class SimulatorControl(BaseModel):
    well_id: Optional[str] = None
    action: str = Field(pattern="^(start|pause|reset)$")
    scenario: str = Field(default="normal", pattern="^(normal|losses|torque_spike|flow_imbalance|pressure_anomaly)$")
    depth_rate_m_per_min: float = 4.0


class SettingUpdate(BaseModel):
    value: str


class ErrorBody(BaseModel):
    detail: str
    code: str = "error"
