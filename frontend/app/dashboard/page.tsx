"use client";

import { AppShell, Badge, Button, Card, ErrorBox, Skeleton } from "@/components/ui";
import { api, severityClass } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

type Summary = {
  active_well: { id: string; well_uid: string; name: string; status: string; latitude?: number; longitude?: number } | null;
  live: Record<string, number | string | boolean> | null;
  simulator: { running: boolean; scenario: string; label: string };
  nearby_wells_count: number;
  open_alerts: number;
  recent_events: { id: string; title: string; event_type: string; severity: string; md_m: number }[];
  trend: { timestamp: string; md_m: number; rop_m_per_hr: number; torque_knm: number; spp_kpa: number; pit_volume_m3: number }[];
  sources: { code: string; name: string; status: string }[];
  disclaimer: string;
};

type NearbyWell = {
  id: string;
  well_uid: string;
  name: string;
  distance_km: number;
  total_depth_md_m: number | null;
  formations: string[];
  event_count: number;
  highest_severity: string | null;
};

function Kpi({ label, value, unit, highlight }: { label: string; value: string | number; unit?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-3.5 border transition-all ${highlight ? "bg-teal-950/40 border-teal-500/40" : "bg-navy-800/90 border-navy-700/60"}`}>
      <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">{label}</div>
      <div className={`text-xl font-bold mt-1 font-mono ${highlight ? "text-teal-300" : "text-white"}`}>
        {value} <span className="text-xs font-normal text-slate-400 font-sans">{unit}</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [selectedWellId, setSelectedWellId] = useState<string>("");
  const [radiusKm, setRadiusKm] = useState<number>(8.0);

  // Fetch dashboard summary
  const q = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api<Summary>("/dashboard/summary"),
    refetchInterval: 4000,
  });

  // Fetch all wells for active well selector
  const wellsQ = useQuery({
    queryKey: ["wells-list"],
    queryFn: () => api<any[]>("/wells"),
  });

  const activeWellId = selectedWellId || q.data?.active_well?.id || "";

  // Fetch nearby offset wells for the chosen active well
  const nearbyQ = useQuery({
    queryKey: ["nearby-dashboard", activeWellId, radiusKm],
    queryFn: () => (activeWellId ? api<NearbyWell[]>(`/wells/nearby?well_id=${activeWellId}&radius_km=${radiusKm}`) : Promise.resolve([])),
    enabled: Boolean(activeWellId),
  });

  const activeWell = wellsQ.data?.find((w: any) => w.id === activeWellId) || q.data?.active_well;
  const nearestWell = nearbyQ.data && nearbyQ.data.length > 0 ? nearbyQ.data[0] : null;

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header & Active Well Selector */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-navy-800/80 border border-navy-700/60 p-5 rounded-xl backdrop-blur-sm">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Operations & Offset Intelligence
            </h1>
            <p className="text-xs text-slate-400">
              Real-time monitoring, offset well correlation, and predictive hazard intelligence
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Active Well Selector */}
            <div className="flex items-center gap-2 bg-navy-900/90 border border-navy-700 rounded-lg px-3 py-1.5">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Active Well:</span>
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
                <option value={8} className="bg-navy-900 text-white">8 km</option>
                <option value={10} className="bg-navy-900 text-white">10 km</option>
                <option value={25} className="bg-navy-900 text-white">25 km</option>
                <option value={50} className="bg-navy-900 text-white">50 km</option>
              </select>
            </div>

            {/* Open Map CTA */}
            <Link href={`/map?well_id=${activeWellId}&radius=${radiusKm}`}>
              <Button className="bg-teal-600 hover:bg-teal-500 text-white font-medium shadow-lg shadow-teal-900/30 flex items-center gap-2">
                <span>🗺️</span> Open Nearby Wells Map
              </Button>
            </Link>
          </div>
        </div>

        {q.isLoading && <Skeleton className="h-64 rounded-xl" />}
        {q.error && <ErrorBox error={q.error} />}

        {q.data && (
          <div className="space-y-6">
            {/* Active Status Badge Ribbon */}
            <div className="flex flex-wrap gap-2.5 items-center text-xs bg-navy-800/40 p-3 rounded-lg border border-navy-700/40">
              <span className="text-slate-400">Selected Target:</span>
              <strong className="text-white font-mono">{activeWell?.well_uid}</strong>
              <Badge className="bg-teal-900/80 text-teal-200 border-teal-600/40">{activeWell?.status || "ACTIVE"}</Badge>
              <Badge className="bg-amber-900/60 text-amber-200 border-amber-600/40">{q.data.simulator.label}</Badge>
              <span className="text-slate-400">
                Simulator {q.data.simulator.running ? "Streaming" : "Paused"} ({q.data.simulator.scenario})
              </span>
              <span className="ml-auto text-slate-500 font-mono text-[11px]">
                {nearbyQ.data?.length ?? 0} offset wells within {radiusKm} km
              </span>
            </div>

            {/* KPI Cards Grid */}
            {q.data.live && (
              <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
                <Kpi label="Current MD" value={Number(q.data.live.md_m).toFixed(1)} unit="m" />
                <Kpi label="Bit Depth" value={Number(q.data.live.bit_depth_m).toFixed(1)} unit="m" />
                <Kpi label="ROP" value={Number(q.data.live.rop_m_per_hr).toFixed(1)} unit="m/h" />
                <Kpi label="WOB" value={Number(q.data.live.wob_kn).toFixed(1)} unit="kN" />
                <Kpi label="Torque" value={Number(q.data.live.torque_knm).toFixed(1)} unit="kN·m" />
                <Kpi label="Rotary RPM" value={Number(q.data.live.rpm).toFixed(0)} />
                <Kpi label="Standpipe Press" value={Number(q.data.live.spp_kpa).toFixed(0)} unit="kPa" />
                <Kpi
                  label="Flow In / Out"
                  value={`${Number(q.data.live.flow_in_lpm).toFixed(0)} / ${Number(q.data.live.flow_out_lpm).toFixed(0)}`}
                  unit="L/min"
                />
                <Kpi label="Mud Weight" value={Number(q.data.live.mud_weight_sg).toFixed(3)} unit="SG" />
                <Kpi label="Active Pit" value={Number(q.data.live.pit_volume_m3).toFixed(2)} unit="m³" />
                <Kpi
                  label="Nearby Offsets"
                  value={nearbyQ.data ? nearbyQ.data.length : q.data.nearby_wells_count}
                  unit={`≤ ${radiusKm} km`}
                  highlight
                />
                <Kpi label="Open Alerts" value={q.data.open_alerts} highlight={q.data.open_alerts > 0} />
              </div>
            )}

            {/* Offset Well Intelligence Summary Banner */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-navy-800/80 border border-teal-700/40 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider text-teal-400 font-semibold">Nearest Offset Well</div>
                  {nearestWell ? (
                    <div className="mt-2">
                      <div className="text-lg font-bold text-white font-mono">{nearestWell.well_uid}</div>
                      <div className="text-xs text-slate-400">{nearestWell.name}</div>
                      <div className="text-sm font-semibold text-teal-300 mt-1 font-mono">
                        {nearestWell.distance_km.toFixed(2)} km away
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        TD: {nearestWell.total_depth_md_m} m MD · {nearestWell.event_count} recorded events
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 mt-2">No offset wells detected within {radiusKm} km.</div>
                  )}
                </div>
                <div className="mt-3 pt-3 border-t border-navy-700/60 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Search Radius: {radiusKm} km</span>
                  <Link href={`/map?well_id=${activeWellId}&radius=${radiusKm}`} className="text-xs text-teal-400 hover:text-teal-300 font-medium">
                    Explore on map →
                  </Link>
                </div>
              </div>

              <div className="bg-navy-800/80 border border-navy-700/60 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Offset Hazard Summary</div>
                  <div className="mt-2 space-y-1.5 text-xs text-slate-300">
                    <div className="flex justify-between">
                      <span>Total Offsets in Search Range:</span>
                      <strong className="text-white font-mono">{nearbyQ.data?.length ?? 0}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Historical Incident Events:</span>
                      <strong className="text-amber-300 font-mono">
                        {nearbyQ.data?.reduce((acc, w) => acc + w.event_count, 0) ?? 0}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>High/Critical Risk Offsets:</span>
                      <strong className="text-rose-300 font-mono">
                        {nearbyQ.data?.filter((w) => w.highest_severity === "critical" || w.highest_severity === "high").length ?? 0}
                      </strong>
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-navy-700/60 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">GIS PostGIS Engine</span>
                  <Link href="/risk" className="text-xs text-teal-400 hover:text-teal-300 font-medium">
                    Run Risk Assessment →
                  </Link>
                </div>
              </div>

              <div className="bg-navy-800/80 border border-navy-700/60 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Active Offset Quick Nav</div>
                  <div className="mt-2 space-y-1 overflow-y-auto max-h-24 pr-1">
                    {nearbyQ.data?.slice(0, 3).map((w) => (
                      <Link
                        key={w.id}
                        href={`/wells/${w.id}`}
                        className="flex items-center justify-between p-1.5 rounded hover:bg-navy-700/60 text-xs transition-colors"
                      >
                        <span className="font-mono text-teal-300">{w.well_uid}</span>
                        <span className="text-slate-400">{w.distance_km.toFixed(1)} km</span>
                      </Link>
                    ))}
                    {(!nearbyQ.data || nearbyQ.data.length === 0) && (
                      <span className="text-xs text-slate-400">No offset wells nearby.</span>
                    )}
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-navy-700/60 flex items-center justify-between">
                  <Link href={`/wells/${activeWellId}`} className="text-xs text-teal-400 hover:text-teal-300 font-medium">
                    View Active Well Profile →
                  </Link>
                </div>
              </div>
            </div>

            {/* Real-time Trend & Recent Events Charts */}
            <div className="grid lg:grid-cols-2 gap-4">
              <Card title="Real-time Drilling Trends (ROP & Torque vs Depth)">
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={q.data.trend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="md_m" stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 11 }} label={{ value: "Depth MD (m)", position: "insideBottom", offset: -5, fill: "#94a3b8" }} />
                      <YAxis stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "6px" }} />
                      <Line type="monotone" dataKey="rop_m_per_hr" stroke="#14b8a6" strokeWidth={2} dot={false} name="ROP (m/h)" />
                      <Line type="monotone" dataKey="torque_knm" stroke="#38bdf8" strokeWidth={2} dot={false} name="Torque (kN·m)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card title="Recent Historical Offset Events">
                <ul className="text-sm space-y-2.5">
                  {q.data.recent_events.map((e) => (
                    <li key={e.id} className="flex items-center justify-between gap-3 p-2.5 bg-navy-900/60 rounded-lg border border-navy-700/50">
                      <div className="space-y-0.5">
                        <div className="font-medium text-slate-200 text-xs">{e.title}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          MD {e.md_m} m · {e.event_type}
                        </div>
                      </div>
                      <Badge className={severityClass(e.severity)}>{e.severity?.toUpperCase()}</Badge>
                    </li>
                  ))}
                  {q.data.recent_events.length === 0 && (
                    <li className="text-xs text-slate-400 py-4 text-center">No recent offset events.</li>
                  )}
                </ul>
              </Card>
            </div>

            {/* Data Source & Provenance Status */}
            <Card title="Data Ingestion & Integrity Adapters">
              <ul className="text-xs grid md:grid-cols-3 gap-3">
                {q.data.sources.map((s) => (
                  <li key={s.code} className="flex items-center justify-between border border-navy-700/70 bg-navy-900/40 rounded-lg px-3 py-2.5">
                    <span className="font-medium text-slate-200">{s.name}</span>
                    <Badge className="bg-teal-950 text-teal-300 border-teal-800">{s.status}</Badge>
                  </li>
                ))}
              </ul>
              <div className="mt-4 pt-3 border-t border-navy-700/60 text-xs text-amber-300/80 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
                <span>{q.data.disclaimer}</span>
              </div>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}
