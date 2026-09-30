// TRUSTDRILL Drilling Intelligence Data Model
// Tailored for Oil India Limited (OIL) - eRTMAC-NWIS | SIH Problem Statement 26121
// Field: Nahorkatiya - Digboi Shelf, Upper Assam Basin

export const ACTIVE_WELL = {
  id: 'TRUST-01',
  name: 'TRUSTDRILL-01 (Exploratory)',
  field: 'Nahorkatiya Extension Block NHK-DIG-04',
  basin: 'Upper Assam Shelf',
  operator: 'Oil India Limited (OIL)',
  rig: 'OIL E-2000 Cyber Rig #14',
  coordinates: {
    lat: 27.312278,
    lng: 95.320222,
    dms: "27°18'44.2\"N 95°19'12.8\"E",
    x: 0,
    y: 0
  },
  spudDate: '12-Aug-2026',
  targetDepth: 3950, // meters MD
  currentDepth: 3420.0, // meters MD
  currentTVD: 3110.4, // meters TVD
  targetFormation: 'Barail Main Sandstone (Oligocene)',
  currentFormation: 'Barail Sandstone (Upper Member)',
  bit: {
    size: '8-1/2"',
    type: 'PDC Matrix (Smith GeoDiamond XR7)',
    nozzles: '5 x 14/32"',
    totalHours: 48.5,
    wearGrade: '1-1-WT-A-X-I-NO-TD'
  },
  telemetry: {
    rop: 14.8, // m/hr
    torque: 24.5, // kNm
    wob: 26.8, // klbs (12.1 tons)
    rpm: 125, // RPM
    mudWeight: 10.4, // ppg (1.25 SG)
    ecd: 10.82, // ppg (Equivalent Circulating Density)
    flowRate: 620, // gpm
    spp: 3150, // psi Standpipe Pressure
    porePressure: 9.6, // ppg
    fractureGradient: 13.8, // ppg
    pitVolume: 142.5, // m³
    flowIn: 620, // gpm
    flowOut: 620, // gpm
    gasUnits: 14 // units
  },
  stratigraphy: [
    { name: 'Alluvium / Dhekiajuli', top: 0, bottom: 650, lithology: 'Unconsolidated sand & gravel' },
    { name: 'Tipam Sandstone', top: 650, bottom: 2100, lithology: 'Coarse massive sandstone' },
    { name: 'Bokabil Formation', top: 2100, bottom: 2750, lithology: 'Shale with thin siltstones' },
    { name: 'Kopili Formation', top: 2750, bottom: 3410, lithology: 'Fissile marine shale & limestone beds' },
    { name: 'Barail Sandstone (Target)', top: 3410, bottom: 3720, lithology: 'Deltaic quartzitic sandstone with coal seams', active: true },
    { name: 'Disang Group', top: 3720, bottom: 3950, lithology: 'Dark splintery slaty shale' }
  ]
};

export const OFFSET_WELLS = [
  {
    id: 'WELL-B',
    officialName: 'OIL-NHK-142',
    field: 'Nahorkatiya Field',
    distanceKm: 1.1,
    azimuthDeg: 42,
    direction: 'NE',
    mapPos: { x: 75, y: -80 }, // relative pixel coords on radar
    totalDepth: 3680,
    similarityScore: 94,
    status: 'PRODUCING OIL / GAS',
    spudDate: '14-Jan-2022',
    completionDate: '03-Apr-2022',
    primaryFormation: 'Barail Sandstone',
    casingSize: '9-5/8" casing @ 3,380 m, 7" liner @ 3,680 m',
    lithologyMatch: '98% identical stratigraphic succession; strong fault-block communication',
    incidents: [
      {
        id: 'INC-142-01',
        type: 'Severe Lost Circulation',
        severity: 'CRITICAL',
        depth: 3485,
        formation: 'Barail Sandstone (Upper Member)',
        summary: 'Total mud loss of 42 m³ occurred upon penetrating fractured sandstone at 3,485 m MD. Initial loss rate 2.4 m³/hr peaking at 6.1 m³/hr.',
        nptHours: 36,
        costImpact: '₹48.5 Lakhs (Rig NPT + Materials)',
        mitigation: 'Spotted 2x 25 bbl high-fluid-loss squeeze pills (Calcium Carbonate 150 + 400 mesh blend). Mud weight reduced from 10.6 ppg to 9.9 ppg.',
        documents: ['WCR-OIL-NHK142-RevC.pdf', 'DDR-NHK142-D48.pdf', 'MudLog-Composite-142.las']
      },
      {
        id: 'INC-142-02',
        type: 'Differential Sticking',
        severity: 'HIGH',
        depth: 3510,
        formation: 'Barail Sandstone (Main Pay)',
        summary: 'Drillstring stuck during connection break due to 480 psi overbalance against depleted permeable sandstone. Zero rotation or pull.',
        nptHours: 12,
        costImpact: '₹18.2 Lakhs',
        mitigation: 'Spotted 30 bbl Pipe-Lax oil-based soaking pill. String freed after 7.5 hours soaking with 45 klbs overpull.',
        documents: ['WCR-OIL-NHK142-RevC.pdf', 'BHA-Run4-DamageAssessment.pdf']
      }
    ],
    documents: [
      {
        id: 'DOC-WCR-142',
        title: 'Well Completion Report (WCR) - OIL-NHK-142',
        type: 'PDF / OCR Extracted',
        date: '12-May-2022',
        pages: 142,
        ocrConfidence: '98.6%',
        source: 'OIL Duliajan Central Archive #WCR-2022-042',
        highlightSnippet: 'At depth 3,485.4 m MD, severe partial-to-total losses encountered in Barail Sand. Loss rate escalated from 2.4 m³/hr to 6.1 m³/hr within 18 minutes. Total mud lost to formation: 42.2 m³. Recommend offset wells prepare 150 bbl heavy LCM pill prior to drilling past 3,450 m.'
      },
      {
        id: 'DOC-DDR-142-48',
        title: 'Daily Drilling Report (DDR) - Day 48 (Shift A/B)',
        type: 'DDR Shift Log',
        date: '28-Feb-2022',
        pages: 6,
        ocrConfidence: '99.1%',
        source: 'eRTMAC Daily Field Telemetry Log',
        highlightSnippet: '04:30 hrs - Drilled 8-1/2" hole from 3,482m to 3,485m. Sudden pit volume drop detected (-4.5 m³ in 12 min). Pump pressure dropped from 3,100 psi to 2,650 psi. Initiated loss control protocol.'
      },
      {
        id: 'DOC-ML-142',
        title: 'Composite Mud Log & Cuttings Lithology (.las)',
        type: 'Mud Log',
        date: '02-Mar-2022',
        pages: 24,
        ocrConfidence: '97.4%',
        source: 'OIL Logging Unit Geo-03',
        highlightSnippet: 'Cuttings at 3,485m: Medium to coarse quartzitic sandstone, highly friable, sub-angular, secondary micro-fractures observed with calcite lining.'
      }
    ]
  },
  {
    id: 'WELL-C',
    officialName: 'OIL-DIG-88',
    field: 'Digboi Shelf Block',
    distanceKm: 2.3,
    azimuthDeg: 318,
    direction: 'NW',
    mapPos: { x: -140, y: -125 },
    totalDepth: 3550,
    similarityScore: 88,
    status: 'COMPLETED / SUSPENDED',
    spudDate: '08-Jun-2021',
    completionDate: '15-Aug-2021',
    primaryFormation: 'Barail Sandstone',
    casingSize: '9-5/8" @ 3,350 m, 7" liner @ 3,550 m',
    lithologyMatch: 'Same stratigraphic sequence, slightly higher dip angle (12° SE)',
    incidents: [
      {
        id: 'INC-DIG88-01',
        type: 'Torque Spikes & Bit Chatter',
        severity: 'MEDIUM',
        depth: 3462,
        formation: 'Barail / Kopili Transition',
        summary: 'Severe stick-slip and torque oscillations exceeding 38 kNm encountered when penetrating cherty interbeds. Resulted in ring-out on PDC bit gauge cutters.',
        nptHours: 8,
        costImpact: '₹9.4 Lakhs',
        mitigation: 'Reduced RPM from 140 to 90; increased WOB smoothly with hydraulic dampener; replaced bit at 3,475 m.',
        documents: ['WCR-DIG88-Final.pdf', 'DDR-DIG88-D39.pdf']
      },
      {
        id: 'INC-DIG88-02',
        type: 'Tight Hole on Tripping',
        severity: 'MEDIUM',
        depth: 3490,
        formation: 'Barail Siltstone Bed',
        summary: 'Swabbing tendency and 35 klbs overpull on 5-stand backreaming run due to reactive clay sloughing.',
        nptHours: 6,
        costImpact: '₹6.8 Lakhs',
        mitigation: 'Treated mud with 4% KCL and glycol shale inhibitor; pumped 20 bbl high-viscosity pill.',
        documents: ['WCR-DIG88-Final.pdf']
      }
    ],
    documents: [
      {
        id: 'DOC-WCR-DIG88',
        title: 'Well Completion Report - OIL-DIG-88',
        type: 'PDF / OCR Extracted',
        date: '20-Sep-2021',
        pages: 98,
        ocrConfidence: '98.1%',
        source: 'OIL Digboi Engineering Office #WCR-2021-088',
        highlightSnippet: 'Interval 3,460–3,495 m exhibited intense micro-fracturing and erratic torque behavior. Drillers should anticipate torque surges and avoid aggressive rotational speeds in offset trajectories.'
      }
    ]
  },
  {
    id: 'WELL-D',
    officialName: 'OIL-KDM-09',
    field: 'Kusijan-Dikom Area',
    distanceKm: 3.1,
    azimuthDeg: 135,
    direction: 'SE',
    mapPos: { x: 165, y: 165 },
    totalDepth: 3820,
    similarityScore: 82,
    status: 'ACTIVE PRODUCER',
    spudDate: '10-Nov-2020',
    completionDate: '24-Feb-2021',
    primaryFormation: 'Barail Sandstone',
    casingSize: '9-5/8" @ 3,410 m, 7" liner @ 3,820 m',
    lithologyMatch: 'Good structural correlation; down-dip fault block segment',
    incidents: [
      {
        id: 'INC-KDM09-01',
        type: 'Gas Influx / Well Kick',
        severity: 'CRITICAL',
        depth: 3508,
        formation: 'Barail Upper Gas Sand',
        summary: '18 bbl gas kick taken at 3,508 m following unexpected 4.2 bar pore pressure surge. Shut-in drillpipe pressure (SIDPP) 280 psi, SICP 410 psi.',
        nptHours: 24,
        costImpact: '₹34.0 Lakhs',
        mitigation: 'Killed well using Wait & Weight method with 10.9 ppg kill mud weight. Flare ignited safely; no release.',
        documents: ['WCR-KDM09.pdf', 'WellControl-IncidentReport-KDM09.pdf']
      }
    ],
    documents: [
      {
        id: 'DOC-WCR-KDM09',
        title: 'Well Completion Report - OIL-KDM-09',
        type: 'PDF / OCR Extracted',
        date: '15-Mar-2021',
        pages: 114,
        ocrConfidence: '97.9%',
        source: 'OIL Kusijan Operations #WCR-2021-009',
        highlightSnippet: 'Isolated channel sand at 3,505–3,518 m carries abnormal pore pressure (10.4 ppg equivalent). Recommended minimum overbalance margin of 0.5 ppg during drilling.'
      }
    ]
  },
  {
    id: 'WELL-E',
    officialName: 'OIL-DGB-104',
    field: 'Digboi Extension',
    distanceKm: 3.8,
    azimuthDeg: 220,
    direction: 'SW',
    mapPos: { x: -140, y: 170 },
    totalDepth: 3400,
    similarityScore: 76,
    status: 'PLUGGED & ABANDONED',
    spudDate: '04-Feb-2019',
    completionDate: '28-Apr-2019',
    primaryFormation: 'Kopili Shale',
    casingSize: '9-5/8" @ 3,200 m',
    lithologyMatch: 'Moderate correlation; bounded by regional strike-slip fault',
    incidents: [
      {
        id: 'INC-DGB104-01',
        type: 'Minor Mud Seepage',
        severity: 'LOW',
        depth: 3380,
        formation: 'Kopili Carbonate Stringer',
        summary: 'Continuous 0.3 m³/hr seepage observed. Pit volume stabilized with fine mica and cellulose fiber.',
        nptHours: 2,
        costImpact: '₹2.1 Lakhs',
        mitigation: 'Treated active system with 15 ppb Fine Mica + Nut Plug.',
        documents: ['WCR-DGB104.pdf']
      }
    ],
    documents: [
      {
        id: 'DOC-WCR-DGB104',
        title: 'End of Well Report - OIL-DGB-104',
        type: 'PDF / OCR Extracted',
        date: '10-May-2019',
        pages: 82,
        ocrConfidence: '96.8%',
        source: 'OIL Historical Archive',
        highlightSnippet: 'Encountered fractured limestone stringer at 3,380 m. Seepage sealed within 2 circulating cycles.'
      }
    ]
  },
  {
    id: 'WELL-F',
    officialName: 'OIL-NHK-119',
    field: 'Nahorkatiya South',
    distanceKm: 4.6,
    azimuthDeg: 185,
    direction: 'S',
    mapPos: { x: -20, y: 235 },
    totalDepth: 3910,
    similarityScore: 71,
    status: 'PRODUCING OIL',
    spudDate: '19-Aug-2017',
    completionDate: '11-Nov-2017',
    primaryFormation: 'Barail / Tipam',
    casingSize: '9-5/8" @ 3,450 m, 5-1/2" casing @ 3,910 m',
    lithologyMatch: 'Distal facies match; depleted pressure zone in Barail Lower Member',
    incidents: [
      {
        id: 'INC-NHK119-01',
        type: 'Depletion Loss & Differential Sticking',
        severity: 'HIGH',
        depth: 3530,
        formation: 'Barail Sandstone (Depleted)',
        summary: 'Reservoir depletion caused effective pore pressure drop to 8.4 ppg. Massive dynamic loss of 28 m³ when drilled with 10.2 ppg mud.',
        nptHours: 18,
        costImpact: '₹22.5 Lakhs',
        mitigation: 'Reduced mud weight to 9.2 ppg; pumped blended bridging pills.',
        documents: ['WCR-NHK119-CoreAnalysis.pdf']
      }
    ],
    documents: [
      {
        id: 'DOC-WCR-NHK119',
        title: 'Well Completion Report - OIL-NHK-119',
        type: 'PDF / OCR Extracted',
        date: '14-Dec-2017',
        pages: 130,
        ocrConfidence: '97.2%',
        source: 'OIL Nahorkatiya Archive #WCR-2017-119',
        highlightSnippet: 'Depleted reservoir pressure regime requires tight mud weight control window (9.2–9.8 ppg) to avoid differential sticking and induced loss.'
      }
    ]
  }
];

// High Risk Zone Definition Ahead of Bit
export const UPCOMING_RISK_ZONE = {
  name: 'Barail Fractured Sandstone & Depleted Loss Zone',
  topDepth: 3450,
  bottomDepth: 3520,
  confidence: '94% (Validated via 3 Offset Wells)',
  primaryHazard: 'Severe Lost Circulation & Differential Sticking',
  secondaryHazard: 'Torque Spikes & Siltstone Interbed Chatter',
  distanceToTop: 30, // meters from 3,420m
  affectedOffsetWells: ['WELL-B (OIL-NHK-142)', 'WELL-C (OIL-DIG-88)', 'WELL-D (OIL-KDM-09)'],
  historicalStats: {
    totalWellsWithIncidents: 3,
    totalMudLost: '88.2 m³',
    totalNptHours: 72,
    maxTorqueSpike: '38.4 kNm',
    estimatedCostRisk: '₹1.05 Crores'
  },
  mitigationAdvisory: [
    {
      step: 1,
      action: 'Stage Loss Circulation Material (LCM) On-Site',
      detail: 'Prepare 100 bbl pill with 30 ppb Calcium Carbonate (blend of 150 & 400 mesh) + 15 ppb resilient graphite on reserve pit #2.',
      priority: 'CRITICAL',
      status: 'RECOMMENDED'
    },
    {
      step: 2,
      action: 'Curtail ROP & Controlled Drill Break',
      detail: 'Limit penetration rate to max 8.0 m/hr when crossing 3,448 m formation top to permit early detection of mud loss / flow differential.',
      priority: 'HIGH',
      status: 'ADVISORY'
    },
    {
      step: 3,
      action: 'Mud Weight & ECD Optimization Window',
      detail: 'Maintain active mud weight strictly between 9.9–10.1 ppg (Current: 10.4 ppg). ECD must not exceed 10.7 ppg to prevent hydraulic fracturing.',
      priority: 'HIGH',
      status: 'ADVISORY'
    },
    {
      step: 4,
      action: 'WITSML Pit Volume & Flow Differential Alert Threshold',
      detail: 'Set automated pit volume delta alarm at ±1.0 m³ and flow out delta at ±5% for instantaneous automated kick/loss notification.',
      priority: 'STANDARD',
      status: 'ACTIVE'
    }
  ]
};

// Simulation Steps for Guided Tour & Live Drilling
export const SIMULATION_STEPS = [
  {
    stepIndex: 0,
    depth: 3420,
    tvd: 3110.4,
    rop: 14.8,
    torque: 24.5,
    wob: 26.8,
    mudWeight: 10.4,
    pitVolumeDelta: 0.0,
    status: 'NORMAL DRILLING',
    alertLevel: 'ADVISORY_MONITORING',
    distanceToRisk: 30,
    message: 'Active well drilling smoothly in upper Barail transition. 30 meters above historical risk zone.'
  },
  {
    stepIndex: 1,
    depth: 3430,
    tvd: 3119.5,
    rop: 13.9,
    torque: 25.8,
    wob: 27.2,
    mudWeight: 10.4,
    pitVolumeDelta: -0.1,
    status: 'TRANSITION DETECTED',
    alertLevel: 'ADVISORY_MONITORING',
    distanceToRisk: 20,
    message: 'Lithology transitioning to interbedded sandstone. Minor torque fluctuations (+1.3 kNm).'
  },
  {
    stepIndex: 2,
    depth: 3440,
    tvd: 3128.6,
    rop: 12.1,
    torque: 28.2,
    wob: 25.5,
    mudWeight: 10.4,
    pitVolumeDelta: -0.3,
    status: 'PROXIMITY WARNING',
    alertLevel: 'ELEVATED_RISK',
    distanceToRisk: 10,
    message: '10 meters to historical loss zone (3,450–3,520m). Correlating with NHK-142 event signatures.'
  },
  {
    stepIndex: 3,
    depth: 3448,
    tvd: 3135.9,
    rop: 9.4,
    torque: 32.6,
    wob: 23.0,
    mudWeight: 10.4,
    pitVolumeDelta: -0.8,
    status: 'IMMINENT RISK INTERFACE',
    alertLevel: 'HIGH_WARNING',
    distanceToRisk: 2,
    message: 'Approaching top of fractured formation. Torque spike to 32.6 kNm. Drilling engineer advisory active.'
  },
  {
    stepIndex: 4,
    depth: 3455,
    tvd: 3142.3,
    rop: 7.2,
    torque: 36.8,
    wob: 21.0,
    mudWeight: 10.2,
    pitVolumeDelta: -2.4,
    status: 'ACTIVE RISK ZONE ENTERED',
    alertLevel: 'CRITICAL_RISK',
    distanceToRisk: 0,
    message: 'Inside historical risk zone! Seepage rate 2.4 m³/hr detected. Proactive LCM pill staged per offset well NHK-142 protocol.'
  }
];

// Pre-indexed AI Copilot Knowledge Base
export const COPILOT_KNOWLEDGE_BASE = [
  {
    queryMatches: ['three relevant offset wells', 'three relevant', 'explain risk', 'approaching historical risk zone', 'approaching risk', 'explain this risk', 'why this risk', 'hazard explanation'],
    title: 'Multi-Well Correlation: Approaching 3,450–3,520 m Barail Hazard Zone',
    insight: 'Three relevant offset wells recorded significant drilling events within this interval. Geological correlation between TRUST-01 and nearby wells confirms an intensely fractured, depleted Barail Sandstone reservoir interval with depleted pore pressure (9.6 ppg) and narrow mud weight tolerance.',
    evidence: '• OIL-NHK-142 (1.1 km NE): 42.2 m³ severe mud loss at 3,485 m (2.4 to 6.1 m³/hr), plus differential sticking at 3,510 m (48h total NPT).\n• OIL-DIG-88 (2.3 km NW): Severe torque spikes reaching 38.4 kNm at 3,462 m; destroyed PDC gauge cutters.\n• OIL-KDM-09 (3.1 km SE): 18 bbl gas influx kick at 3,508 m; required 10.9 ppg kill mud weight.\n• Interval Risk Index: 88 / 100 (High Loss & Sticking Potential).',
    sourceWells: ['WELL-B (OIL-NHK-142)', 'WELL-C (OIL-DIG-88)', 'WELL-D (OIL-KDM-09)'],
    sourceDocuments: [
      { doc: 'WCR-OIL-NHK142-RevC.pdf', page: 'p. 48–52', note: 'Barail Fractured Sandstone Loss Incident' },
      { doc: 'DDR-NHK142-D48.pdf', page: 'p. 2', note: 'Sudden Pit Volume Drop' },
      { doc: 'WCR-DIG88-Final.pdf', page: 'p. 34', note: 'Bit Run #3 Torque Analysis' },
      { doc: 'WellControl-IncidentReport-KDM09.pdf', page: 'p. 4', note: '18 bbl Gas Influx SIDPP Record' }
    ],
    confidence: '99.2%',
    recommendation: 'Pre-stage 100 bbl Calcium Carbonate (150/400 mesh) LCM pill on pit #2. Curtail ROP to < 8.0 m/hr upon crossing 3,448 m top. Maintain mud weight at 9.9–10.1 ppg.'
  },
  {
    queryMatches: ['3500', '3,500', 'near 3,500', 'around 3500', 'what happened'],
    title: 'Drilling Hazards in the 3,450–3,520 m Barail Sandstone Interval',
    insight: 'Within the 3,450–3,520 m interval, three offset wells in the Nahorkatiya block recorded severe drilling dysfunctions: catastrophic lost circulation (42 m³ in NHK-142), gas influx kick (18 bbl in KDM-09), and bit-damaging torque oscillations (38 kNm in DIG-88). The zone features high-permeability fractured sandstones bounded by brittle siltstone interbeds.',
    evidence: '• OIL-NHK-142: 42 m³ lost circulation @ 3,485m (Loss rate: 2.4 to 6.1 m³/hr), 36h NPT.\n• OIL-DIG-88: Peak torque surge to 38.4 kNm @ 3,462m, 8h NPT for bit replacement.\n• OIL-KDM-09: 18 bbl gas influx @ 3,508m (SICP: 410 psi, SIDPP: 280 psi), 24h NPT.\n• Combined interval NPT across offsets: 72 hours (₹1.05 Cr cost impact).',
    sourceWells: ['WELL-B (OIL-NHK-142)', 'WELL-C (OIL-DIG-88)', 'WELL-D (OIL-KDM-09)'],
    sourceDocuments: [
      { doc: 'WCR-OIL-NHK142-RevC.pdf', page: 'p. 48–52', note: 'Section 4.3: Lost Circulation and Remedial Operations' },
      { doc: 'DDR-NHK142-D48.pdf', page: 'p. 2', note: 'Mud Balance & Pit Volume Log' },
      { doc: 'WCR-DIG88-Final.pdf', page: 'p. 34', note: 'Bit Run #3 PDC Cutter Damage Analysis' },
      { doc: 'WellControl-IncidentReport-KDM09.pdf', page: 'p. 4', note: 'Shut-in Drill Pipe Pressure Verification' }
    ],
    confidence: '98.8%',
    recommendation: 'Pre-mix 100 bbl Calcium Carbonate LCM pill on pit #2 before drilling past 3,448 m. Lower ROP below 8 m/hr and cap ECD at 10.7 ppg.'
  },
  {
    queryMatches: ['lost circulation', 'circulation', 'loss', 'mud loss', 'wells experienced lost circulation'],
    title: 'Lost Circulation Analysis Across Offset Wells',
    insight: 'Severe mud loss is documented in 2 out of 5 offset wells in this sector. Well NHK-142 experienced total dynamic loss upon entering the fractured Barail sand at 3,485 m. Well NHK-119 experienced 28 m³ loss due to severe pressure depletion in the lower Barail sand.',
    evidence: '• Well-B (NHK-142): Lost 42.2 m³ of 10.6 ppg HP-WBM mud. Dynamic loss rate peaked at 6.1 m³/hr.\n• Well-F (NHK-119): Lost 28 m³ at 3,530 m in depleted reservoir zone.\n• Remediation required dual-viscosity pills with fine/coarse bridging blend (Calcium carbonate 150/400).',
    sourceWells: ['WELL-B (OIL-NHK-142)', 'WELL-F (OIL-NHK-119)'],
    sourceDocuments: [
      { doc: 'WCR-OIL-NHK142-RevC.pdf', page: 'p. 50', note: 'LCM Squeeze Formulation & Pumping Schedule' },
      { doc: 'MudLog-Composite-142.las', page: 'Track 3', note: 'Flow-in vs Flow-out Delta Curve' }
    ],
    confidence: '99.2%',
    recommendation: 'Verify pit level sensors and calibrate acoustic flow-out paddle before 3,445 m.'
  },
  {
    queryMatches: ['relevant', 'offset wells', 'which wells', 'nearby wells', 'closest'],
    title: 'Spatial & Stratigraphic Offset Well Ranking for TRUST-01',
    insight: 'Ranked by Euclidean distance and multi-parameter stratigraphic similarity (geology, lithology, trajectory, mud system): WELL-B (OIL-NHK-142) is the primary analog at 1.1 km NE with 94% similarity. WELL-C (OIL-DIG-88) is secondary at 2.3 km NW with 88% similarity.',
    evidence: '• WELL-B (OIL-NHK-142): 1.1 km NE | 94% Similarity | TD: 3,680 m | Barail Sandstone\n• WELL-C (OIL-DIG-88): 2.3 km NW | 88% Similarity | TD: 3,550 m | Barail / Kopili\n• WELL-D (OIL-KDM-09): 3.1 km SE | 82% Similarity | TD: 3,820 m | Barail Gas Member\n• WELL-E (OIL-DGB-104): 3.8 km SW | 76% Similarity | TD: 3,400 m | Kopili Formation\n• WELL-F (OIL-NHK-119): 4.6 km S | 71% Similarity | TD: 3,910 m | Depleted Sand',
    sourceWells: ['WELL-B (OIL-NHK-142)', 'WELL-C (OIL-DIG-88)', 'WELL-D (OIL-KDM-09)', 'WELL-E (OIL-DGB-104)', 'WELL-F (OIL-NHK-119)'],
    sourceDocuments: [
      { doc: 'PostGIS Spatial Query Index #OIL-SPAT-2026', page: 'Spatial Layer', note: 'Distance & Dip Azimuth Correlation' },
      { doc: 'eRTMAC Multi-well Geological Correlation Model', page: 'Section 2', note: 'Lithological Similarity Matrix' }
    ],
    confidence: '97.5%',
    recommendation: 'Prioritize parameters from NHK-142 and DIG-88 for real-time offset comparison.'
  },
  {
    queryMatches: ['evidence', 'show evidence', 'proof', 'document', 'wcr'],
    title: 'Historical Document Evidence for Barail Hazard Zone',
    insight: 'All risk flags are verified against primary engineering records extracted from the Oil India Limited central repository via OCR & NER. No synthetic extrapolation is applied without verified ground-truth offset records.',
    evidence: '• Extracted 14 verified incident records from 5 historical Well Completion Reports (WCR) and 18 Daily Drilling Reports (DDR).\n• Optical Character Recognition (OCR) confidence across documents: 98.4% average.\n• Scanned document signatures, shift engineer endorsements, and eRTMAC archived telemetry corroborate loss and torque events.',
    sourceWells: ['WELL-B (OIL-NHK-142)', 'WELL-C (OIL-DIG-88)'],
    sourceDocuments: [
      { doc: 'WCR-OIL-NHK142-RevC.pdf', page: 'p. 48–54', note: 'Full Engineering Report & Mud Logs' },
      { doc: 'DDR-NHK142-D48.pdf', page: 'p. 1–4', note: 'Original Rig Floor Tour Sheet' },
      { doc: 'BHA-Run4-DamageAssessment.pdf', page: 'p. 3', note: 'PDC Bit Inspection Photos & Dull Grade' }
    ],
    confidence: '99.4%',
    recommendation: 'Click [VIEW EVIDENCE] on the risk banner to inspect scanned report facsimiles and OCR text.'
  },
  {
    queryMatches: ['lcm', 'pill', 'calcium carbonate', 'treatment', 'lost circulation material'],
    title: 'Recommended Loss Circulation Material (LCM) Treatment Pill',
    insight: 'Based on successful mitigation in offset well OIL-NHK-142 (Day 48), the validated treatment for the Barail fractured sandstone consists of a blended dual-particle size Calcium Carbonate squeeze pill.',
    evidence: '• Formulation: 100 bbl HP-WBM base fluid + 25 ppb CaCO3 (Coarse 400 mesh) + 20 ppb CaCO3 (Medium 150 mesh) + 10 ppb Fine Walnut / Nut plug.\n• Pumping parameters: Pump at 3.0 bpm, squeeze with 250 psi hesitation squeeze until pressure stabilizes.\n• Result in NHK-142: Losses decreased from 6.1 m³/hr to zero within 1.5 circulating hours.',
    sourceWells: ['WELL-B (OIL-NHK-142)'],
    sourceDocuments: [
      { doc: 'WCR-OIL-NHK142-RevC.pdf', page: 'p. 51', note: 'Chemical Treatment & Mud Engineering Record' }
    ],
    confidence: '99.1%',
    recommendation: 'Ensure 120 bags of coarse CaCO3 and 80 bags of medium CaCO3 are physically verified on rig rack.'
  }
];

// Engineering Analytics Telemetry Points for Charts (Depth vs ROP, Torque, WOB, Mud Weight)
export const DEPTH_TELEMETRY_SERIES = [
  { depth: 3380, rop: 16.5, torque: 21.2, wob: 24.0, mudWeight: 10.4, ecd: 10.8, porePressure: 9.4, fracGradient: 13.9, offsetRop: 15.2, offsetTorque: 22.0 },
  { depth: 3390, rop: 15.8, torque: 22.0, wob: 25.1, mudWeight: 10.4, ecd: 10.8, porePressure: 9.4, fracGradient: 13.9, offsetRop: 14.8, offsetTorque: 22.5 },
  { depth: 3400, rop: 16.2, torque: 23.4, wob: 25.8, mudWeight: 10.4, ecd: 10.8, porePressure: 9.5, fracGradient: 13.8, offsetRop: 15.5, offsetTorque: 23.8 },
  { depth: 3410, rop: 15.4, torque: 23.8, wob: 26.2, mudWeight: 10.4, ecd: 10.81, porePressure: 9.5, fracGradient: 13.8, offsetRop: 14.9, offsetTorque: 24.1 },
  { depth: 3420, rop: 14.8, torque: 24.5, wob: 26.8, mudWeight: 10.4, ecd: 10.82, porePressure: 9.6, fracGradient: 13.8, offsetRop: 14.2, offsetTorque: 25.0, current: true },
  { depth: 3430, rop: 13.9, torque: 25.8, wob: 27.2, mudWeight: 10.4, ecd: 10.83, porePressure: 9.7, fracGradient: 13.7, offsetRop: 13.1, offsetTorque: 26.5 },
  { depth: 3440, rop: 12.1, torque: 28.2, wob: 25.5, mudWeight: 10.4, ecd: 10.84, porePressure: 9.8, fracGradient: 13.6, offsetRop: 11.5, offsetTorque: 29.2 },
  { depth: 3450, rop: 9.8, torque: 32.5, wob: 23.5, mudWeight: 10.3, ecd: 10.72, porePressure: 9.9, fracGradient: 13.5, offsetRop: 9.2, offsetTorque: 34.0, hazardZone: true },
  { depth: 3460, rop: 8.2, torque: 36.4, wob: 22.0, mudWeight: 10.2, ecd: 10.65, porePressure: 10.0, fracGradient: 13.4, offsetRop: 7.8, offsetTorque: 38.4, hazardZone: true },
  { depth: 3470, rop: 7.5, torque: 37.8, wob: 21.5, mudWeight: 10.1, ecd: 10.55, porePressure: 10.1, fracGradient: 13.3, offsetRop: 7.1, offsetTorque: 37.9, hazardZone: true },
  { depth: 3480, rop: 6.9, torque: 35.2, wob: 20.8, mudWeight: 10.0, ecd: 10.45, porePressure: 10.1, fracGradient: 13.2, offsetRop: 6.5, offsetTorque: 36.1, hazardZone: true },
  { depth: 3490, rop: 7.8, torque: 33.0, wob: 22.0, mudWeight: 10.0, ecd: 10.42, porePressure: 10.0, fracGradient: 13.2, offsetRop: 7.4, offsetTorque: 34.5, hazardZone: true },
  { depth: 3500, rop: 8.5, torque: 31.5, wob: 23.2, mudWeight: 10.0, ecd: 10.40, porePressure: 9.9, fracGradient: 13.3, offsetRop: 8.0, offsetTorque: 32.0, hazardZone: true },
  { depth: 3510, rop: 9.2, torque: 29.8, wob: 24.5, mudWeight: 10.0, ecd: 10.38, porePressure: 9.8, fracGradient: 13.4, offsetRop: 8.8, offsetTorque: 30.5, hazardZone: true },
  { depth: 3520, rop: 11.4, torque: 27.2, wob: 25.5, mudWeight: 10.1, ecd: 10.45, porePressure: 9.7, fracGradient: 13.5, offsetRop: 10.8, offsetTorque: 28.0 }
];
