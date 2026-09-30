"use client";

import { AppShell, Badge, Button, Card, Empty, ErrorBox, Skeleton } from "@/components/ui";
import { api, severityClass } from "@/lib/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ComparableWell = {
  well: {
    id: string;
    well_uid: string;
    name: string;
    status: string;
    operator: string;
    field_name: string;
    latitude: number;
    longitude: number;
    total_depth_md_m?: number;
    total_depth_tvd_m?: number;
  };
  distance_km: number;
  similarity_score: number;
  similarity_breakdown: {
    distance_similarity: number;
    formation_similarity: number;
    depth_similarity: number;
    field_similarity: number;
    basin_similarity: number;
    combined_score: number;
    label: string;
  };
  formation_code?: string;
  event_count: number;
  recent_events: string[];
};

export default function CorrelationPage() {
  const [selectedWellId, setSelectedWellId] = useState<string>("");
  const [radiusKm, setRadiusKm] = useState<number>(25.0);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"comparables" | "comparison_matrix" | "trends">("comparables");

  const wellsQ = useQuery({
    queryKey: ["wells-catalog"],
    queryFn: () => api<any[]>("/wells"),
  });

  const activeWellId = selectedWellId || wellsQ.data?.find((w) => w.is_active_demo)?.id || wellsQ.data?.[0]?.id || "";
  const targetWell = wellsQ.data?.find((w) => w.id === activeWellId);

  // 1. Fetch Comparable Wells
  const comparablesQ = useQuery({
    queryKey: ["comparables", activeWellId, radiusKm],
    queryFn: () => (activeWellId ? api<ComparableWell[]>(`/correlation/comparable?well_id=${activeWellId}&radius_km=${radiusKm}`) : Promise.resolve([])),
    enabled: Boolean(activeWellId),
  });

  // 2. Fetch Historical Trends
  const trendsQ = useQuery({
    queryKey: ["correlation-trends", activeWellId, radiusKm],
    queryFn: () => (activeWellId ? api<any>(`/correlation/trends?well_id=${activeWellId}&radius_km=${radiusKm}`) : Promise.resolve(null)),
    enabled: Boolean(activeWellId),
  });

  // 3. Fetch Comparison Matrix
  const compareWellIdsStr = [activeWellId, ...selectedForCompare].filter(Boolean).join(",");
  const compareMatrixQ = useQuery({
    queryKey: ["compare-matrix", activeWellId, compareWellIdsStr],
    queryFn: () => (activeWellId ? api<any>(`/correlation/compare?target_well_id=${activeWellId}&compare_well_ids=${compareWellIdsStr}`) : Promise.resolve(null)),
    enabled: Boolean(activeWellId),
  });

  const toggleCompare = (id: string) => {
    if (selectedForCompare.includes(id)) {
      setSelectedForCompare(selectedForCompare.filter((i) => i !== id));
    } else {
      if (selectedForCompare.length >= 3) {
        setSelectedForCompare([...selectedForCompare.slice(1), id]);
      } else {
        setSelectedForCompare([...selectedForCompare, id]);
      }
    }
  };

  // Format trends data for Recharts
  const depthChartData = trendsQ.data?.events_by_depth
    ? Object.entries(trendsQ.data.events_by_depth).map(([bin, count]) => ({ bin, count }))
    : [];

  const fmChartData = trendsQ.data?.events_by_formation
    ? Object.entries(trendsQ.data.events_by_formation).map(([formation, count]) => ({ formation, count }))
    : [];

  const typeChartData = trendsQ.data?.events_by_type
    ? Object.entries(trendsQ.data.events_by_type).map(([type, count]) => ({ type, count }))
    : [];

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-navy-800/80 border border-navy-700/60 p-5 rounded-xl backdrop-blur-sm">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              ⚖️ Offset Well Correlation & Comparison Matrix
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Multi-factor well similarity rankings, side-by-side technical parameter comparisons, and observed hazard trend analysis.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Target Well Selector */}
            <div className="flex items-center gap-2 bg-navy-900/90 border border-navy-700 rounded-lg px-3 py-1.5">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Target:</span>
              <select
                value={activeWellId}
                onChange={(e) => setSelectedWellId(e.target.value)}
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

            <Link href={`/risk?well_id=${activeWellId}`}>
              <Button className="bg-teal-600 hover:bg-teal-500 text-white text-xs">
                🛡️ Risk Report
              </Button>
            </Link>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-navy-700 overflow-x-auto gap-2">
          {(
            [
              { id: "comparables", label: `Comparable Offsets (${comparablesQ.data?.length || 0})` },
              { id: "comparison_matrix", label: `Side-by-Side Matrix (${selectedForCompare.length + 1} Wells)` },
              { id: "trends", label: "Historical Hazard Trends" },
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

        {/* TAB 1: COMPARABLE WELLS RANKING */}
        {activeTab === "comparables" && (
          <div className="space-y-4">
            <div className="text-xs text-slate-400 bg-navy-900/60 p-3 rounded-lg border border-navy-800 flex items-center justify-between">
              <span>
                💡 <strong>Similarity Methodology:</strong> Transparent weighted score across Distance (35%), Formation Overlap (25%), Depth Closeness (20%), Field (10%), and Basin (10%).
              </span>
              <span className="text-teal-400 font-mono text-[11px]">Select wells to add to Side-by-Side Matrix</span>
            </div>

            {comparablesQ.isLoading && <Skeleton className="h-64" />}
            {comparablesQ.error && <ErrorBox error={comparablesQ.error} />}

            {comparablesQ.data && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {comparablesQ.data.map((cw) => {
                  const isChecked = selectedForCompare.includes(cw.well.id);
                  const b = cw.similarity_breakdown;
                  return (
                    <div
                      key={cw.well.id}
                      className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                        isChecked
                          ? "bg-navy-800 border-teal-500 ring-1 ring-teal-500/50"
                          : "bg-navy-800/80 border-navy-700 hover:border-navy-600"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <span className="font-mono text-base font-bold text-white">{cw.well.well_uid}</span>
                            <div className="text-xs text-slate-400">{cw.well.name}</div>
                          </div>
                          <div className="text-right font-mono">
                            <span className="text-xs text-teal-300 font-bold bg-teal-950 px-2 py-0.5 rounded border border-teal-800">
                              {(cw.similarity_score * 100).toFixed(0)}% Match
                            </span>
                            <div className="text-[10px] text-slate-500 mt-0.5">{cw.distance_km} km away</div>
                          </div>
                        </div>

                        {/* Similarity Breakdown Bars */}
                        <div className="space-y-1 pt-1 text-[11px] font-mono text-slate-300">
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-sans">Distance Sim:</span>
                            <span>{(b.distance_similarity * 100).toFixed(0)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-sans">Formation Sim:</span>
                            <span>{(b.formation_similarity * 100).toFixed(0)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-sans">Depth Sim:</span>
                            <span>{(b.depth_similarity * 100).toFixed(0)}%</span>
                          </div>
                        </div>

                        {/* Recent Events */}
                        <div className="pt-2 border-t border-navy-700/60">
                          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                            Recorded Events ({cw.event_count}):
                          </span>
                          <div className="mt-1 space-y-1">
                            {cw.recent_events.slice(0, 2).map((rev, idx) => (
                              <div key={idx} className="text-[11px] text-amber-300/90 font-mono truncate">
                                • {rev}
                              </div>
                            ))}
                            {cw.recent_events.length === 0 && (
                              <div className="text-[11px] text-slate-500">No events recorded.</div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-navy-700/60 flex items-center justify-between">
                        <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleCompare(cw.well.id)}
                            className="rounded bg-navy-900 border-navy-600 text-teal-500 focus:ring-0"
                          />
                          <span>Compare in Matrix</span>
                        </label>
                        <Link href={`/wells/${cw.well.id}`} className="text-xs text-teal-400 hover:underline">
                          Profile →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SIDE-BY-SIDE COMPARISON MATRIX */}
        {activeTab === "comparison_matrix" && (
          <div className="space-y-4">
            <Card title="Side-by-Side Technical Parameter & Stratigraphy Matrix">
              {compareMatrixQ.isLoading && <Skeleton className="h-64" />}
              {compareMatrixQ.data?.wells ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-navy-800 text-slate-300 font-sans">
                      <tr>
                        <th className="p-3 w-40 sticky left-0 bg-navy-800">Parameter</th>
                        {compareMatrixQ.data.wells.map((w: any) => (
                          <th key={w.id} className={`p-3 min-w-[200px] ${w.is_target ? "bg-teal-950/60 border-l border-r border-teal-800" : ""}`}>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white font-mono">{w.well_uid}</span>
                              {w.is_target && (
                                <Badge className="bg-teal-900 text-teal-200 text-[10px]">TARGET</Badge>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-normal">{w.name}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy-700/60 font-mono">
                      <tr>
                        <td className="p-3 font-semibold text-slate-300 bg-navy-900 sticky left-0">Field / Operator</td>
                        {compareMatrixQ.data.wells.map((w: any) => (
                          <td key={w.id} className="p-3 text-slate-200">
                            {w.field_name} · {w.operator}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-slate-300 bg-navy-900 sticky left-0">Surface Coordinates</td>
                        {compareMatrixQ.data.wells.map((w: any) => (
                          <td key={w.id} className="p-3 text-teal-300">
                            {w.coordinates}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-slate-300 bg-navy-900 sticky left-0">Total Depth (MD / TVD)</td>
                        {compareMatrixQ.data.wells.map((w: any) => (
                          <td key={w.id} className="p-3 text-sky-300">
                            MD {w.total_depth_md_m} m {w.total_depth_tvd_m != null && `· TVD ${w.total_depth_tvd_m} m`}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-slate-300 bg-navy-900 sticky left-0">Formations Tops</td>
                        {compareMatrixQ.data.wells.map((w: any) => (
                          <td key={w.id} className="p-3 text-slate-300">
                            <ul className="space-y-0.5">
                              {w.formations.map((f: any, idx: number) => (
                                <li key={idx}>
                                  <strong>{f.code}:</strong> {f.top_md}–{f.bottom_md} m
                                </li>
                              ))}
                            </ul>
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-slate-300 bg-navy-900 sticky left-0">Casing Program</td>
                        {compareMatrixQ.data.wells.map((w: any) => (
                          <td key={w.id} className="p-3 text-slate-300">
                            {w.casing_records.join(", ") || "N/A"}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-slate-300 bg-navy-900 sticky left-0">Mud Fluid Systems</td>
                        {compareMatrixQ.data.wells.map((w: any) => (
                          <td key={w.id} className="p-3 text-slate-300">
                            {w.mud_programs.join(", ") || "N/A"}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-slate-300 bg-navy-900 sticky left-0">Recorded Incidents</td>
                        {compareMatrixQ.data.wells.map((w: any) => (
                          <td key={w.id} className="p-3">
                            <ul className="space-y-1">
                              {w.historical_events.map((e: any, idx: number) => (
                                <li key={idx} className="p-1.5 bg-navy-950 rounded text-[11px]">
                                  <Badge className={severityClass(e.severity)}>{e.severity}</Badge>
                                  <div className="font-semibold text-slate-200 mt-0.5">{e.title}</div>
                                  <div className="text-slate-400">@ {e.md_m} m MD</div>
                                </li>
                              ))}
                              {w.historical_events.length === 0 && <span className="text-slate-500">No events</span>}
                            </ul>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty>Select comparable wells above to view the side-by-side technical matrix.</Empty>
              )}
            </Card>
          </div>
        )}

        {/* TAB 3: HISTORICAL HAZARD TRENDS */}
        {activeTab === "trends" && (
          <div className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-4">
              <Card title="Observed Historical Incidents by Depth Interval">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={depthChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="bin" stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                      <YAxis stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "6px" }} />
                      <Bar dataKey="count" fill="#14b8a6" radius={[4, 4, 0, 0]} name="Recorded Incidents" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card title="Observed Historical Incidents by Stratigraphic Formation">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={fmChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="formation" stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                      <YAxis stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "6px" }} />
                      <Bar dataKey="count" fill="#38bdf8" radius={[4, 4, 0, 0]} name="Recorded Incidents" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            <Card title="Observed Incidents Distribution by Hazard Type">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={typeChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="type" stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "6px" }} />
                    <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Incident Count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}
