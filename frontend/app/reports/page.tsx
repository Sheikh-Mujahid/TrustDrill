"use client";

import { AppShell, Card, ErrorBox, toast } from "@/components/ui";
import { API_URL, getToken, api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export default function ReportsPage() {
  const wells = useQuery({ queryKey: ["wells"], queryFn: () => api<any[]>("/wells") });
  const [wellId, setWellId] = useState("");
  const [radiusKm, setRadiusKm] = useState<number>(25);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const active = wells.data?.find((w: any) => w.is_active_demo) || wells.data?.[0];
  const id = wellId || active?.id;

  async function handleDownload(path: string, filename: string, key: string) {
    try {
      setDownloading(key);
      setError(null);
      const token = getToken();
      const res = await fetch(`${API_URL}${path}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error(`Export failed with HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast(`Exported ${filename}`);
    } catch (err: any) {
      setError(err.message || "Export download failed");
    } finally {
      setDownloading(null);
    }
  }

  const selectedWell = wells.data?.find((w: any) => w.id === id);

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-navy-800/80 border border-navy-700/60 p-5 rounded-xl backdrop-blur-sm">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Compliance & Risk Intelligence Reports
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Export audit-ready reports, technical data tables, and evidence-backed risk summaries
            </p>
          </div>
          <div className="text-xs text-amber-300 bg-amber-950/60 border border-amber-800/60 px-3 py-2 rounded-lg">
            🛡️ All exported records contain synthetic provenance tags and transparent prototype methodology disclaimers.
          </div>
        </div>

        {error && <ErrorBox error={{ message: error }} />}

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Official Risk PDF */}
          <Card title="Risk Intelligence Report (PDF)">
            <p className="text-xs text-slate-400 mb-3">
              Official 9-section report with comparable wells, historical hazard indicators, page-level document citations, and methodology.
            </p>
            <div className="space-y-2 mt-auto">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 uppercase font-medium">Target Well:</label>
                <select
                  className="w-full bg-navy-900 border border-navy-700 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-teal-500"
                  value={id || ""}
                  onChange={(e) => setWellId(e.target.value)}
                >
                  {wells.data?.map((w: any) => (
                    <option key={w.id} value={w.id}>
                      {w.well_uid} ({w.name})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 uppercase font-medium">Radius (km):</label>
                <select
                  className="w-full bg-navy-900 border border-navy-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                >
                  <option value={5}>5 km</option>
                  <option value={10}>10 km</option>
                  <option value={25}>25 km</option>
                  <option value={50}>50 km</option>
                </select>
              </div>
              <button
                className="w-full mt-2 py-2 bg-teal-600 hover:bg-teal-500 rounded-lg text-xs font-semibold text-white shadow-md shadow-teal-900/30 transition disabled:opacity-50"
                disabled={!id || downloading === "risk_pdf"}
                onClick={() =>
                  handleDownload(
                    `/reports/risk_intelligence.pdf?well_id=${id}&radius_km=${radiusKm}`,
                    `trustdrill_risk_report_${selectedWell?.well_uid || id}.pdf`,
                    "risk_pdf"
                  )
                }
              >
                {downloading === "risk_pdf" ? "Generating PDF..." : "Export Risk PDF"}
              </button>
            </div>
          </Card>

          {/* Card 2: Risk Report JSON */}
          <Card title="Risk Intelligence (JSON)">
            <p className="text-xs text-slate-400 mb-3">
              Machine-readable structured export with full similarity breakdown, historical event links, and evidence citations.
            </p>
            <div className="space-y-2 mt-auto">
              <div className="text-xs text-slate-400 font-mono bg-navy-950 p-2 rounded border border-navy-800">
                Target: {selectedWell?.well_uid || "None"} ({radiusKm} km radius)
              </div>
              <button
                className="w-full py-2 bg-navy-700 hover:bg-navy-600 rounded-lg text-xs font-semibold text-slate-200 transition disabled:opacity-50"
                disabled={!id || downloading === "risk_json"}
                onClick={() =>
                  handleDownload(
                    `/reports/risk_intelligence.json?well_id=${id}&radius_km=${radiusKm}`,
                    `trustdrill_risk_${selectedWell?.well_uid || id}.json`,
                    "risk_json"
                  )
                }
              >
                {downloading === "risk_json" ? "Generating JSON..." : "Export Risk JSON"}
              </button>
            </div>
          </Card>

          {/* Card 3: Wells CSV */}
          <Card title="Wells Catalog (CSV)">
            <p className="text-xs text-slate-400 mb-3">
              Export all 12 synthetic wells with coordinates, operational status, total measured depths, and data provenance tags.
            </p>
            <div className="space-y-2 mt-auto">
              <div className="text-xs text-slate-400 font-mono bg-navy-950 p-2 rounded border border-navy-800">
                Total Wells: {wells.data?.length || 12}
              </div>
              <button
                className="w-full py-2 bg-navy-700 hover:bg-navy-600 rounded-lg text-xs font-semibold text-slate-200 transition disabled:opacity-50"
                onClick={() => handleDownload("/reports/wells.csv", "trustdrill_wells.csv", "wells")}
                disabled={downloading === "wells"}
              >
                {downloading === "wells" ? "Generating CSV..." : "Export Wells CSV"}
              </button>
            </div>
          </Card>

          {/* Card 4: Events CSV */}
          <Card title="Operational Events (CSV)">
            <p className="text-xs text-slate-400 mb-3">
              Export all historical drilling incidents, NPT records, mitigation actions, lessons learned, and depth intervals.
            </p>
            <div className="space-y-2 mt-auto">
              <div className="text-xs text-slate-400 font-mono bg-navy-950 p-2 rounded border border-navy-800">
                Includes mitigations & NPT
              </div>
              <button
                className="w-full py-2 bg-navy-700 hover:bg-navy-600 rounded-lg text-xs font-semibold text-slate-200 transition disabled:opacity-50"
                onClick={() => handleDownload("/reports/events.csv", "trustdrill_events.csv", "events")}
                disabled={downloading === "events"}
              >
                {downloading === "events" ? "Generating CSV..." : "Export Events CSV"}
              </button>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

