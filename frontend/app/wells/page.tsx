"use client";

import { AppShell, Card, Empty, ErrorBox, Skeleton } from "@/components/ui";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

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
};

export default function WellsPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const query = useQuery({
    queryKey: ["wells", q, status],
    queryFn: () => api<Well[]>(`/wells?q=${encodeURIComponent(q)}${status ? `&status=${status}` : ""}`),
  });

  return (
    <AppShell>
      <h1 className="text-xl font-semibold mb-4">Well explorer</h1>
      <div className="flex gap-2 mb-4">
        <input className="bg-navy-800 border border-navy-700 rounded px-3 py-2 text-sm" placeholder="Search SYN-WELL…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="bg-navy-800 border border-navy-700 rounded px-2" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All</option>
          <option value="drilling">drilling</option>
          <option value="drilled">drilled</option>
          <option value="abandoned">abandoned</option>
        </select>
      </div>
      {query.isLoading && <Skeleton />}
      {query.error && <ErrorBox error={query.error} />}
      <Card>
        {!query.data?.length && !query.isLoading && <Empty>No wells match filters.</Empty>}
        <table className="w-full text-sm">
          <thead className="text-slate-400 text-left">
            <tr>
              <th className="py-2">UID</th>
              <th>Name</th>
              <th>Status</th>
              <th>TD MD / TVD (m)</th>
              <th>Coordinates (demo)</th>
            </tr>
          </thead>
          <tbody>
            {query.data?.map((w) => (
              <tr key={w.id} className="border-t border-navy-700">
                <td className="py-2">
                  <Link className="text-accent-400" href={`/wells/${w.id}`}>{w.well_uid}</Link>
                  {w.is_active_demo && <span className="ml-2 text-[10px] text-accent-400">ACTIVE</span>}
                </td>
                <td>{w.name}</td>
                <td>{w.status}</td>
                <td>{w.total_depth_md_m ?? "—"} / {w.total_depth_tvd_m ?? "—"}</td>
                <td className="text-xs">{w.latitude.toFixed(5)}, {w.longitude.toFixed(5)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </AppShell>
  );
}
