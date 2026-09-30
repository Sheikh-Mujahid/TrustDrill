"use client";

import { AppShell, Badge, Button, Card, Empty, ErrorBox, Skeleton, toast } from "@/components/ui";
import { api, severityClass } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

type RiskEvidenceItem = {
  well_uid: string;
  distance_km: number;
  event_depth_md_m: number;
  formation?: string;
  document_filename?: string;
  page_number?: number;
  evidence_snippet: string;
  confidence: number;
};

type ExplainableRiskIndicator = {
  risk_type: string;
  title: string;
  indicator_level: string; // LOW, MEDIUM, HIGH, CRITICAL
  historical_occurrence: string;
  relevant_formation: boolean;
  formation_name?: string;
  depth_overlap: boolean;
  depth_window?: string;
  supporting_well_count: number;
  supporting_event_count: number;
  explanation: string;
  suggested_actions: string[];
  supporting_wells: {
    well_uid: string;
    distance_km: number;
    event_depth_md_m: number;
    formation: string;
    severity: string;
    title: string;
  }[];
  evidence: RiskEvidenceItem[];
};

type RiskIntelligenceReport = {
  target_well: {
    id: string;
    well_uid: string;
    name: string;
    operator: string;
    field_name: string;
    latitude: number;
    longitude: number;
    total_depth_md_m?: number;
    total_depth_tvd_m?: number;
    status: string;
  };
  radius_km: number;
  comparable_wells_count: number;
  total_events_count: number;
  indicators: ExplainableRiskIndicator[];
  comparable_wells: {
    well: any;
    distance_km: number;
    similarity_score: number;
    formation_code?: string;
    event_count: number;
    recent_events: string[];
  }[];
  trends: any;
  limitations: string;
  disclaimer: string;
};

export default function RiskPage() {
  const [selectedWellId, setSelectedWellId] = useState<string>("");
  const [radiusKm, setRadiusKm] = useState<number>(25.0);
  const [activeIndicator, setActiveIndicator] = useState<ExplainableRiskIndicator | null>(null);

  const wellsQ = useQuery({
    queryKey: ["wells-list"],
    queryFn: () => api<any[]>("/wells"),
  });

  const activeWellId = selectedWellId || wellsQ.data?.find((w) => w.is_active_demo)?.id || wellsQ.data?.[0]?.id || "";

  const reportQ = useQuery({
    queryKey: ["risk-report", activeWellId, radiusKm],
    queryFn: () => (activeWellId ? api<RiskIntelligenceReport>(`/risk/report?well_id=${activeWellId}&radius_km=${radiusKm}`) : Promise.resolve(null)),
    enabled: Boolean(activeWellId),
  });

  const targetWell = reportQ.data?.target_well || wellsQ.data?.find((w) => w.id === activeWellId);
  const indicators = reportQ.data?.indicators || [];
  const currentDetail = activeIndicator || (indicators.length > 0 ? indicators[0] : null);

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "CRITICAL":
        return <Badge className="bg-rose-950 text-rose-300 border border-rose-700">CRITICAL CONCERN</Badge>;
      case "HIGH":
        return <Badge className="bg-rose-900/80 text-rose-200 border border-rose-600/50">HIGH CONCERN</Badge>;
      case "MEDIUM":
        return <Badge className="bg-amber-900/80 text-amber-200 border border-amber-600/50">MEDIUM CONCERN</Badge>;
      default:
        return <Badge className="bg-teal-950 text-teal-300 border border-teal-800/50">LOW / NOMINAL</Badge>;
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-navy-800/80 border border-navy-700/60 p-5 rounded-xl backdrop-blur-sm">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              🛡️ Risk & Hazard Intelligence Engine
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Explainable offset hazard correlation grounded in historical drilling events, formation tops, and document evidence citations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Target Well Selector */}
            <div className="flex items-center gap-2 bg-navy-900/90 border border-navy-700 rounded-lg px-3 py-1.5">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Target Well:</span>
              <select
                value={activeWellId}
                onChange={(e) => {
                  setSelectedWellId(e.target.value);
                  setActiveIndicator(null);
                }}
                className="bg-transparent text-sm font-semibold text-teal-300 focus:outline-none cursor-pointer"
              >
                {wellsQ.data?.map((w: any) => (
                  <option key={w.id} value={w.id} className="bg-navy-900 text-white">
                    {w.well_uid} ({w.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Radius Selector */}
            <div className="flex items-center gap-1.5 bg-navy-900/90 border border-navy-700 rounded-lg px-2.5 py-1.5">
              <span className="text-xs text-slate-400">Radius:</span>
              <select
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
              >
                <option value={5} className="bg-navy-900 text-white">5 km</option>
                <option value={10} className="bg-navy-900 text-white">10 km</option>
                <option value={25} className="bg-navy-900 text-white">25 km</option>
                <option value={50} className="bg-navy-900 text-white">50 km</option>
              </select>
            </div>

            {/* Navigation Actions */}
            <Link href={`/reports`}>
              <Button variant="secondary" className="border-navy-600 hover:bg-navy-700 text-xs">
                📄 Export Report (PDF/CSV)
              </Button>
            </Link>
            <Link href={`/correlation?well_id=${activeWellId}`}>
              <Button variant="secondary" className="border-navy-600 hover:bg-navy-700 text-xs">
                ⚖️ Compare Wells
              </Button>
            </Link>
            <Link href={`/map?well_id=${activeWellId}&radius=${radiusKm}`}>
              <Button className="bg-teal-600 hover:bg-teal-500 text-white text-xs">
                🗺️ View on Map
              </Button>
            </Link>
          </div>
        </div>

        {/* Prototype Disclaimer Banner */}
        <div className="bg-amber-950/40 border border-amber-800/40 rounded-lg p-3 text-xs text-amber-200/90 flex items-center justify-between">
          <span>
            ⚠️ <strong>Decision-Support Notice:</strong> Risk indicators are derived from observed historical frequencies and document evidence in comparable offset wells. No fake probabilities are generated.
          </span>
          <span className="text-slate-400 font-mono text-[11px]">Methodology v1.4 (Evidence-Grounded)</span>
        </div>

        {reportQ.isLoading && <Skeleton className="h-80" />}
        {reportQ.error && <ErrorBox error={reportQ.error} />}

        {reportQ.data && (
          <div className="space-y-6">
            {/* Target Well Overview Card */}
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3">
              <div className="bg-navy-800/90 border border-navy-700 rounded-xl p-3.5">
                <div className="text-[11px] text-slate-400 uppercase tracking-wider">Target Borehole</div>
                <div className="text-lg font-bold text-white font-mono mt-1">{targetWell?.well_uid}</div>
                <div className="text-xs text-slate-400 truncate">{targetWell?.name}</div>
              </div>

              <div className="bg-navy-800/90 border border-navy-700 rounded-xl p-3.5">
                <div className="text-[11px] text-slate-400 uppercase tracking-wider">Location & Field</div>
                <div className="text-sm font-semibold text-teal-300 font-mono mt-1">
                  {targetWell?.latitude?.toFixed(3)}°N, {targetWell?.longitude?.toFixed(3)}°E
                </div>
                <div className="text-xs text-slate-400 truncate">{targetWell?.field_name}</div>
              </div>

              <div className="bg-navy-800/90 border border-navy-700 rounded-xl p-3.5">
                <div className="text-[11px] text-slate-400 uppercase tracking-wider">Total Depth (TD)</div>
                <div className="text-lg font-bold text-sky-300 font-mono mt-1">
                  {targetWell?.total_depth_md_m != null ? `${targetWell.total_depth_md_m} m MD` : "N/A"}
                </div>
                <div className="text-xs text-slate-400">TVD: {targetWell?.total_depth_tvd_m ?? "N/A"} m</div>
              </div>

              <div className="bg-navy-800/90 border border-navy-700 rounded-xl p-3.5">
                <div className="text-[11px] text-slate-400 uppercase tracking-wider">Comparable Offsets</div>
                <div className="text-lg font-bold text-teal-300 font-mono mt-1">
                  {reportQ.data.comparable_wells_count} <span className="text-xs font-normal text-slate-400">wells</span>
                </div>
                <div className="text-xs text-slate-400">Within {radiusKm} km radius</div>
              </div>

              <div className="bg-navy-800/90 border border-navy-700 rounded-xl p-3.5">
                <div className="text-[11px] text-slate-400 uppercase tracking-wider">Recorded Incidents</div>
                <div className="text-lg font-bold text-amber-300 font-mono mt-1">
                  {reportQ.data.total_events_count} <span className="text-xs font-normal text-slate-400">events</span>
                </div>
                <div className="text-xs text-slate-400">Documented in offset WCR/DDR</div>
              </div>
            </div>

            {/* Categorized Risk Indicators Grid */}
            <div className="space-y-3">
              <h2 className="text-base font-semibold text-white">Explainable Risk Indicators (Click to Inspect Evidence)</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {indicators.map((ind) => {
                  const isSelected = currentDetail?.risk_type === ind.risk_type;
                  return (
                    <div
                      key={ind.risk_type}
                      onClick={() => setActiveIndicator(ind)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "bg-navy-800 border-teal-500 shadow-lg shadow-teal-950/50 ring-1 ring-teal-500"
                          : "bg-navy-800/80 border-navy-700 hover:border-navy-600"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-white">{ind.title}</span>
                          {getLevelBadge(ind.indicator_level)}
                        </div>

                        <div className="space-y-1 text-xs text-slate-300 font-mono pt-1">
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-sans">Historical Frequency:</span>
                            <strong className="text-teal-300">{ind.historical_occurrence}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-sans">Formation Overlap:</span>
                            <span className={ind.relevant_formation ? "text-amber-300" : "text-slate-400"}>
                              {ind.relevant_formation ? `Yes (${ind.formation_name})` : "No direct overlap"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-sans">Supporting Documents:</span>
                            <span className="text-slate-300">{ind.evidence.length} cited snippets</span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-400 line-clamp-2 pt-1 font-sans">{ind.explanation}</p>
                      </div>

                      <div className="mt-3 pt-3 border-t border-navy-700/60 flex items-center justify-between text-xs">
                        <span className="text-teal-400 font-medium">View Evidence & Details →</span>
                        <span className="text-slate-500 text-[10px]">{ind.supporting_event_count} events</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Risk Detail Inspection View */}
            {currentDetail && (
              <div className="space-y-4 pt-2">
                <Card title={`Detailed Evidence & Mitigation: ${currentDetail.title}`}>
                  <div className="space-y-5">
                    {/* Header Summary Box */}
                    <div className="p-4 bg-navy-950/80 border border-navy-800 rounded-xl space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg font-bold text-white">{currentDetail.title}</span>
                          {getLevelBadge(currentDetail.indicator_level)}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          Occurrence: <strong className="text-teal-300">{currentDetail.historical_occurrence}</strong>
                        </div>
                      </div>
                      <p className="text-sm text-slate-200 leading-relaxed">{currentDetail.explanation}</p>
                    </div>

                    {/* Supporting Comparable Wells List */}
                    <div className="space-y-2">
                      <h3 className="text-xs uppercase tracking-wider text-teal-400 font-semibold">
                        Supporting Comparable Wells with Recorded Incidents ({currentDetail.supporting_wells.length})
                      </h3>
                      {currentDetail.supporting_wells.length > 0 ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                          {currentDetail.supporting_wells.map((sw, idx) => (
                            <div key={idx} className="p-3 bg-navy-800/90 border border-navy-700 rounded-lg text-xs space-y-1 font-mono">
                              <div className="flex justify-between font-bold text-slate-200">
                                <span>{sw.well_uid}</span>
                                <span className="text-teal-300">{sw.distance_km} km away</span>
                              </div>
                              <div className="text-slate-400">
                                Event Depth: <strong className="text-sky-300">{sw.event_depth_md_m} m MD</strong>
                              </div>
                              <div className="text-slate-400">Formation: {sw.formation}</div>
                              <div className="text-slate-300 italic pt-1 truncate font-sans">&quot;{sw.title}&quot;</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 py-3">No supporting wells recorded for this category.</div>
                      )}
                    </div>

                    {/* Source Document Evidence Snippets */}
                    <div className="space-y-2">
                      <h3 className="text-xs uppercase tracking-wider text-teal-400 font-semibold">
                        Traceable Document Evidence & Page Citations ({currentDetail.evidence.length})
                      </h3>
                      <div className="space-y-2.5">
                        {currentDetail.evidence.map((ev, idx) => (
                          <div key={idx} className="p-3.5 bg-navy-900/90 border border-navy-700 rounded-xl space-y-1.5">
                            <div className="flex flex-wrap items-center justify-between text-xs font-mono">
                              <span className="font-semibold text-teal-300">
                                📄 {ev.document_filename || "WCR_Report.pdf"} — Page {ev.page_number ?? "1"}
                              </span>
                              <span className="text-slate-400">
                                Well: {ev.well_uid} ({ev.distance_km} km away) · Depth: {ev.event_depth_md_m} m
                              </span>
                            </div>
                            <p className="text-xs text-slate-200 font-serif leading-relaxed bg-navy-950 p-2.5 rounded-lg border border-navy-800">
                              &quot;{ev.evidence_snippet}&quot;
                            </p>
                          </div>
                        ))}
                        {currentDetail.evidence.length === 0 && (
                          <div className="text-xs text-slate-400 py-2">No direct evidence snippets extracted for this category.</div>
                        )}
                      </div>
                    </div>

                    {/* Actionable Recommendations & Lessons Learned */}
                    <div className="space-y-2">
                      <h3 className="text-xs uppercase tracking-wider text-teal-400 font-semibold">
                        Historical Operational Recommendations & Mitigations
                      </h3>
                      <ul className="space-y-1.5 text-xs text-slate-200">
                        {currentDetail.suggested_actions.map((act, idx) => (
                          <li key={idx} className="flex items-start gap-2 p-2 bg-navy-900/60 rounded-lg border border-navy-800">
                            <span className="text-teal-400 font-bold">✓</span>
                            <span>{act}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
