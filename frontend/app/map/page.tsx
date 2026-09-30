"use client";

import { AppShell, Card, Empty, ErrorBox, Skeleton, Badge } from "@/components/ui";
import { api, statusClass, severityClass } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import "leaflet/dist/leaflet.css";

const WellMap = dynamic(() => import("@/components/WellMap"), { ssr: false });

type Well = {
  id: string;
  well_uid: string;
  name: string;
  status: string;
  latitude: number;
  longitude: number;
  total_depth_md_m?: number;
  total_depth_tvd_m?: number;
  is_active_demo: boolean;
  distance_km?: number;
  field_name?: string;
  operator?: string;
  highest_severity?: string | null;
  formations?: string[];
  recent_events?: string[];
  event_count?: number;
  formation_count?: number;
};

type Formation = {
  id: string;
  code: string;
  name: string;
  lithology: string;
};

export default function MapPage() {
  const [selectedWellId, setSelectedWellId] = useState<string>("");
  const [radius, setRadius] = useState<number>(10);
  const [status, setStatus] = useState<string>("");
  const [formation, setFormation] = useState<string>("");
  const [eventType, setEventType] = useState<string>("");
  const [riskLevel, setRiskLevel] = useState<string>("");
  const [sidebarSearch, setSidebarSearch] = useState<string>("");
  const [sortBy, setSortBy] = useState<"distance" | "depth" | "name">("distance");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [inspectedWellId, setInspectedWellId] = useState<string | null>(null);

  const wellsQ = useQuery({ queryKey: ["wells"], queryFn: () => api<Well[]>("/wells") });
  const formationsQ = useQuery({ queryKey: ["formations"], queryFn: () => api<Formation[]>("/wells/formations") });

  // Determine anchor well: user selection or default active demo well or first well
  const anchorWell = useMemo(() => {
    if (!wellsQ.data || wellsQ.data.length === 0) return null;
    if (selectedWellId) {
      return wellsQ.data.find((w) => w.id === selectedWellId) || wellsQ.data[0];
    }
    return wellsQ.data.find((w) => w.is_active_demo) || wellsQ.data[0];
  }, [wellsQ.data, selectedWellId]);

  const nearbyQ = useQuery({
    queryKey: ["nearby", anchorWell?.id, radius, status, formation, eventType, riskLevel],
    enabled: !!anchorWell,
    queryFn: () => {
      const params = new URLSearchParams({
        well_id: anchorWell!.id,
        radius_km: radius.toString(),
      });
      if (status) params.set("status", status);
      if (formation) params.set("formation", formation);
      if (eventType) params.set("event_type", eventType);
      if (riskLevel) params.set("risk_level", riskLevel);
      return api<Well[]>(`/wells/nearby?${params.toString()}`);
    },
  });

  const mapWells = useMemo(() => {
    const list = nearbyQ.data ? [...nearbyQ.data] : [];
    if (anchorWell) {
      list.unshift({ ...anchorWell, distance_km: 0 });
    }
    return list;
  }, [nearbyQ.data, anchorWell]);

  const filteredSidebarWells = useMemo(() => {
    let list = mapWells.filter((w) => {
      if (!sidebarSearch) return true;
      const term = sidebarSearch.toLowerCase();
      return (
        w.well_uid.toLowerCase().includes(term) ||
        w.name.toLowerCase().includes(term) ||
        (w.formations && w.formations.some((f) => f.toLowerCase().includes(term)))
      );
    });

    list.sort((a, b) => {
      // Always keep anchor well at the top of the sidebar list
      if (a.id === anchorWell?.id) return -1;
      if (b.id === anchorWell?.id) return 1;

      if (sortBy === "distance") {
        const da = a.distance_km ?? 0;
        const db = b.distance_km ?? 0;
        return sortDir === "asc" ? da - db : db - da;
      }
      if (sortBy === "depth") {
        const da = a.total_depth_md_m ?? 0;
        const db = b.total_depth_md_m ?? 0;
        return sortDir === "asc" ? da - db : db - da;
      }
      return sortDir === "asc" ? a.well_uid.localeCompare(b.well_uid) : b.well_uid.localeCompare(a.well_uid);
    });

    return list;
  }, [mapWells, sidebarSearch, sortBy, sortDir, anchorWell]);

  const center: [number, number] = anchorWell
    ? [anchorWell.latitude, anchorWell.longitude]
    : [Number(process.env.NEXT_PUBLIC_MAP_CENTER_LAT || 27.472), Number(process.env.NEXT_PUBLIC_MAP_CENTER_LON || 95.318)];

  const inspectedWell = useMemo(() => {
    if (!inspectedWellId) return anchorWell;
    return mapWells.find((w) => w.id === inspectedWellId) || anchorWell;
  }, [inspectedWellId, mapWells, anchorWell]);

  const stats = useMemo(() => {
    const offsets = nearbyQ.data || [];
    if (offsets.length === 0) return { count: 0, min: null, max: null, avg: null };
    const distances = offsets.map((w) => w.distance_km ?? 0);
    const min = Math.min(...distances);
    const max = Math.max(...distances);
    const avg = distances.reduce((a, b) => a + b, 0) / distances.length;
    return { count: offsets.length, min, max, avg };
  }, [nearbyQ.data]);

  return (
    <AppShell>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            Nearby Wells GIS Explorer
            <span className="text-xs bg-navy-800 text-teal-400 border border-teal-500/30 px-2 py-0.5 rounded">
              PostGIS Geospatial Engine
            </span>
          </h1>
          <p className="text-xs text-amber-300 mt-0.5">
            Geospatial calculations use WGS84 geography. All locations are synthetic demo coordinates in NWIS Synthetic Block A.
          </p>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="bg-navy-900 border border-navy-800 p-3 rounded-lg space-y-3 mb-4 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-1.5 text-slate-300 font-medium">
              Anchor Well:
              <select
                className="bg-navy-950 border border-navy-700 text-teal-300 rounded px-2.5 py-1 text-xs focus:ring-1 focus:ring-teal-500 font-semibold"
                value={anchorWell?.id || ""}
                onChange={(e) => {
                  setSelectedWellId(e.target.value);
                  setInspectedWellId(e.target.value);
                }}
              >
                {wellsQ.data?.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.well_uid} {w.is_active_demo ? "★ (Active Drilling)" : `(${w.status})`}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-1.5 text-slate-300">
              Status:
              <select
                className="bg-navy-950 border border-navy-700 text-slate-200 rounded px-2 py-1 text-xs"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="drilling">Drilling</option>
                <option value="drilled">Drilled</option>
                <option value="abandoned">Abandoned</option>
                <option value="sidetracked">Sidetracked</option>
                <option value="suspended">Suspended</option>
              </select>
            </label>

            <label className="flex items-center gap-1.5 text-slate-300">
              Formation:
              <select
                className="bg-navy-950 border border-navy-700 text-slate-200 rounded px-2 py-1 text-xs"
                value={formation}
                onChange={(e) => setFormation(e.target.value)}
              >
                <option value="">All Formations</option>
                {formationsQ.data?.map((f) => (
                  <option key={f.id} value={f.code}>
                    {f.code} ({f.lithology})
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-1.5 text-slate-300">
              Event:
              <select
                className="bg-navy-950 border border-navy-700 text-slate-200 rounded px-2 py-1 text-xs"
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
              >
                <option value="">All Events</option>
                <option value="mud_loss">Mud Loss / Lost Circ</option>
                <option value="kick">Kick / Influx</option>
                <option value="stuck_pipe">Stuck Pipe / Overpull</option>
                <option value="torque_spike">Torque Spike</option>
                <option value="cementing">Cementing Issue</option>
                <option value="tight_hole">Tight Hole</option>
              </select>
            </label>

            <label className="flex items-center gap-1.5 text-slate-300">
              Risk:
              <select
                className="bg-navy-950 border border-navy-700 text-slate-200 rounded px-2 py-1 text-xs"
                value={riskLevel}
                onChange={(e) => setRiskLevel(e.target.value)}
              >
                <option value="">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setStatus("");
                setFormation("");
                setEventType("");
                setRiskLevel("");
                setSidebarSearch("");
              }}
              className="px-2 py-1 bg-navy-800 hover:bg-navy-700 text-slate-400 hover:text-slate-200 rounded text-[11px] transition"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Radius Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-navy-800">
          <div className="flex items-center gap-2">
            <span className="text-slate-300 font-medium">Search Radius:</span>
            <input
              type="range"
              min={1}
              max={50}
              step={1}
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="accent-teal-500 w-36 cursor-pointer"
            />
            <span className="text-teal-400 font-mono text-xs font-bold w-12">{radius} km</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">Presets:</span>
            {[1, 5, 10, 25, 50].map((r) => (
              <button
                key={r}
                onClick={() => setRadius(r)}
                className={`px-2 py-0.5 text-[11px] rounded font-mono transition ${
                  radius === r
                    ? "bg-teal-600 text-white font-bold"
                    : "bg-navy-800 text-slate-300 hover:bg-navy-700 hover:text-white"
                }`}
              >
                {r} km
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-xs">
        <div className="bg-navy-900 border border-navy-800 p-2.5 rounded">
          <span className="text-slate-400">Nearby Wells in Radius</span>
          <div className="text-lg font-bold text-teal-400 mt-0.5">{stats.count}</div>
        </div>
        <div className="bg-navy-900 border border-navy-800 p-2.5 rounded">
          <span className="text-slate-400">Closest Offset</span>
          <div className="text-lg font-bold text-sky-400 mt-0.5">
            {stats.min != null ? `${stats.min.toFixed(2)} km` : "—"}
          </div>
        </div>
        <div className="bg-navy-900 border border-navy-800 p-2.5 rounded">
          <span className="text-slate-400">Furthest in Radius</span>
          <div className="text-lg font-bold text-slate-200 mt-0.5">
            {stats.max != null ? `${stats.max.toFixed(2)} km` : "—"}
          </div>
        </div>
        <div className="bg-navy-900 border border-navy-800 p-2.5 rounded">
          <span className="text-slate-400">Average Offset Distance</span>
          <div className="text-lg font-bold text-slate-300 mt-0.5">
            {stats.avg != null ? `${stats.avg.toFixed(2)} km` : "—"}
          </div>
        </div>
      </div>

      {wellsQ.isLoading && <Skeleton className="h-96" />}
      {nearbyQ.error && <ErrorBox error={nearbyQ.error} />}

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Leaflet Map Column */}
        <div className="lg:col-span-2 space-y-3">
          <Card
            title={`Interactive Spatial Map (${mapWells.length} wells in view)`}
            action={
              <div className="flex gap-2 text-xs">
                <button
                  onClick={() => anchorWell && setInspectedWellId(anchorWell.id)}
                  className="px-2 py-0.5 bg-teal-900/60 text-teal-300 border border-teal-500/40 rounded hover:bg-teal-900 transition text-[11px]"
                >
                  Center on Anchor
                </button>
              </div>
            }
          >
            <div className="h-[520px] rounded overflow-hidden border border-navy-700">
              {anchorWell && (
                <WellMap
                  center={center}
                  radiusKm={radius}
                  wells={mapWells}
                  activeId={anchorWell.id}
                  selectedId={inspectedWellId}
                  onSelectWell={(id) => setInspectedWellId(id)}
                />
              )}
              {!anchorWell && !wellsQ.isLoading && <Empty>No anchor well selected.</Empty>}
            </div>

            {/* Map Legend */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 mt-3 pt-2 border-t border-navy-800">
              <div className="flex flex-wrap gap-3 items-center">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded-full bg-teal-500 border border-white" />
                  Anchor ({anchorWell?.well_uid})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-sky-500 border border-white" />
                  Nominal Offset
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 border border-white" />
                  Medium Risk
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500 border border-white" />
                  High/Critical Risk
                </span>
                <span className="flex items-center gap-1 text-slate-500">
                  <span className="inline-block w-3 h-3 rounded-full border border-teal-500/60 bg-teal-500/10" />
                  {radius} km Search Boundary
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Nearby Wells Sidebar with Search, Sort, and Selected Inspection */}
        <div className="space-y-4">
          {/* Selected Well Inspector Card */}
          {inspectedWell && (
            <Card
              title={
                <div className="flex items-center justify-between">
                  <span>Selected: {inspectedWell.well_uid}</span>
                  {inspectedWell.id === anchorWell?.id ? (
                    <span className="text-[10px] bg-teal-900/80 text-teal-300 border border-teal-500/40 px-1.5 py-0.5 rounded font-mono">
                      ANCHOR
                    </span>
                  ) : (
                    <span className="text-[10px] bg-sky-900/80 text-sky-300 border border-sky-500/40 px-1.5 py-0.5 rounded font-mono">
                      OFFSET
                    </span>
                  )}
                </div>
              }
            >
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center pb-1.5 border-b border-navy-800">
                  <span className="text-slate-400">Status</span>
                  <Badge className={statusClass(inspectedWell.status)}>{inspectedWell.status}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Distance from Anchor</span>
                  <span className="text-teal-400 font-mono font-bold">
                    {inspectedWell.id === anchorWell?.id ? "0.00 km" : `${inspectedWell.distance_km?.toFixed(2)} km`}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Total Depth (MD / TVD)</span>
                  <span className="text-slate-200 font-mono">
                    {inspectedWell.total_depth_md_m ?? "—"} m / {inspectedWell.total_depth_tvd_m ?? "—"} m
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Field / Block</span>
                  <span className="text-slate-300">{inspectedWell.field_name || "NWIS Synthetic Block A"}</span>
                </div>

                {inspectedWell.highest_severity && (
                  <div className="flex justify-between items-center pt-1 border-t border-navy-800">
                    <span className="text-slate-400">Highest Risk Hazard</span>
                    <Badge className={severityClass(inspectedWell.highest_severity)}>
                      {inspectedWell.highest_severity}
                    </Badge>
                  </div>
                )}

                <div className="pt-2">
                  <Link
                    href={`/wells/${inspectedWell.id}`}
                    className="block text-center w-full py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded transition text-xs font-semibold shadow"
                  >
                    View Complete Well Profile →
                  </Link>
                </div>
              </div>
            </Card>
          )}

          {/* Searchable & Sortable Offset Wells Sidebar */}
          <Card
            title={
              <div className="flex items-center justify-between">
                <span>Offset Wells List ({filteredSidebarWells.length})</span>
                <span className="text-[10px] text-slate-400 font-normal">Click to Inspect</span>
              </div>
            }
          >
            <div className="space-y-2 mb-2">
              <input
                type="text"
                placeholder="Search well ID, name, formation..."
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                className="w-full bg-navy-950 border border-navy-700 rounded px-2.5 py-1 text-xs text-slate-200 placeholder:text-slate-500"
              />

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-1">
                  <span>Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-navy-950 border border-navy-700 text-slate-200 rounded px-1.5 py-0.5 text-[11px]"
                  >
                    <option value="distance">Distance</option>
                    <option value="depth">Total Depth</option>
                    <option value="name">Well UID</option>
                  </select>
                </div>
                <button
                  onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}
                  className="text-teal-400 hover:underline text-[11px]"
                >
                  {sortDir === "asc" ? "↑ Ascending" : "↓ Descending"}
                </button>
              </div>
            </div>

            {filteredSidebarWells.length === 0 && (
              <Empty>No offset wells match the selected radius and filters.</Empty>
            )}

            <div className="max-h-[360px] overflow-auto space-y-1.5 pr-1">
              {filteredSidebarWells.map((w) => {
                const isAnchor = w.id === anchorWell?.id;
                const isSelected = w.id === inspectedWell?.id;
                return (
                  <div
                    key={w.id}
                    onClick={() => setInspectedWellId(w.id)}
                    className={`p-2 rounded border text-xs cursor-pointer transition ${
                      isSelected
                        ? "bg-teal-950/60 border-teal-500/80 shadow"
                        : isAnchor
                        ? "bg-navy-900 border-teal-500/30 hover:bg-navy-800"
                        : "bg-navy-950 border-navy-800 hover:bg-navy-900"
                    }`}
                  >
                    <div className="flex items-center justify-between font-medium">
                      <span className={isAnchor ? "text-teal-400 font-bold" : "text-sky-300 font-semibold"}>
                        {w.well_uid} {isAnchor && "★"}
                      </span>
                      <span className="font-mono text-teal-300 font-bold">
                        {isAnchor ? "0.00 km" : `${w.distance_km?.toFixed(2) ?? "—"} km`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                      <span>Status: <span className="capitalize text-slate-300">{w.status}</span></span>
                      <span>TD: <span className="font-mono text-slate-300">{w.total_depth_md_m ?? "—"} m</span></span>
                    </div>

                    {w.formations && w.formations.length > 0 && (
                      <div className="text-[10px] text-slate-500 mt-1 truncate">
                        Fm: {w.formations.join(", ")}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}


