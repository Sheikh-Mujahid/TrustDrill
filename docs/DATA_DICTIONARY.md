# Data dictionary (eRTMAC-NWIS demo)

All seeded records are **synthetic**. Identifiers use the `SYN-` prefix. Coordinates are fictional points in **NWIS Synthetic Block A**.

| Entity | PK | Notes |
| --- | --- | --- |
| users | UUID | Demo roles: admin, drilling_engineer, geologist, viewer |
| wells | UUID | `location` geography(Point,4326); `latitude`/`longitude` duplicated for display; MD and TVD stored separately |
| well_surveys | UUID | Trajectory stations: md_m, tvd_m, inclination, azimuth |
| formations | UUID | Catalog codes SYN-FM-ALPHA…ECHO |
| well_formation_intervals | UUID | Per-well MD/TVD tops and bottoms |
| drilling_parameters | UUID | Units: m, m/h, kN, kN·m, rpm, kPa, L/min, sg, m³ |
| operational_events | UUID | event_type, severity, md_m, optional tvd_m, evidence links |
| mitigation_actions | UUID | Ordered actions on an event |
| casing_records | UUID | Setting depths in MD (and optional TVD) |
| mud_programs | UUID | Interval mud weight sg |
| cementing_records | UUID | Job results / issues |
| documents | UUID | Upload metadata, status, extracted_text |
| document_extractions | UUID | Field-level values; `invented` always false from parser |
| evidence_snippets | UUID | Page + excerpt for a fact |
| risk_assessments | UUID | Explainable rule/ML output |
| alerts | UUID | fingerprint + cooldown for dedup |
| alert_actions | UUID | acknowledge/resolve audit |
| data_sources | UUID | Health/provenance of adapters |
| audit_logs | UUID | User actions |
| app_settings | UUID | Demo thresholds (not field-safe) |
