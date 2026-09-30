"use client";

import { AppShell, Card, ErrorBox, toast } from "@/components/ui";
import { api, WS_URL, getToken } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const qc = useQueryClient();
  const settings = useQuery({ queryKey: ["settings"], queryFn: () => api<any>("/settings") });
  const sources = useQuery({ queryKey: ["sources"], queryFn: () => api<any[]>("/settings/sources") });
  const health = useQuery({ queryKey: ["health"], queryFn: () => api<any>("/health") });
  const sim = useQuery({ queryKey: ["sim"], queryFn: () => api<any>("/simulator/status"), refetchInterval: 3000 });
  const wells = useQuery({ queryKey: ["wells"], queryFn: () => api<any[]>("/wells") });
  const [scenario, setScenario] = useState("normal");
  const [sample, setSample] = useState<any>(null);

  const control = useMutation({
    mutationFn: (action: string) =>
      api("/simulator/control", {
        method: "POST",
        body: JSON.stringify({
          action,
          scenario,
          well_id: wells.data?.find((w: any) => w.is_active_demo)?.id,
        }),
      }),
    onSuccess: () => {
      toast("Simulator updated");
      qc.invalidateQueries({ queryKey: ["sim"] });
    },
  });

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(`${WS_URL}/ws/telemetry?token=${token}`);
      ws.onmessage = (ev) => {
        try {
          setSample(JSON.parse(ev.data));
        } catch {
          // ignore malformed packets
        }
      };
      ws.onerror = () => {
        // graceful fallback to REST polling
      };
    } catch {
      /* polling fallback via sim status query */
    }
    return () => {
      try {
        ws?.close();
      } catch {
        // no-op
      }
    };
  }, []);

  return (
    <AppShell>
      <h1 className="text-xl font-semibold mb-4">Settings, simulator & provenance</h1>
      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Live data simulator (synthetic)">
          <p className="text-xs text-amber-300 mb-2">SIMULATED TELEMETRY — adapter stub only; not connected to eRTMAC/SCADA.</p>
          <div className="flex flex-wrap gap-2 text-sm mb-3">
            <select className="bg-navy-800 border border-navy-700 rounded px-2" value={scenario} onChange={(e) => setScenario(e.target.value)}>
              <option value="normal">normal</option>
              <option value="losses">losses</option>
              <option value="torque_spike">torque_spike</option>
              <option value="flow_imbalance">flow_imbalance</option>
              <option value="pressure_anomaly">pressure_anomaly</option>
            </select>
            <button className="px-2 py-1 bg-accent-600 rounded" onClick={() => control.mutate("start")}>Start</button>
            <button className="px-2 py-1 bg-navy-700 rounded" onClick={() => control.mutate("pause")}>Pause</button>
            <button className="px-2 py-1 bg-navy-700 rounded" onClick={() => control.mutate("reset")}>Reset</button>
          </div>
          {control.error && <ErrorBox error={control.error} />}
          <pre className="text-xs text-slate-300 overflow-auto">{JSON.stringify(sample || sim.data?.last_sample, null, 2)}</pre>
        </Card>
        <Card title="System health">
          <pre className="text-xs overflow-auto">{JSON.stringify(health.data, null, 2)}</pre>
        </Card>
        <Card title="Data sources">
          <ul className="text-sm space-y-2">
            {sources.data?.map((s) => (
              <li key={s.code}>
                <strong>{s.name}</strong> — {s.status}
                <div className="text-slate-400 text-xs">{s.details}</div>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Configurable demo thresholds">
          <ul className="text-xs space-y-1">
            {settings.data &&
              Object.entries(settings.data.keys || {}).map(([k, v]: any) => (
                <li key={k}>
                  <span className="text-slate-400">{k}</span> = {v.value} — {v.description}
                </li>
              ))}
          </ul>
          <p className="text-xs text-slate-500 mt-2">{settings.data?.disclaimer}</p>
        </Card>
      </div>
    </AppShell>
  );
}
