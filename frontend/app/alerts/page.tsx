"use client";

import { AppShell, Badge, Card, Empty, ErrorBox, toast } from "@/components/ui";
import { api, severityClass } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export default function AlertsPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState("open");
  const q = useQuery({ queryKey: ["alerts", status], queryFn: () => api<any[]>(`/alerts${status ? `?status=${status}` : ""}`) });
  const act = useMutation({
    mutationFn: ({ id, kind }: { id: string; kind: "acknowledge" | "resolve" }) =>
      api(`/alerts/${id}/${kind}`, { method: "POST", body: JSON.stringify({ note: "demo UI" }) }),
    onSuccess: () => {
      toast("Alert updated");
      qc.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  return (
    <AppShell>
      <h1 className="text-xl font-semibold mb-4">Alerts</h1>
      <select className="bg-navy-800 border border-navy-700 rounded px-2 py-1 text-sm mb-4" value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="open">open</option>
        <option value="acknowledged">acknowledged</option>
        <option value="resolved">resolved</option>
        <option value="">all</option>
      </select>
      {q.error && <ErrorBox error={q.error} />}
      {!q.data?.length && <Empty>No alerts in this filter. Start the simulator with an anomaly scenario to generate some.</Empty>}
      <div className="space-y-3">
        {q.data?.map((a) => (
          <Card key={a.id} title={a.title} action={<Badge className={severityClass(a.severity)}>{a.severity}</Badge>}>
            <div className="text-sm space-y-1">
              <div>Status {a.status} · MD {a.md_m} m · {a.event_type} · {a.created_at}</div>
              {a.distance_km != null && <div>Nearest matched offset {a.distance_km.toFixed(2)} km</div>}
              <div>{a.evidence}</div>
              <div className="text-accent-400">{a.recommendation}</div>
              <div className="flex gap-2 pt-2">
                <button className="px-2 py-1 bg-navy-700 rounded text-xs" onClick={() => act.mutate({ id: a.id, kind: "acknowledge" })}>Acknowledge</button>
                <button className="px-2 py-1 bg-navy-700 rounded text-xs" onClick={() => act.mutate({ id: a.id, kind: "resolve" })}>Resolve</button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
