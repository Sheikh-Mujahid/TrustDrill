"use client";

import { AppShell, Badge, Button, Card, ErrorBox, Skeleton } from "@/components/ui";
import { api, severityClass as sev } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function WellDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "geology" | "events" | "risk_correlation" | "programs" | "documents" | "telemetry">("overview");

  const q = useQuery({
    queryKey: ["well", params.id],
    queryFn: () => api<any>(`/wells/${params.id}`),
  });

  const riskQ = useQuery({
    queryKey: ["well-risk-report", params.id],
    queryFn: () => api<any>(`/risk/report?well_id=${params.id}&radius_km=25`),
    enabled: Boolean(params.id),
  });

  const tel = useQuery({
    queryKey: ["tel", params.id],
    queryFn: () => api<any[]>(`/wells/${params.id}/telemetry?limit=100`),
  });

  const timelineQ = useQuery({
    queryKey: ["timeline", params.id],
    queryFn: () => api<any[]>(`/wells/${params.id}/timeline`),
  });

  if (q.isLoading) {
    return (
      <AppShell>
        <div className="space-y-4 max-w-7xl mx-auto">
          <Skeleton className="h-20" />
          <Skeleton className="h-64" />
          <Skeleton className="h-80" />
        </div>
      </AppShell>
    );
  }

  if (q.error) {
    return (
      <AppShell>
        <div className="max-w-7xl mx-auto py-8">
          <ErrorBox error={q.error} />
          <div className="mt-4">
            <Button onClick={() => router.push("/wells")}>Back to wells list</Button>
          </div>
        </div>
      </AppShell>
    );
  }

  const well = q.data?.well;
  const surveys = q.data?.surveys || [];
  const formations = q.data?.formations || [];
  const events = q.data?.events || [];
  const casing = q.data?.casing || [];
  const mud = q.data?.mud || [];
  const cement = q.data?.cement || [];
  const documents = q.data?.documents || [];
  const depthNote = q.data?.depth_note;

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-navy-800/80 border border-navy-700/60 p-5 rounded-xl backdrop-blur-sm">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-white">{well?.well_uid}</h1>
              <Badge className={well?.status === "active" ? "bg-teal-700/60 text-teal-200 border-teal-500/50" : "bg-slate-700 text-slate-300"}>
                {well?.status?.toUpperCase()}
              </Badge>
              {well?.is_active_demo && (
                <Badge className="bg-amber-600/30 text-amber-300 border-amber-500/50">
                  ACTIVE DEMO TARGET
                </Badge>
              )}
            </div>
            <p className="text-sm text-slate-400 mt-1">
              {well?.name} · Operator: {well?.operator || "Oil India Ltd (Synthetic Demo)"} · Block: {well?.field_name || "Synthetic Block A"}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <p className="text-xs text-amber-300/90 font-mono">{well?.data_provenance}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/risk?well_id=${well?.id}`}>
              <Button className="bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-900/30">
                Risk Assessment
              </Button>
            </Link>
            <Link href={`/map?well_id=${well?.id}`}>
              <Button variant="secondary" className="border-navy-600 hover:bg-navy-700">
                View on Offset Map
              </Button>
            </Link>
            <Link href="/wells">
              <Button variant="secondary" className="border-navy-600 hover:bg-navy-700">
                Well Catalog
              </Button>
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-navy-700 overflow-x-auto gap-2">
          {(
            [
              { id: "overview", label: "Overview & Geometry" },
              { id: "geology", label: `Formations (${formations.length})` },
              { id: "events", label: `Events & History (${events.length})` },
              { id: "risk_correlation", label: "Correlation & Risk" },
              { id: "programs", label: "Drilling Programs" },
              { id: "documents", label: `Documents (${documents.length})` },
              { id: "telemetry", label: "Drilling Telemetry" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-teal-500 text-teal-300 bg-navy-800/40"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:border-navy-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-navy-800/90 border border-navy-700/60 rounded-lg p-4">
                <div className="text-xs text-slate-400 uppercase tracking-wider">Surface Location</div>
                <div className="text-base font-semibold text-white mt-1 font-mono">
                  {well?.latitude?.toFixed(5)}°N, {well?.longitude?.toFixed(5)}°E
                </div>
                <div className="text-xs text-slate-500 mt-1">SRID 4326 PostGIS geography</div>
              </div>

              <div className="bg-navy-800/90 border border-navy-700/60 rounded-lg p-4">
                <div className="text-xs text-slate-400 uppercase tracking-wider">Total Depth (MD)</div>
                <div className="text-xl font-bold text-teal-300 mt-1 font-mono">
                  {well?.total_depth_md_m != null ? `${well.total_depth_md_m} m` : "Not available"}
                </div>
                <div className="text-xs text-slate-500 mt-1">Measured along borehole</div>
              </div>

              <div className="bg-navy-800/90 border border-navy-700/60 rounded-lg p-4">
                <div className="text-xs text-slate-400 uppercase tracking-wider">Total Depth (TVD)</div>
                <div className="text-xl font-bold text-sky-300 mt-1 font-mono">
                  {well?.total_depth_tvd_m != null ? `${well.total_depth_tvd_m} m` : "Not available"}
                </div>
                <div className="text-xs text-slate-500 mt-1">True vertical depth</div>
              </div>

              <div className="bg-navy-800/90 border border-navy-700/60 rounded-lg p-4">
                <div className="text-xs text-slate-400 uppercase tracking-wider">Kelly Bushing / Datum</div>
                <div className="text-base font-semibold text-white mt-1 font-mono">
                  {well?.kelly_bushing_m != null ? `${well.kelly_bushing_m} m MSL` : "0.0 m MSL"}
                </div>
                <div className="text-xs text-slate-500 mt-1">Elevation reference</div>
              </div>
            </div>

            {depthNote && (
              <div className="bg-blue-950/40 border border-blue-800/40 rounded-lg p-3 text-xs text-blue-200 flex items-center gap-2">
                <span className="font-semibold">Technical notice:</span>
                <span>{depthNote}</span>
              </div>
            )}

            {/* Trajectory / Directional Survey */}
            <Card title="Well Trajectory & Directional Survey (MD vs TVD Profile)">
              {surveys.length > 0 ? (
                <div className="space-y-4">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={surveys}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="md_m" stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 11 }} label={{ value: "Measured Depth (m)", position: "insideBottom", offset: -5, fill: "#94a3b8" }} />
                        <YAxis stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 11 }} label={{ value: "TVD (m)", angle: -90, position: "insideLeft", fill: "#94a3b8" }} />
                        <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "6px" }} />
                        <Line type="monotone" dataKey="tvd_m" stroke="#14b8a6" strokeWidth={2} dot={{ r: 3, fill: "#14b8a6" }} name="TVD (m)" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="overflow-x-auto max-h-52 border border-navy-700 rounded-lg">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-navy-800 text-slate-300 sticky top-0">
                        <tr>
                          <th className="p-2">MD (m)</th>
                          <th className="p-2">TVD (m)</th>
                          <th className="p-2">Inclination (°)</th>
                          <th className="p-2">Azimuth (°)</th>
                          <th className="p-2">Northing (m)</th>
                          <th className="p-2">Easting (m)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-navy-700/60 font-mono">
                        {surveys.map((s: any) => (
                          <tr key={s.id} className="hover:bg-navy-800/50">
                            <td className="p-2 text-teal-300 font-semibold">{s.md_m}</td>
                            <td className="p-2 text-sky-300">{s.tvd_m}</td>
                            <td className="p-2 text-slate-300">{s.inclination_deg}°</td>
                            <td className="p-2 text-slate-300">{s.azimuth_deg}°</td>
                            <td className="p-2 text-slate-400">{s.northing_m}</td>
                            <td className="p-2 text-slate-400">{s.easting_m}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-400 py-6 text-center">No directional survey records available for this well.</div>
              )}
            </Card>
          </div>
        )}

        {/* TAB 2: GEOLOGICAL FORMATIONS */}
        {activeTab === "geology" && (
          <div className="space-y-4">
            <Card title="Stratigraphic Column & Formation Tops">
              {formations.length > 0 ? (
                <div className="space-y-4">
                  <div className="overflow-x-auto border border-navy-700 rounded-lg">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-navy-800 text-slate-300">
                        <tr>
                          <th className="p-3">Formation Code</th>
                          <th className="p-3">Formation Name</th>
                          <th className="p-3">Lithology</th>
                          <th className="p-3">Top MD (m)</th>
                          <th className="p-3">Base MD (m)</th>
                          <th className="p-3">Thickness (m)</th>
                          <th className="p-3">Top TVD (m)</th>
                          <th className="p-3">Base TVD (m)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-navy-700/60">
                        {formations.map((f: any) => {
                          const thickness = (f.bottom_md_m - f.top_md_m).toFixed(1);
                          return (
                            <tr key={f.id} className="hover:bg-navy-800/50">
                              <td className="p-3 font-semibold text-teal-300">{f.formation?.code}</td>
                              <td className="p-3 font-medium text-slate-200">{f.formation?.name}</td>
                              <td className="p-3">
                                <Badge className="bg-slate-700 text-slate-300 text-[10px]">
                                  {f.formation?.lithology || "Mixed Sand/Shale"}
                                </Badge>
                              </td>
                              <td className="p-3 font-mono text-slate-200">{f.top_md_m} m</td>
                              <td className="p-3 font-mono text-slate-200">{f.bottom_md_m} m</td>
                              <td className="p-3 font-mono text-teal-400">{thickness} m</td>
                              <td className="p-3 font-mono text-slate-400">{f.top_tvd_m != null ? `${f.top_tvd_m} m` : "Not available"}</td>
                              <td className="p-3 font-mono text-slate-400">{f.bottom_tvd_m != null ? `${f.bottom_tvd_m} m` : "Not available"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-400 py-6 text-center">No formation tops recorded.</div>
              )}
            </Card>
          </div>
        )}

        {/* TAB 3: OPERATIONAL EVENTS & HISTORY */}
        {activeTab === "events" && (
          <div className="space-y-6">
            <Card title="Historical Drilling Events & Incidents">
              {events.length > 0 ? (
                <div className="space-y-4">
                  {events.map((e: any) => (
                    <div
                      key={e.id}
                      className="border border-navy-700/80 bg-navy-800/40 rounded-xl p-4 space-y-3 hover:border-navy-600 transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge className={sev(e.severity)}>{e.severity?.toUpperCase()}</Badge>
                          <span className="text-base font-semibold text-white">{e.title}</span>
                          <span className="text-xs bg-navy-700 px-2 py-0.5 rounded text-slate-300">
                            {e.event_type}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          MD {e.md_m} m {e.tvd_m != null && `· TVD ${e.tvd_m} m`}
                          {e.formation?.name && ` · ${e.formation.name}`}
                        </div>
                      </div>

                      <p className="text-sm text-slate-300 leading-relaxed">{e.description}</p>

                      {e.npt_hours != null && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-950/40 border border-amber-800/40 text-xs text-amber-300 font-mono">
                          <span>NPT Duration:</span>
                          <strong>{e.npt_hours} hrs</strong>
                        </div>
                      )}

                      {e.lesson_learned && (
                        <div className="bg-navy-900/80 border border-teal-800/30 rounded-lg p-3 text-xs">
                          <span className="font-semibold text-teal-400 block mb-1">Key Lesson Learned:</span>
                          <p className="text-slate-300">{e.lesson_learned}</p>
                        </div>
                      )}

                      {e.mitigations && e.mitigations.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                            Executed Mitigations:
                          </span>
                          <div className="space-y-1">
                            {e.mitigations.map((m: any, idx: number) => (
                              <div
                                key={idx}
                                className="text-xs bg-navy-900/60 p-2 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-slate-300"
                              >
                                <span>
                                  <strong className="text-teal-400">Step {m.sequence || idx + 1}:</strong> {m.action}
                                </span>
                                {m.result && (
                                  <span className="text-slate-400 italic">Result: {m.result}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="text-[11px] text-slate-500 pt-1 flex justify-between">
                        <span>Recorded at: {new Date(e.occurred_at).toLocaleString()}</span>
                        <span>Provenance: {e.data_provenance}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-400 py-6 text-center">No historical operational events on record.</div>
              )}
            </Card>

            {timelineQ.data && timelineQ.data.length > 0 && (
              <Card title="Chronological Event Timeline">
                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-navy-700">
                  {timelineQ.data.map((t: any, idx: number) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-teal-500 border-2 border-navy-900" />
                      <div className="text-xs text-slate-400 font-mono">
                        {new Date(t.at).toLocaleDateString()} · MD {t.md_m} m
                      </div>
                      <div className="text-sm font-semibold text-slate-200">{t.title}</div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* TAB 4: RISK & CORRELATION */}
        {activeTab === "risk_correlation" && (
          <div className="space-y-6">
            <div className="bg-navy-800/80 border border-teal-800/40 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>🧠</span> Offset Hazard Correlation & Risk Intelligence
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Multi-factor similarity scoring across {riskQ.data?.comparable_wells?.length || 0} comparable wells within 25 km radius
                </p>
              </div>
              <div className="flex gap-2">
                <Link href={`/risk?well_id=${well?.id}&radius=25`}>
                  <Button className="bg-teal-600 hover:bg-teal-500 text-white text-xs">
                    Open Full Risk Dashboard →
                  </Button>
                </Link>
                <Link href={`/correlation?well_id=${well?.id}&radius=25`}>
                  <Button variant="secondary" className="text-xs">
                    Compare Matrix →
                  </Button>
                </Link>
              </div>
            </div>

            {/* Explainable Risk Indicators */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Explainable Historical Risk Indicators
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {riskQ.data?.risk_indicators?.map((ind: any) => {
                  const isHigh = ind.risk_level === "HIGH";
                  const isMed = ind.risk_level === "MEDIUM";
                  return (
                    <div
                      key={ind.hazard_code}
                      className={`rounded-xl border p-4 space-y-3 ${
                        isHigh
                          ? "bg-rose-950/20 border-rose-700/40"
                          : isMed
                          ? "bg-amber-950/20 border-amber-700/40"
                          : "bg-teal-950/20 border-teal-700/40"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{ind.hazard_title}</span>
                          <Badge
                            className={
                              isHigh
                                ? "bg-rose-950 text-rose-300 border-rose-800"
                                : isMed
                                ? "bg-amber-950 text-amber-300 border-amber-800"
                                : "bg-teal-950 text-teal-300 border-teal-800"
                            }
                          >
                            {ind.risk_level}
                          </Badge>
                        </div>
                        <span className="text-xs font-mono text-slate-300">
                          {ind.historical_occurrence}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">{ind.reasoning}</p>

                      <div className="flex flex-wrap gap-2 text-[11px] font-mono text-slate-400 pt-1 border-t border-navy-700/40">
                        <span>Depth Overlap: <strong className="text-slate-200">{ind.depth_overlap ? "Yes" : "No"}</strong></span>
                        <span>·</span>
                        <span>Formation: <strong className="text-slate-200">{ind.formation_name || "Regional"}</strong></span>
                        <span>·</span>
                        <span>Supporting Wells: <strong className="text-teal-300">{ind.supporting_wells?.length || 0}</strong></span>
                      </div>

                      {/* Evidence Citations */}
                      {ind.evidence_citations && ind.evidence_citations.length > 0 && (
                        <div className="space-y-1.5 pt-2">
                          <span className="text-[10px] uppercase tracking-wider text-teal-400 font-semibold">
                            Source Document Citations:
                          </span>
                          <div className="space-y-1">
                            {ind.evidence_citations.slice(0, 2).map((cit: any, idx: number) => (
                              <div
                                key={idx}
                                className="bg-navy-950/80 p-2 rounded border border-navy-800/80 text-[11px] text-slate-300 flex flex-col gap-1"
                              >
                                <div className="flex justify-between items-center text-teal-300 font-mono">
                                  <span>{cit.well_uid} ({cit.event_type} @ {cit.depth_md_m}m)</span>
                                  <span className="text-slate-400">p.{cit.page_number}</span>
                                </div>
                                <div className="font-serif italic text-slate-400 text-[10px]">
                                  &quot;{cit.evidence_snippet}&quot;
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Comparable Wells Ranking */}
            <Card title="Ranked Comparable Wells (Prototype Similarity Breakdown)">
              <div className="overflow-x-auto border border-navy-700 rounded-lg">
                <table className="w-full text-xs text-left">
                  <thead className="bg-navy-800 text-slate-300 font-sans">
                    <tr>
                      <th className="p-2.5">Well UID</th>
                      <th className="p-2.5">Distance</th>
                      <th className="p-2.5">TD (MD)</th>
                      <th className="p-2.5">Combined Score</th>
                      <th className="p-2.5">Distance Sim</th>
                      <th className="p-2.5">Formation Sim</th>
                      <th className="p-2.5">Depth Sim</th>
                      <th className="p-2.5">Historical Incidents</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-700/60 font-mono">
                    {riskQ.data?.comparable_wells?.map((cw: any) => (
                      <tr key={cw.well_id} className="hover:bg-navy-800/50">
                        <td className="p-2.5 font-semibold text-teal-300">
                          <Link href={`/wells/${cw.well_id}`} className="hover:underline">
                            {cw.well_uid}
                          </Link>
                        </td>
                        <td className="p-2.5 text-slate-300">{cw.distance_km.toFixed(1)} km</td>
                        <td className="p-2.5 text-slate-300">{cw.total_depth_md_m} m</td>
                        <td className="p-2.5 font-bold text-teal-300">
                          {cw.similarity_breakdown?.combined_score?.toFixed(2)}
                        </td>
                        <td className="p-2.5 text-slate-400">{cw.similarity_breakdown?.distance_similarity?.toFixed(2)}</td>
                        <td className="p-2.5 text-slate-400">{cw.similarity_breakdown?.formation_similarity?.toFixed(2)}</td>
                        <td className="p-2.5 text-slate-400">{cw.similarity_breakdown?.depth_similarity?.toFixed(2)}</td>
                        <td className="p-2.5 text-amber-300 font-bold">{cw.event_count} events</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 5: DRILLING PROGRAMS */}
        {activeTab === "programs" && (
          <div className="grid lg:grid-cols-3 gap-6">
            <Card title="Casing Strings">
              {casing.length > 0 ? (
                <div className="space-y-3">
                  {casing.map((c: any) => (
                    <div key={c.id} className="p-3 bg-navy-800/60 border border-navy-700 rounded-lg text-xs space-y-1">
                      <div className="flex justify-between font-semibold text-slate-200">
                        <span>{c.string_name}</span>
                        <span className="text-teal-300 font-mono">{c.od_in}&quot; OD</span>
                      </div>
                      <div className="text-slate-400 font-mono">Setting depth: {c.setting_depth_md_m} m MD</div>
                      <div className="text-slate-400">Steel grade: {c.grade || "J-55 / L-80"}</div>
                      {c.notes && <div className="text-slate-500 italic mt-1">{c.notes}</div>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-400 py-4 text-center">No casing data available.</div>
              )}
            </Card>

            <Card title="Mud Programs">
              {mud.length > 0 ? (
                <div className="space-y-3">
                  {mud.map((m: any) => (
                    <div key={m.id} className="p-3 bg-navy-800/60 border border-navy-700 rounded-lg text-xs space-y-1">
                      <div className="flex justify-between font-semibold text-slate-200">
                        <span>{m.mud_type}</span>
                        <span className="text-sky-300 font-mono">{m.mud_weight_sg} SG</span>
                      </div>
                      <div className="text-slate-400 font-mono">
                        Interval: {m.interval_top_md_m}–{m.interval_bottom_md_m} m MD
                      </div>
                      {m.pv_cp != null && <div className="text-slate-400">PV: {m.pv_cp} cP · YP: {m.yp_pa} Pa</div>}
                      {m.notes && <div className="text-slate-500 italic mt-1">{m.notes}</div>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-400 py-4 text-center">No mud program records available.</div>
              )}
            </Card>

            <Card title="Cementing Jobs">
              {cement.length > 0 ? (
                <div className="space-y-3">
                  {cement.map((c: any) => (
                    <div key={c.id} className="p-3 bg-navy-800/60 border border-navy-700 rounded-lg text-xs space-y-1">
                      <div className="font-semibold text-slate-200">{c.job_name}</div>
                      <div className="text-slate-400 font-mono">
                        Depth: {c.md_m} m · Slurry: {c.slurry_density_sg} SG
                      </div>
                      <div className="text-teal-400 font-medium">Result: {c.result}</div>
                      {c.issues && <div className="text-amber-400 text-[11px] mt-1">Issues: {c.issues}</div>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-400 py-4 text-center">No cementing records available.</div>
              )}
            </Card>
          </div>
        )}

        {/* TAB 5: DOCUMENTS & EVIDENCE */}
        {activeTab === "documents" && (
          <Card title="Referenced Well Documents & Well Completion Reports (WCR / DDR)">
            {documents.length > 0 ? (
              <div className="overflow-x-auto border border-navy-700 rounded-lg">
                <table className="w-full text-xs text-left">
                  <thead className="bg-navy-800 text-slate-300">
                    <tr>
                      <th className="p-3">Document Title</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">File Size</th>
                      <th className="p-3">Ingestion Status</th>
                      <th className="p-3">OCR Used</th>
                      <th className="p-3">Uploaded Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-700/60 font-mono">
                    {documents.map((d: any) => (
                      <tr key={d.id} className="hover:bg-navy-800/50">
                        <td className="p-3 font-medium text-slate-200">{d.original_filename}</td>
                        <td className="p-3 text-slate-400">{d.content_type}</td>
                        <td className="p-3 text-slate-400">{(d.size_bytes / 1024).toFixed(1)} KB</td>
                        <td className="p-3">
                          <Badge className="bg-teal-900/60 text-teal-300">{d.status}</Badge>
                        </td>
                        <td className="p-3 text-slate-400">{d.ocr_used ? "Yes (OCR)" : "Text parser"}</td>
                        <td className="p-3 text-slate-500">{new Date(d.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-sm text-slate-400 py-6 text-center">
                No uploaded documents directly linked to this well. Ingest WCR/DDR in the Ingest section.
              </div>
            )}
          </Card>
        )}

        {/* TAB 6: DRILLING TELEMETRY */}
        {activeTab === "telemetry" && (
          <div className="space-y-6">
            <Card title="Drilling Dynamics & Parameters (Simulated / Real-time Samples)">
              {tel.data && tel.data.length > 0 ? (
                <div className="space-y-6">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={tel.data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="md_m" stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 11 }} label={{ value: "Depth MD (m)", position: "insideBottom", offset: -5, fill: "#94a3b8" }} />
                        <YAxis stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                        <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "6px" }} />
                        <Area type="monotone" dataKey="rop_m_per_hr" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.15} name="ROP (m/hr)" />
                        <Area type="monotone" dataKey="torque_knm" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.15} name="Torque (kN·m)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="overflow-x-auto max-h-64 border border-navy-700 rounded-lg">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-navy-800 text-slate-300 sticky top-0 font-sans">
                        <tr>
                          <th className="p-2">Time</th>
                          <th className="p-2">MD (m)</th>
                          <th className="p-2">ROP (m/h)</th>
                          <th className="p-2">WOB (kN)</th>
                          <th className="p-2">Torque (kN·m)</th>
                          <th className="p-2">SPP (kPa)</th>
                          <th className="p-2">Pit Vol (m³)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-navy-700/60 font-mono">
                        {tel.data.map((row: any) => (
                          <tr key={row.id} className="hover:bg-navy-800/50">
                            <td className="p-2 text-slate-400">{new Date(row.timestamp).toLocaleTimeString()}</td>
                            <td className="p-2 text-teal-300 font-semibold">{row.md_m?.toFixed(1)}</td>
                            <td className="p-2 text-slate-200">{row.rop_m_per_hr?.toFixed(1)}</td>
                            <td className="p-2 text-slate-200">{row.wob_kn?.toFixed(1)}</td>
                            <td className="p-2 text-sky-300">{row.torque_knm?.toFixed(1)}</td>
                            <td className="p-2 text-slate-300">{row.spp_kpa?.toFixed(0)}</td>
                            <td className="p-2 text-slate-300">{row.pit_volume_m3?.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-400 py-6 text-center">No telemetry data recorded for this well.</div>
              )}
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}
